import { describe, test, expect, beforeAll } from '@jest/globals'
import { assertTruthy, BlockchainConnection, type Network } from '@rsksmart/bridges-core-sdk'
import type { AcceptedPegoutQuote, PegoutQuote, PegoutQuoteRequest, IsQuotePaidResponse } from '@rsksmart/flyover-sdk'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver, getBitcoinDataSource } from './common/utils'
import { Flyover, FlyoverUtils } from '@rsksmart/flyover-sdk'

/**
 * This test verifies that the isQuotePaid function returns true if a pegout quote is paid.
 * It does so by getting a pegout quote and then checking in a loop if the quote is paid (by the user and the LPS).
 * As prerequisite, the test assumes there is a provider running in the background and also the minimum amount of
 * BTC blocks are mined.
 */
describe('isQuotePaid function should', () => {
  let flyover: Flyover
  let quotes: PegoutQuote[]
  let quote: PegoutQuote
  let acceptedQuote: AcceptedPegoutQuote

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

  test('return true if the quote is paid', async () => {
    const RETRY_INTERVAL = 10000 // Every 10 seconds

    // Get provider
    const providers = await flyover.getLiquidityProviders()

    const provider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(provider, 'Provider not found')
    flyover.useLiquidityProvider(provider)

    // Get quote
    const request: PegoutQuoteRequest = {
      rskRefundAddress: integrationTestConfig.rskAddress,
      to: integrationTestConfig.btcAddress,
      valueToTransfer: integrationTestConfig.pegoutAmount
    }

    quotes = await flyover.getPegoutQuotes(request)
    expect(quotes.length).toBeGreaterThan(0)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    quote = quotes[0]!

    // Accept quote
    acceptedQuote = await flyover.acceptPegoutQuote(quote)

    expect(acceptedQuote.signature).not.toBeUndefined()
    expect(acceptedQuote.lbcAddress).not.toBeUndefined()

    // Pay the BTC transaction as an user
    const txHash = await flyover.depositPegout(quote, acceptedQuote.signature, FlyoverUtils.getQuoteTotal(quote))
    expect([null, undefined, '']).not.toContain(txHash)

    // Wait for quote to be paid
    let response: IsQuotePaidResponse = { isPaid: false }
    while (!response.isPaid) {
      response = await flyover.isQuotePaid(quote.quoteHash, 'pegout')

      if (!response.isPaid) {
        console.info(`Pegout quote not paid yet. Retrying in ${RETRY_INTERVAL / 1000} seconds...`)
        await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL))
      }
    }

    // Check if the quote is paid
    expect(response.isPaid).toBe(true)
  }, 200000)
})
