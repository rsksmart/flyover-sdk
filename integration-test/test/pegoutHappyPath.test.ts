import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainConnection, ethers, type FlyoverConfig, getHttpClient, type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type AvailableLiquidity, Flyover, type PegoutEstimate, type PegoutRequest } from '@rsksmart/flyover-sdk'
import { integrationTestConfig } from '../config'
import { EXTENDED_TIMEOUT } from './common/constants'
import { fakeTokenResolver, sleepSeconds } from './common/utils'
import { eventFilter, gasCost, PEGOUT_CONTRACT_ABI, PEGOUT_ESCROW_ABI } from './common/pegoutEscrow'
import { type BtcTransaction, findMempoolTransaction, getBtcTransaction, mineBtcBlocks } from './common/bitcoind'

const SAT = BigInt('10000000000')
const POLL_SECONDS = 5
const BTC_BLOCK_INTERVAL_POLLS = 12
const CLAIM_TIMEOUT_SECONDS = 300
const PAYMENT_TIMEOUT_SECONDS = 300
const SETTLEMENT_TIMEOUT_SECONDS = 900

const describeOnRegtest = integrationTestConfig.network === 'Regtest' ? describe : describe.skip

async function waitFor<T> (
  description: string,
  timeoutSeconds: number,
  read: () => Promise<T | undefined>,
  betweenPolls?: () => Promise<void>
): Promise<T> {
  for (let waited = 0; waited <= timeoutSeconds; waited += POLL_SECONDS) {
    const result = await read()
    if (result !== undefined) {
      return result
    }
    await betweenPolls?.()
    await sleepSeconds(POLL_SECONDS)
  }
  throw new Error(`Timed out after ${timeoutSeconds} seconds waiting for ${description}`)
}

describeOnRegtest('Commit-first peg-out happy path should', () => {
  let flyover: Flyover
  let provider: ethers.providers.Provider
  let signer: ethers.Signer
  let escrow: ethers.Contract
  let pegOutContract: ethers.Contract
  let httpClient: HttpClient
  let lpsUrl: string
  let user: string
  let estimate: PegoutEstimate
  let liquidityBeforeRequest: bigint
  let request: PegoutRequest
  let nonce: bigint
  let requestBlock: number
  let total: bigint
  let quoteHash: string
  let lpAddress: string
  let payment: BtcTransaction
  const destination = integrationTestConfig.btcAddress

  const pegoutLiquidity = async (): Promise<bigint> =>
    (await httpClient.get<AvailableLiquidity>(`${lpsUrl}/providers/liquidity`)).pegoutLiquidityAmount

  const mineRskBlock = async (): Promise<void> => {
    await (await signer.sendTransaction({ to: user, value: 0 })).wait()
  }

  const balanceChanges = async (txHash: string, addresses: string[]): Promise<bigint[]> => {
    const { blockNumber } = await provider.getTransactionReceipt(txHash)
    return Promise.all(addresses.map(async address => {
      const [before, after] = await Promise.all([
        provider.getBalance(address, blockNumber - 1),
        provider.getBalance(address, blockNumber)
      ])
      return after.toBigInt() - before.toBigInt()
    }))
  }

  beforeAll(async () => {
    const { flyoverConfigurationsAddress, pegOutEscrowAddress, pegOutContractAddress, network, nodeUrl, testMnemonic } = integrationTestConfig
    assertTruthy(flyoverConfigurationsAddress, 'Missing test configuration: TEST_FLYOVER_CONFIGURATIONS_ADDRESS')
    assertTruthy(pegOutEscrowAddress, 'Missing test configuration: TEST_PEGOUT_ESCROW_ADDRESS')
    assertTruthy(pegOutContractAddress, 'Missing test configuration: TEST_PEGOUT_CONTRACT_ADDRESS')
    assertTruthy(integrationTestConfig.lpsUrl, 'Missing test configuration: TEST_LPS_URL')
    lpsUrl = integrationTestConfig.lpsUrl
    const config: FlyoverConfig = {
      network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver,
      disableChecksum: true,
      customFlyoverConfigurationsAddress: flyoverConfigurationsAddress,
      customPegOutEscrowAddress: pegOutEscrowAddress,
      customPegOutContractAddress: pegOutContractAddress
    }
    const rsk = await BlockchainConnection.createUsingPassphrase(testMnemonic, nodeUrl)
    flyover = new Flyover(config)
    await flyover.connectToRsk(rsk)

    const underlying = rsk.getUnderlyingProvider()
    assertTruthy(underlying, 'Missing RSK provider')
    provider = underlying
    signer = rsk.signer
    escrow = new ethers.Contract(pegOutEscrowAddress, PEGOUT_ESCROW_ABI, provider)
    pegOutContract = new ethers.Contract(pegOutContractAddress, PEGOUT_CONTRACT_ABI, provider)
    httpClient = getHttpClient(fakeTokenResolver)
    user = await rsk.getConnectedAddress()
  }, EXTENDED_TIMEOUT)

  test('estimate the peg-out from the on-chain configuration', async () => {
    estimate = await flyover.estimatePegOut(integrationTestConfig.pegoutAmount)

    expect(estimate.amount).toBe(integrationTestConfig.pegoutAmount)
    expect(estimate.value).toBe(estimate.amount + estimate.callFee + estimate.gasFee + estimate.change)
    expect(estimate.minimumBtcReceived).toBe(estimate.amount)
    liquidityBeforeRequest = await pegoutLiquidity()
  }, EXTENDED_TIMEOUT)

  test('escrow the estimated value under a REQUESTED request id', async () => {
    request = await flyover.requestPegOut(destination, user, estimate.value)
    assertTruthy(request.nonce, 'Missing request nonce')
    nonce = request.nonce
    requestBlock = (await provider.getTransactionReceipt(request.txHash)).blockNumber

    await expect(flyover.getPegOutState(request.requestHash, nonce)).resolves.toBe('REQUESTED')

    const stored = await escrow.getPegOutQuote('0x' + request.requestHash)
    expect([stored.value.toBigInt(), stored.callFee.toBigInt(), stored.gasFee.toBigInt()])
      .toEqual([estimate.amount, estimate.callFee, estimate.gasFee])
    total = estimate.amount + estimate.callFee + estimate.gasFee

    const [userChange, escrowChange] = await balanceChanges(request.txHash, [user, escrow.address])
    expect(escrowChange).toBe(total)
    expect(userChange).toBe(-total - await gasCost(provider, request.txHash))
  }, EXTENDED_TIMEOUT)

  test('leave the LPS peg-out liquidity unchanged while the peg-out waits for a claim', async () => {
    const liquidityAfterRequest = await pegoutLiquidity()
    await expect(flyover.getPegOutState(request.requestHash, nonce)).resolves.toBe('REQUESTED')

    expect(liquidityAfterRequest).toBe(liquidityBeforeRequest)
  }, EXTENDED_TIMEOUT)

  test('move the claimed peg-out to the completed-quote hash named in PegOutClaimed', async () => {
    const claim = await waitFor('the LPS to claim the peg-out', CLAIM_TIMEOUT_SECONDS, async () => {
      for (const event of await escrow.queryFilter(eventFilter(escrow, 'PegOutClaimed'), requestBlock)) {
        const claimed = await escrow.getPegOutQuote(event.args?.requestHash)
        if (claimed.nonce.toBigInt() === nonce && claimed.rskRefundAddress.toLowerCase() === user.toLowerCase()) {
          return event
        }
      }
      return undefined
    })
    assertTruthy(claim.args, 'Missing PegOutClaimed arguments')
    quoteHash = (claim.args.requestHash as string).slice(2)
    lpAddress = claim.args.lpAddress

    await expect(flyover.getPegOutState(quoteHash)).resolves.toBe('CLAIMED')
    await expect(flyover.getPegOutState(request.requestHash)).resolves.toBe('NONE')
    await expect(flyover.getPegOutState(request.requestHash, nonce)).resolves.toBe('CLAIMED')

    const [escrowChange, pegOutContractChange] = await balanceChanges(claim.transactionHash, [escrow.address, pegOutContract.address])
    expect(escrowChange).toBe(-total)
    expect(pegOutContractChange).toBe(total)
  }, EXTENDED_TIMEOUT)

  test('pay the destination in BTC with the completed-quote hash in the OP_RETURN', async () => {
    const opReturn = '6a20' + quoteHash
    payment = await waitFor('the LPS BTC payment', PAYMENT_TIMEOUT_SECONDS, async () => findMempoolTransaction(opReturn), mineRskBlock)
    const [delivery, nullData] = payment.outputs
    assertTruthy(delivery, 'Missing payment output 0')

    expect(nullData?.scriptHex).toBe(opReturn)
    expect(delivery.address).toBe(destination)

    expect(delivery.valueInSats * SAT).toBe(estimate.minimumBtcReceived)
  }, EXTENDED_TIMEOUT)

  test('settle as FULFILLED and pay the escrowed RBTC to the LP once the payment is confirmed', async () => {
    await mineBtcBlocks(Number(estimate.requiredConfirmations))
    let polls = 0
    await waitFor(
      'the LPS to refund the peg-out',
      SETTLEMENT_TIMEOUT_SECONDS,
      async () => await flyover.getPegOutState(quoteHash) === 'FULFILLED' ? true : undefined,
      async () => {
        polls += 1
        if (polls % BTC_BLOCK_INTERVAL_POLLS === 0) {
          await mineBtcBlocks(1)
        }
        await mineRskBlock()
      }
    )

    await expect(flyover.getPegOutState(request.requestHash, nonce)).resolves.toBe('FULFILLED')
    const { confirmations } = await getBtcTransaction(payment.txid)
    expect(BigInt(confirmations)).toBeGreaterThanOrEqual(estimate.requiredConfirmations)

    const [refund] = await pegOutContract.queryFilter(eventFilter(pegOutContract, 'PegOutRefunded', '0x' + quoteHash), requestBlock)
    assertTruthy(refund, 'Missing PegOutRefunded event')
    const [pegOutContractChange, lpChange] = await balanceChanges(refund.transactionHash, [pegOutContract.address, lpAddress])
    expect(pegOutContractChange).toBe(-total)
    expect(lpChange).toBe(total - await gasCost(provider, refund.transactionHash))
  }, EXTENDED_TIMEOUT)
})
