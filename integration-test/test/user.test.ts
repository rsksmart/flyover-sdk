import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainReadOnlyConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover } from '@rsksmart/flyover-sdk'
import { fakeTokenResolver } from './common/utils'
import { integrationTestConfig } from '../config'

describe('Flyover SDK client should', () => {
  let flyover: Flyover
  beforeAll(async () => {
    flyover = new Flyover({
      network: integrationTestConfig.network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver
    })
    const rsk = await BlockchainReadOnlyConnection.createUsingRpc(integrationTestConfig.nodeUrl)
    await flyover.connectToRsk(rsk)
  })

  test('Return Events', async () => {
    const providers = await flyover.getLiquidityProviders()
    const provider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(provider, 'Provider not found')
    flyover.useLiquidityProvider(provider)
    const quotes = await flyover.getUserQuotes(integrationTestConfig.rskAddress)
    expect(quotes).toBeDefined()
  })
})
