import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover } from '@rsksmart/flyover-sdk'
import { fakeTokenResolver } from './common/utils'
import { integrationTestConfig } from '../config'
import { EXTENDED_TIMEOUT } from './common/constants'

describe('Flyover SDK should perform the following liquidity provider related operations', () => {
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

  test('should fetch available liquidity', async () => {
    const providers = await flyover.getLiquidityProviders()
    const selectedProvider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(selectedProvider, 'Provider not found')
    flyover.useLiquidityProvider(selectedProvider)
    const availableLiquidity = await flyover.getAvailableLiquidity()
    expect(availableLiquidity?.peginLiquidityAmount).not.toBeUndefined()
    expect(availableLiquidity?.pegoutLiquidityAmount).not.toBeUndefined()
  }, EXTENDED_TIMEOUT)
})
