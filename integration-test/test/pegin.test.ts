import { describe, test, beforeAll, expect } from '@jest/globals'
import { readFile } from 'fs/promises'
import { type AcceptedQuote, Flyover, FlyoverUtils, type ValidatePeginTransactionOptions, type LiquidityProvider, type Quote } from '@rsksmart/flyover-sdk'
import { TEST_URL } from './common/constants'
import { BlockchainConnection, assertTruthy } from '@rsksmart/bridges-core-sdk'

describe('Flyover pegin process should', () => {
  let flyover: Flyover
  let providers: LiquidityProvider[]
  let quotes: Quote[]
  let quote: Quote
  let acceptedQuote: AcceptedQuote

  beforeAll(async () => {
    flyover = new Flyover({
      network: 'Regtest',
      allowInsecureConnections: true,
      captchaTokenResolver: async () => Promise.resolve(''),
      disableChecksum: true
    })
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    const rsk = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password, TEST_URL)
    await flyover.connectToRsk(rsk)
  })

  test('return providers list from LiquidityBridgeContract', async () => {
    providers = await flyover.getLiquidityProviders()
    const provider = providers.at(0)
    expect(providers).toBeTruthy()
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
      expect(provider?.pegin.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegin.minTransactionValue).not.toBeUndefined()
    }
    if (provider?.providerType === 'pegout' || provider?.providerType === 'both') {
      expect(provider?.pegout).not.toBeUndefined()
      expect(provider?.pegout.fee).not.toBeUndefined()
      expect(provider?.pegout.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegout.minTransactionValue).not.toBeUndefined()
    }
  })

  test('get quotes for a specific provider', async () => {
    const provider = providers[0]! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    flyover.useLiquidityProvider(provider)
    quotes = await flyover.getQuotes({
      callEoaOrContractAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
      callContractArguments: '',
      valueToTransfer: BigInt('600000000000000000'),
      rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1'
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
    const { detail, status } = await flyover.getPeginStatus(quoteHash)

    expect(detail).not.toBeUndefined()
    expect(status).not.toBeUndefined()

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
  })

  test('validate the PegIn deposit transaction', async () => {
    const rpcUrl = 'http://localhost:5555/wallet/main'
    const rpcUser = 'test'
    const rpcPassword = 'test'

    const options: ValidatePeginTransactionOptions = {
      throwError: true
    }

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(rpcUser + ':' + rpcPassword).toString('base64')
    }
    const weiTotal = FlyoverUtils.getQuoteTotal(quote)
    const satToWeiConversion = BigInt(10) ** BigInt(10)
    const btcToSatConversion = BigInt(10) ** BigInt(8)
    let satsTotal = weiTotal / satToWeiConversion
    if (weiTotal % satToWeiConversion !== BigInt(0)) {
      satsTotal += BigInt(1)
    }
    const createResult = await fetch(rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'createrawtransaction',
        params: {
          outputs: {
            [acceptedQuote.bitcoinDepositAddressHash]: Number(satsTotal) / Number(btcToSatConversion)
          }
        }
      })
    }).then(async res => res.json())

    const fundResult = await fetch(rpcUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 0,
        method: 'fundrawtransaction',
        params: [createResult.result, { fee_rate: 25 }]
      })
    }).then(async res => res.json())

    const result = await flyover.validatePeginTransaction({
      quoteInfo: quote,
      acceptInfo: acceptedQuote,
      btcTx: fundResult.result.hex
    }, options)
    expect(result).toBe('')
  })
})
