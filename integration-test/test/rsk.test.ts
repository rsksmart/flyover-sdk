import { describe, test, expect } from '@jest/globals'
import { Flyover } from '@rsksmart/flyover-sdk'
import ethProvider from 'eth-provider'
import { BlockchainConnection, BlockchainReadOnlyConnection } from '@rsksmart/bridges-core-sdk'
import { fakeTokenResolver } from './common/utils'
import { integrationTestConfig } from '../config'
import { EXTENDED_TIMEOUT } from './common/constants'

describe('Flyover Rsk connection should', () => {
  test('establish connection using mnemonic phrase', async () => {
    const rsk = await BlockchainConnection.createUsingPassphrase(
      integrationTestConfig.testMnemonic,
      integrationTestConfig.nodeUrl
    )
    const flyover = new Flyover({ rskConnection: rsk, network: integrationTestConfig.network, captchaTokenResolver: fakeTokenResolver })
    const isConnected = await flyover.isConnected()
    expect(isConnected).toBe(true)
  }, EXTENDED_TIMEOUT)

  test('establish connection injected provider', async () => {
    // this library is a generic EIP1193 provider, so it simulates any
    // window.ethereum injected by wallets like metamask
    const provider: any = ethProvider(integrationTestConfig.nodeUrl)
    const rsk = await BlockchainConnection.createUsingStandard(provider)
    const flyover = new Flyover({ rskConnection: rsk, network: integrationTestConfig.network, captchaTokenResolver: fakeTokenResolver })
    const isConnected = await flyover.isConnected()
    expect(isConnected).toBe(true)
  }, EXTENDED_TIMEOUT)

  test('establish readonly connection', async () => {
    const rsk = await BlockchainReadOnlyConnection.createUsingRpc(integrationTestConfig.nodeUrl)
    const flyover = new Flyover({ rskConnection: rsk, network: integrationTestConfig.network, captchaTokenResolver: fakeTokenResolver })
    const isConnected = await flyover.isConnected()
    expect(isConnected).toBe(true)
  })
})
