import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover } from '@rsksmart/flyover-sdk'
import { readFile } from 'fs/promises'
import { TEST_URL } from './common/constants'

describe('Flyover SDK client should', () => {
  let flyover: Flyover
  let rsk: BlockchainConnection
  beforeAll(async () => {
    flyover = new Flyover({ network: 'Regtest', allowInsecureConnections: true, captchaTokenResolver: async () => Promise.resolve('') })
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    rsk = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password, TEST_URL)
    await flyover.connectToRsk(rsk)
  })

  test('Return Events', async () => {
    const providersList = await flyover.getLiquidityProviders()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const provider = providersList[0]!
    flyover.useLiquidityProvider(provider)
    const providers = await flyover.getUserQuotes('0x0987654321098765432109876543210987654321')
    expect(providers).toBeDefined()
  })
})
