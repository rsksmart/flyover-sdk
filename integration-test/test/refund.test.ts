import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover, FlyoverUtils, type IsQuoteRefundableResponse } from '@rsksmart/flyover-sdk'
import { integrationTestConfig } from '../config'
import { EXTENDED_TIMEOUT } from './common/constants'
import { fakeTokenResolver, sleepSeconds } from './common/utils'

describe('FlyoverSDK refund applicability check should', () => {
  const WAIT_SECONDS_BEFORE_PAYMENT = 30
  const CHECK_LOOP_SECONDS_INTERVAL = 10
  let flyover: Flyover

  beforeAll(async () => {
    flyover = new Flyover({
      network: integrationTestConfig.network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver,
      disableChecksum: true
    })
    const rsk = await BlockchainConnection.createUsingPassphrase(
      integrationTestConfig.testMnemonic,
      integrationTestConfig.nodeUrl
    )
    await flyover.connectToRsk(rsk)
  })

  test('verify an expired pegout is refundable', async () => {
    const providers = await flyover.getLiquidityProviders()
    const selectedProvider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(selectedProvider, 'Provider not found')
    flyover.useLiquidityProvider(selectedProvider)

    const quotes = await flyover.getPegoutQuotes({
      to: integrationTestConfig.btcAddress,
      valueToTransfer: integrationTestConfig.pegoutAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    })

    const quote = quotes[0]
    assertTruthy(quote, 'Quote not found')
    const acceptedQuote = await flyover.acceptPegoutQuote(quote)
    assertTruthy(acceptedQuote, 'Accepted quote not found')

    console.debug(`Waiting before ${WAIT_SECONDS_BEFORE_PAYMENT} seconds before depositing...`)
    await sleepSeconds(WAIT_SECONDS_BEFORE_PAYMENT)
    const txHash = await flyover.depositPegout(quote, acceptedQuote.signature, FlyoverUtils.getQuoteTotal(quote))

    expect(txHash).toBeDefined()

    let result: IsQuoteRefundableResponse
    do {
      result = await flyover.isPegoutRefundable(quote)
      if (result.error !== undefined) {
        await sleepSeconds(CHECK_LOOP_SECONDS_INTERVAL)
        console.debug(`Check if pegout is refundable failed (${result.error.code}), retrying in ${CHECK_LOOP_SECONDS_INTERVAL}...`)
      }
    } while (result.error !== undefined)
    expect(result.error).toBeUndefined()
    expect(result.isRefundable).toBe(true)
  }, EXTENDED_TIMEOUT)
})
