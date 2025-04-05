import { describe, test, expect, beforeAll } from '@jest/globals'
import { assertTruthy, BlockchainConnection, type Network } from '@rsksmart/bridges-core-sdk'
import { type AcceptedQuote, type Quote, Flyover, type IsQuoteRefundableResponse } from '@rsksmart/flyover-sdk'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver, getBitcoinDataSource } from './common/utils'

describe('refundPegin function should', () => {
  let flyover: Flyover
  let quotes: Quote[]
  let quote: Quote
  let acceptedQuote: AcceptedQuote

  beforeAll(async () => {
    flyover = new Flyover({
      network: integrationTestConfig.network as Network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver,
      disableChecksum: true
    })

    const rskConnection = await BlockchainConnection.createUsingPassphrase(
      integrationTestConfig.testMnemonic,
      integrationTestConfig.nodeUrl
    )

    const bitcoinDataSource = getBitcoinDataSource(integrationTestConfig.network)

    await flyover.connectToRsk(rskConnection)
    flyover.connectToBitcoin(bitcoinDataSource)
  })

  test('refund a pegin quote', async () => {
    const RETRY_INTERVAL = 10000 // Every 10 seconds

    // Get provider
    const providers = await flyover.getLiquidityProviders()

    const provider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(provider, 'Provider not found')
    flyover.useLiquidityProvider(provider)

    // Get quote
    quotes = await flyover.getQuotes({
      callEoaOrContractAddress: integrationTestConfig.rskAddress,
      callContractArguments: '',
      valueToTransfer: integrationTestConfig.peginAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    })

    expect(quotes.length).toBeGreaterThan(0)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    quote = quotes[0]!

    // Accept quote
    acceptedQuote = await flyover.acceptQuote(quote)

    expect(acceptedQuote.signature).not.toBeUndefined()
    expect(acceptedQuote.bitcoinDepositAddressHash).not.toBeUndefined()

    // Display info for payment
    // Here is required a manual intervention to simulate user's action. There are two options:
    // 1. Wait until the quote is expired and then proceed to pay the amount in BTC (the time for deposit is displayed in the console).
    // 2. Pay on time and then turn the LPS off so the quote is not payed by the LPS.
    // A payment with a segwit transaction is not required but recommended.
    console.info(`Please proceed to pay the quote. \n BTC Address:  ${acceptedQuote.bitcoinDepositAddressHash}
      \nAmount: ${quote.quote.value} \nTime for deposit: ${quote.quote.timeForDeposit} seconds`)

    // Get the BTC transaction from the terminal. The user should type it and then press enter.
    const txHash = await new Promise<string>(resolve => {
      console.info('Please enter the BTC transaction hash:')
      process.stdin.once('data', (data) => {
        resolve(data.toString().trim())
      })
    })
    console.info('txHash', txHash)
    process.stdin.destroy()

    // Check in a loop until the quote is refundable
    let response: IsQuoteRefundableResponse = { isRefundable: false }
    while (!response.isRefundable) {
      response = await flyover.isPeginRefundable(quote, acceptedQuote.signature, txHash)
      console.info(`Response: ${JSON.stringify(response)}`)

      if (!response.isRefundable) {
        console.info(`The pegin is not refundable yet. Retrying in ${RETRY_INTERVAL / 1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL))
      }
    }

    expect(response.isRefundable).toBe(true)

    const refundTxHash = await flyover.refundPegin(quote, acceptedQuote.signature, txHash)
    console.info('Success, txHash: ', refundTxHash)
  }, 200000)
})
