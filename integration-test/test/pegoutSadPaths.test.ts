import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainConnection, decodeBtcAddress, ethers, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { Flyover, type PegoutState, pegoutValueForAmount, SAT_TO_WEI } from '@rsksmart/flyover-sdk'
import { integrationTestConfig } from '../config'
import { EXTENDED_TIMEOUT } from './common/constants'
import { fakeTokenResolver, sleepSeconds } from './common/utils'
import {
  FLYOVER_CONFIGURATIONS_ABI, gasCost, PEGOUT_ESCROW_ABI, type PegOutLimits, readPegOutLimits, revertErrorName, staticCall
} from './common/pegoutEscrow'

const claimTimeoutSeconds = integrationTestConfig.pegoutClaimTimeoutSeconds
const testWithClaim = claimTimeoutSeconds === undefined ? test.skip : test

describe('Commit-first peg-out sad paths should', () => {
  let flyover: Flyover
  let flyoverOtherSender: Flyover
  let provider: ethers.providers.Provider
  let escrow: ethers.Contract
  let escrowOtherSender: ethers.Contract
  let limits: PegOutLimits
  let refundAddress: string
  let inRangeValue: bigint
  const destination = integrationTestConfig.btcAddress

  const balanceOf = async (address: string): Promise<bigint> => (await provider.getBalance(address)).toBigInt()

  const waitForState = async (requestHash: string, nonce: bigint, expected: PegoutState, timeoutSeconds: number): Promise<void> => {
    for (let waited = 0; waited < timeoutSeconds; waited += 5) {
      if (await flyover.getPegOutState(requestHash, nonce) === expected) {
        return
      }
      await sleepSeconds(5)
    }
    throw new Error(`Peg-out ${requestHash} did not reach ${expected} within ${timeoutSeconds} seconds`)
  }

  beforeAll(async () => {
    const { flyoverConfigurationsAddress, pegOutEscrowAddress, network, nodeUrl, testMnemonic } = integrationTestConfig
    assertTruthy(flyoverConfigurationsAddress, 'Missing test configuration: TEST_FLYOVER_CONFIGURATIONS_ADDRESS')
    assertTruthy(pegOutEscrowAddress, 'Missing test configuration: TEST_PEGOUT_ESCROW_ADDRESS')
    const config: FlyoverConfig = {
      network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver,
      disableChecksum: true,
      customFlyoverConfigurationsAddress: flyoverConfigurationsAddress,
      customPegOutEscrowAddress: pegOutEscrowAddress
    }
    const rsk = await BlockchainConnection.createUsingPassphrase(testMnemonic, nodeUrl)
    // unfunded on purpose: every call it makes is rejected before a transaction is sent, so it never pays gas
    const other = await BlockchainConnection.createUsingPassphrase(ethers.Wallet.createRandom().mnemonic.phrase, nodeUrl)
    flyover = new Flyover({ ...config })
    flyoverOtherSender = new Flyover({ ...config })
    await flyover.connectToRsk(rsk)
    await flyoverOtherSender.connectToRsk(other)

    const underlying = rsk.getUnderlyingProvider()
    assertTruthy(underlying, 'Missing RSK provider')
    provider = underlying
    escrow = new ethers.Contract(pegOutEscrowAddress, PEGOUT_ESCROW_ABI, rsk.signer)
    escrowOtherSender = escrow.connect(other.signer)
    limits = await readPegOutLimits(new ethers.Contract(flyoverConfigurationsAddress, FLYOVER_CONFIGURATIONS_ABI, provider))
    refundAddress = await rsk.getConnectedAddress()
    inRangeValue = pegoutValueForAmount(limits.minAmount, limits)
  }, EXTENDED_TIMEOUT)

  test('refund the whole deposit when the refund address cancels a REQUESTED peg-out, slashing nobody', async () => {
    const balanceBefore = await balanceOf(refundAddress)
    const { requestHash, txHash: requestTx, nonce } = await flyover.requestPegOut(destination, refundAddress, inRangeValue)
    assertTruthy(nonce, 'Missing request nonce')
    await expect(flyover.getPegOutState(requestHash, nonce)).resolves.toBe('REQUESTED')

    const cancelTx = await flyover.cancelPegOut(requestHash)

    await expect(flyover.getPegOutState(requestHash, nonce)).resolves.toBe('CANCELLED')
    // everything sent came back, so the account only paid gas for its two transactions
    const spentOnGas = await gasCost(provider, requestTx) + await gasCost(provider, cancelTx)
    expect(await balanceOf(refundAddress)).toBe(balanceBefore - spentOnGas)
    // the only event is the escrow's PegOutCancelled, so no collateral moved
    const { logs } = await provider.getTransactionReceipt(cancelTx)
    expect(logs.map(log => log.address.toLowerCase())).toEqual([escrow.address.toLowerCase()])
    expect(logs.map(log => escrow.interface.parseLog(log).name)).toEqual(['PegOutCancelled'])
  }, EXTENDED_TIMEOUT)

  test('reject a cancel from an address other than the refund address, leaving the peg-out REQUESTED', async () => {
    const { requestHash, nonce } = await flyover.requestPegOut(destination, refundAddress, inRangeValue)
    assertTruthy(nonce, 'Missing request nonce')

    // rejected by the SDK and by the escrow itself
    await expect(flyoverOtherSender.cancelPegOut(requestHash)).rejects.toMatchObject({ message: 'InvalidSender' })
    expect(await revertErrorName(staticCall(escrowOtherSender, 'cancelPegOut', '0x' + requestHash), escrow)).toBe('InvalidSender')
    await expect(flyover.getPegOutState(requestHash, nonce)).resolves.toBe('REQUESTED')

    // give the deposit back
    await flyover.cancelPegOut(requestHash)
  }, EXTENDED_TIMEOUT)

  test('reject an amount below minAmount without sending a transaction, as the escrow would', async () => {
    const value = pegoutValueForAmount(limits.minAmount - SAT_TO_WEI, limits)
    const balanceBefore = await balanceOf(refundAddress)
    const txCountBefore = await provider.getTransactionCount(refundAddress, 'pending')

    // rejected by the SDK and by the escrow itself
    await expect(flyover.requestPegOut(destination, refundAddress, value))
      .rejects.toMatchObject({ message: 'Peg-out not serviceable', details: { violatedBound: 'minAmount' } })
    expect(await balanceOf(refundAddress)).toBe(balanceBefore)
    expect(await provider.getTransactionCount(refundAddress, 'pending')).toBe(txCountBefore)
    const call = staticCall(escrow, 'requestPegOut', decodeBtcAddress(destination), refundAddress, { value })
    expect(await revertErrorName(call, escrow)).toBe('NotServiceable')
  }, EXTENDED_TIMEOUT)

  test('reject an amount above maxAmount without sending a transaction, as the escrow would', async () => {
    const value = pegoutValueForAmount(limits.maxAmount + SAT_TO_WEI, limits)
    const balanceBefore = await balanceOf(refundAddress)
    // the node checks the balance before running the call, so the escrow's revert needs a balance above the value
    if (balanceBefore <= value) {
      throw new Error(`Fund ${refundAddress} with more than ${value} wei to check the escrow's revert above maxAmount`)
    }
    const txCountBefore = await provider.getTransactionCount(refundAddress, 'pending')

    // rejected by the SDK and by the escrow itself
    await expect(flyover.requestPegOut(destination, refundAddress, value))
      .rejects.toMatchObject({ message: 'Peg-out not serviceable', details: { violatedBound: 'maxAmount' } })
    expect(await balanceOf(refundAddress)).toBe(balanceBefore)
    expect(await provider.getTransactionCount(refundAddress, 'pending')).toBe(txCountBefore)
    const call = staticCall(escrow, 'requestPegOut', decodeBtcAddress(destination), refundAddress, { value })
    expect(await revertErrorName(call, escrow)).toBe('NotServiceable')
  }, EXTENDED_TIMEOUT)

  testWithClaim('reject a cancel after an LP claimed the peg-out, leaving it CLAIMED and moving no funds', async () => {
    assertTruthy(claimTimeoutSeconds, 'Missing test configuration: TEST_PEGOUT_CLAIM_TIMEOUT_SECONDS')
    const { requestHash, nonce } = await flyover.requestPegOut(destination, refundAddress, inRangeValue)
    assertTruthy(nonce, 'Missing request nonce')
    await waitForState(requestHash, nonce, 'CLAIMED', claimTimeoutSeconds)
    const balanceBefore = await balanceOf(refundAddress)

    // the claim moved the peg-out to a new id, so the request id reads NONE
    await expect(flyover.cancelPegOut(requestHash))
      .rejects.toMatchObject({ message: 'InvalidState', details: { actual: 'NONE' } })
    expect(await revertErrorName(staticCall(escrow, 'cancelPegOut', '0x' + requestHash), escrow)).toBe('InvalidState')
    await expect(flyover.getPegOutState(requestHash, nonce)).resolves.toBe('CLAIMED')
    expect(await balanceOf(refundAddress)).toBe(balanceBefore)
  }, EXTENDED_TIMEOUT)
})
