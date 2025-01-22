import { describe, test, expect } from '@jest/globals'
import { Flyover } from '@rsksmart/flyover-sdk'
import { readFile } from 'fs/promises'
import { TEST_URL } from './common/constants'
import ethProvider from 'eth-provider'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'

describe('Flyover Rsk connection should', () => {
  test('establish connection using json and password', async () => {
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    const rsk = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password, TEST_URL)
    const flyover = new Flyover({ rskConnection: rsk, network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') })
    const isConnected = await flyover.isConnected()
    expect(isConnected).toBe(true)
  })

  test('establish connection injected provider', async () => {
    // this library is a generic EIP1193 provider, so it simulates any
    // window.ethereum injected by wallets like metamask
    const provider: any = ethProvider(TEST_URL)
    const rsk = await BlockchainConnection.createUsingStandard(provider)
    const flyover = new Flyover({ rskConnection: rsk, network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') })
    const isConnected = await flyover.isConnected()
    expect(isConnected).toBe(true)
  })
})
