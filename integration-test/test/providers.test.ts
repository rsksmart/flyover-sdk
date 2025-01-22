import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { readFile } from 'fs/promises'
import { Flyover } from '@rsksmart/flyover-sdk'
import { TEST_URL } from './common/constants'

describe('Flyover SDK should perform the following liquidity provider related operations', () => {
  let flyover: Flyover

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

  test('should fetch available liquidity', async () => {
    const providers = await flyover.getLiquidityProviders()
    const provider = providers.at(0)
    if (!provider) {
      throw new Error('No provider found')
    }
    flyover.useLiquidityProvider(provider)
    const availableLiquidity = await flyover.getAvailableLiquidity()
    expect(availableLiquidity?.peginLiquidityAmount).not.toBeUndefined()
    expect(availableLiquidity?.pegoutLiquidityAmount).not.toBeUndefined()
  })
})
