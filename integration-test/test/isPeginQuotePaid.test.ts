import { describe, test, expect, beforeAll } from '@jest/globals'
import { assertTruthy, BlockchainConnection, type Network } from '@rsksmart/bridges-core-sdk'
import type { AcceptedQuote, PeginQuoteRequest, Quote } from '../../src/api'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver } from './common/utils'
import { Flyover } from '../../src/sdk/flyover'
import type { IsQuotePaidResponse } from '../../src/utils/interfaces'

/**
 * This test verifies that the isQuotePaid function returns true if a pegin quote is paid.
 * It does so by getting a pegin quote and then checking in a loop if the quote is paid (by the user and the LPS).
 * The BTC payment should be done outside this test and the test will show in the console the information for the payment.
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
      network: integrationTestConfig.network as Network,
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

  test('return true if a pegin quote is paid', async () => {
    const RETRY_INTERVAL = 10000 // Every 10 seconds

    // Get provider
    const providers = await flyover.getLiquidityProviders()

    const provider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(provider, 'Provider not found')
    flyover.useLiquidityProvider(provider)
    console.info(`Provider selected. Id: ${provider.id}, name: ${provider.name}`)

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

    // Info for payment
    console.info(`Please proceed to pay the quote. \n BTC Address:  ${acceptedQuote.bitcoinDepositAddressHash}
      \nAmount: ${quote.quote.value} \nTime for deposit: ${quote.quote.timeForDeposit} seconds`)

    // Wait for quote to be paid
    let response: IsQuotePaidResponse = { isPaid: false }
    while (!response.isPaid) {
      response = await flyover.isQuotePaid(quote.quoteHash, 'pegin')
      console.info(`Response: ${JSON.stringify(response)}`)

      if (!response.isPaid) {
        console.info(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL))
      }
    }

    // Check if the quote is paid
    expect(response.isPaid).toBe(true)
  }, 200000)
})
