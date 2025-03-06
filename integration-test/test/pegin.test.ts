import { describe, test, beforeAll, expect } from '@jest/globals'
import { type AcceptedQuote, Flyover, FlyoverUtils, type ValidatePeginTransactionOptions, type LiquidityProvider, type Quote } from '@rsksmart/flyover-sdk'
import { assertTruthy, ethers, BlockchainReadOnlyConnection } from '@rsksmart/bridges-core-sdk'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver, getUtxosFromMempoolSpace } from './common/utils'
import { Transaction, payments, networks } from 'bitcoinjs-lib'
import { TEST_CONTRACT_ABI } from './common/constants'

describe('Flyover pegin process should', () => {
  let flyover: Flyover
  let provider: LiquidityProvider
  let quotes: Quote[]
  let quote: Quote
  let acceptedQuote: AcceptedQuote

  beforeAll(async () => {
    flyover = new Flyover({
      network: integrationTestConfig.network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver,
      disableChecksum: true
    })
    const rsk = await BlockchainReadOnlyConnection.createUsingRpc(integrationTestConfig.nodeUrl)
    await flyover.connectToRsk(rsk)
  })

  test('return providers list from LiquidityBridgeContract', async () => {
    const providers = await flyover.getLiquidityProviders()
    const selectedProvider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(selectedProvider, 'Provider not found')
    provider = selectedProvider
    expect(providers.length).toBeGreaterThan(0)
    expect(provider?.apiBaseUrl).not.toBeUndefined()
    expect(provider?.id).not.toBeUndefined()
    expect(provider?.provider).not.toBeUndefined()
    expect(provider?.name).not.toBeUndefined()
    expect(provider?.status).not.toBeUndefined()
    expect(provider?.siteKey).not.toBeUndefined()
    expect(provider?.liquidityCheckEnabled).not.toBeUndefined()
    expect(provider?.providerType).not.toBeUndefined()
    if (provider?.providerType === 'pegin' || provider?.providerType === 'both') {
      expect(provider?.pegin).not.toBeUndefined()
      expect(provider?.pegin.fee).not.toBeUndefined()
      expect(provider?.pegin.feePercentage).not.toBeUndefined()
      expect(provider?.pegin.fixedFee).not.toBeUndefined()
      expect(provider?.pegin.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegin.minTransactionValue).not.toBeUndefined()
      expect(provider?.pegin.fixedFee).toBe(provider?.pegin.fee)
    }
    if (provider?.providerType === 'pegout' || provider?.providerType === 'both') {
      expect(provider?.pegout).not.toBeUndefined()
      expect(provider?.pegout.fee).not.toBeUndefined()
      expect(provider?.pegout.feePercentage).not.toBeUndefined()
      expect(provider?.pegout.fixedFee).not.toBeUndefined()
      expect(provider?.pegout.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegout.minTransactionValue).not.toBeUndefined()
      expect(provider?.pegout.fixedFee).toBe(provider?.pegout.fee)
    }
  })

  test('get quotes for a specific provider', async () => {
    flyover.useLiquidityProvider(provider)
    quotes = await flyover.getQuotes({
      callEoaOrContractAddress: integrationTestConfig.rskAddress,
      callContractArguments: '',
      valueToTransfer: integrationTestConfig.peginAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    })

    expect(quotes).toBeTruthy()
    expect(quotes.length).toBeGreaterThan(0)
    const { quote, quoteHash } = quotes[0]! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    expect(quoteHash).not.toBeUndefined()
    expect(quote.fedBTCAddr).not.toBeUndefined()
    expect(quote.lbcAddr).not.toBeUndefined()
    expect(quote.lpRSKAddr).not.toBeUndefined()
    expect(quote.btcRefundAddr).not.toBeUndefined()
    expect(quote.rskRefundAddr).not.toBeUndefined()
    expect(quote.lpBTCAddr).not.toBeUndefined()
    expect(quote.callFee).not.toBeUndefined()
    expect(quote.penaltyFee).not.toBeUndefined()
    expect(quote.contractAddr).not.toBeUndefined()
    expect(quote.data).not.toBeUndefined()
    expect(quote.gasLimit).not.toBeUndefined()
    expect(quote.gasFee).not.toBeUndefined()
    expect(quote.nonce).not.toBeUndefined()
    expect(quote.value).not.toBeUndefined()
    expect(quote.agreementTimestamp).not.toBeUndefined()
    expect(quote.timeForDeposit).not.toBeUndefined()
    expect(quote.lpCallTime).not.toBeUndefined()
    expect(quote.confirmations).not.toBeUndefined()
    expect(quote.callOnRegister).not.toBeUndefined()
    expect(quote.productFeeAmount).not.toBeUndefined()
  })

  // TODO we need to find a way to test functions with external dependency inside SDK
  // such as registerPegin or refundPegout
  test('accept specific quote', async () => {
    quote = quotes[0]! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    acceptedQuote = await flyover.acceptQuote(quote)

    expect(acceptedQuote.signature).not.toBeUndefined()
    expect(acceptedQuote.bitcoinDepositAddressHash).not.toBeUndefined()
  })

  test('get status of the accepted quote', async () => {
    const quoteHash = quote.quoteHash
    assertTruthy(quoteHash)
    const { detail, status, creationData } = await flyover.getPeginStatus(quoteHash)

    expect(detail).not.toBeUndefined()
    expect(status).not.toBeUndefined()
    expect(creationData).not.toBeUndefined()

    expect(detail.agreementTimestamp).not.toBeUndefined()
    expect(detail.btcRefundAddr).not.toBeUndefined()
    expect(detail.callFee).not.toBeUndefined()
    expect(detail.callOnRegister).not.toBeUndefined()
    expect(detail.confirmations).not.toBeUndefined()
    expect(detail.contractAddr).not.toBeUndefined()
    expect(detail.data).not.toBeUndefined()
    expect(detail.fedBTCAddr).not.toBeUndefined()
    expect(detail.gasFee).not.toBeUndefined()
    expect(detail.gasLimit).not.toBeUndefined()
    expect(detail.lbcAddr).not.toBeUndefined()
    expect(detail.lpBTCAddr).not.toBeUndefined()
    expect(detail.lpCallTime).not.toBeUndefined()
    expect(detail.lpRSKAddr).not.toBeUndefined()
    expect(detail.nonce).not.toBeUndefined()
    expect(detail.penaltyFee).not.toBeUndefined()
    expect(detail.productFeeAmount).not.toBeUndefined()
    expect(detail.rskRefundAddr).not.toBeUndefined()
    expect(detail.timeForDeposit).not.toBeUndefined()
    expect(detail.value).not.toBeUndefined()

    expect(status.callForUserTxHash).not.toBeUndefined()
    expect(status.depositAddress).not.toBeUndefined()
    expect(status.quoteHash).not.toBeUndefined()
    expect(status.registerPeginTxHash).not.toBeUndefined()
    expect(status.requiredLiquidity).not.toBeUndefined()
    expect(status.signature).not.toBeUndefined()
    expect(status.state).not.toBeUndefined()
    expect(status.userBtcTxHash).not.toBeUndefined()

    expect(creationData.fixedFee).not.toBeUndefined()
    expect(creationData.gasPrice).not.toBeUndefined()
    expect(creationData.percentageFee).not.toBeUndefined()
  })

  test('validate the PegIn deposit transaction', async () => {
    const tx = new Transaction()
    const options: ValidatePeginTransactionOptions = {
      throwError: true
    }

    const weiTotal = FlyoverUtils.getQuoteTotal(quote)
    const satToWeiConversion = BigInt(10) ** BigInt(10)
    let satsTotal = weiTotal / satToWeiConversion
    if (weiTotal % satToWeiConversion !== BigInt(0)) {
      satsTotal += BigInt(1)
    }
    const payment = payments.p2sh({ address: acceptedQuote.bitcoinDepositAddressHash, network: networks.testnet })
    assertTruthy(payment.output)
    tx.addOutput(payment.output, Number(satsTotal))

    const availableUtxos = await getUtxosFromMempoolSpace(
      integrationTestConfig.mempoolSpaceUrl,
      // we use the pegout address because we just need an address with UTXOs
      // to fund the tx, we're not going to actually sign it
      integrationTestConfig.btcAddress
    )

    let total = BigInt(0)
    let i = 0
    while (total < satsTotal && i < availableUtxos.length) {
      const utxo = availableUtxos[i]
      assertTruthy(utxo)
      tx.addInput(Buffer.from(utxo.txid, 'hex'), utxo.vout)
      total += utxo.value
      i++
    }
    if (total < satsTotal) {
      throw new Error('Not enough UTXOs to fund the transaction')
    }
    const result = await flyover.validatePeginTransaction({
      quoteInfo: quote,
      acceptInfo: acceptedQuote,
      btcTx: tx.toHex()
    }, options)
    expect(result).toBe('')
  })

  test('get a smart contract interaction quote', async () => {
    const smartContractData = new ethers.utils.Interface(TEST_CONTRACT_ABI)
      .encodeFunctionData('save', [integrationTestConfig.rskAddress])
    flyover.useLiquidityProvider(provider)
    const prefixedQuote = await flyover.getQuotes({
      callEoaOrContractAddress: integrationTestConfig.testContractAddress,
      callContractArguments: smartContractData,
      valueToTransfer: integrationTestConfig.peginAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    }).then(result => result[0])

    const notPrefixedQuote = await flyover.getQuotes({
      callEoaOrContractAddress: integrationTestConfig.testContractAddress,
      callContractArguments: smartContractData.slice(2),
      valueToTransfer: integrationTestConfig.peginAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    }).then(result => result[0])

    expect(prefixedQuote).not.toBeUndefined()
    expect(notPrefixedQuote).not.toBeUndefined()
    expect(prefixedQuote?.quote.contractAddr).toBe(integrationTestConfig.testContractAddress)
    expect(notPrefixedQuote?.quote.contractAddr).toBe(integrationTestConfig.testContractAddress)
    expect(prefixedQuote?.quote.data).toBe(smartContractData.slice(2))
    expect(notPrefixedQuote?.quote.data).toBe(smartContractData.slice(2))

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    const acceptedPrefixed = await flyover.acceptQuote(prefixedQuote!)
    const acceptedNotPrefixed = await flyover.acceptQuote(notPrefixedQuote!)
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
    expect(acceptedPrefixed.bitcoinDepositAddressHash).not.toBeUndefined()
    expect(acceptedNotPrefixed.bitcoinDepositAddressHash).not.toBeUndefined()

    console.info('Prefixed quote payment address:', acceptedPrefixed.bitcoinDepositAddressHash)
    console.info('Not prefixed quote payment address:', acceptedNotPrefixed.bitcoinDepositAddressHash)
  })
})
