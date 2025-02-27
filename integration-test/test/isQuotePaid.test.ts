import { describe, test, expect, beforeAll } from '@jest/globals'
import { assertTruthy, BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import type { AcceptedQuote, PeginQuoteRequest, Quote } from '../../src/api'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver } from './common/utils'
import { Flyover } from '../../src/sdk/flyover'

/**
 * This test verifies that the isQuotePaid function returns true if the quote is paid.
 * It does so by getting a quote, waiting for it to be paid, and then checking if the quote is paid.
 * The waiting time is 1.5 times the deposit time. During this time, the quote should be paid manually.
 * As prerequisite, the test assumes there is a provider running in the background and also the minimum amount of
 * BTC blocks are mined.
 */
describe('isQuotePaid function should', () => {
  let flyover: Flyover
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

    const rskConnection = await BlockchainConnection.createUsingPassphrase(
      integrationTestConfig.testMnemonic,
      integrationTestConfig.nodeUrl
    )

    await flyover.connectToRsk(rskConnection)
  })

  test('return true if the quote is paid', async () => {
    // Get provider
    const providers = await flyover.getLiquidityProviders()

    const provider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(provider, 'Provider not found')
    flyover.useLiquidityProvider(provider)
    console.log(`Provider selected. Id: ${provider.id}, name: ${provider.name}`)

    // Get quote
    const request: PeginQuoteRequest = {
      callEoaOrContractAddress: integrationTestConfig.rskAddress,
      callContractArguments: '',
      valueToTransfer: integrationTestConfig.peginAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    }
    quotes = await flyover.getQuotes(request)

    expect(quotes.length).toBeGreaterThan(0)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    quote = quotes[0]!

    // Accept quote
    acceptedQuote = await flyover.acceptQuote(quote)

    expect(acceptedQuote.signature).not.toBeUndefined()
    expect(acceptedQuote.bitcoinDepositAddressHash).not.toBeUndefined()

    console.log(`Please proceed to pay the quote. \n BTC Address:  ${acceptedQuote.bitcoinDepositAddressHash}
      \n amount: ${quote.quote.value} \nTime for deposit: ${quote.quote.timeForDeposit} seconds`)

    // Wait for 1.5 times the deposit time
    const waitTimeMs = quote.quote.timeForDeposit * 1000 * 1.5
    console.log(`Waiting for ${waitTimeMs / 1000} seconds...`)
    await new Promise(resolve => setTimeout(resolve, waitTimeMs))

    // Check if the quote is paid
    const response = await flyover.isQuotePaid(quote.quoteHash)
    expect(response.isPaid).toBe(true)
  }, 200000)
})
