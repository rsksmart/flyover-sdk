import { describe, test, expect, jest } from '@jest/globals'

import { getPeginStatus } from './getPeginStatus'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, providerRequiredFields } from '../api'

const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  }
} as HttpClient

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  apiBaseUrl: 'http://localhost:8080',
  name: 'any name',
  status: true,
  providerType: 'pegout',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  }
}

describe('getPeginStatus function should', () => {
  test('build url correctly', async () => {
    const quoteHash = '8e7a1f104628f98780cb8ecf438534e9480b43525ede379995ee5838a407ef32'
    const clientSpy = jest.spyOn(mockClient, 'get')
    await getPeginStatus(mockClient, providerMock, quoteHash)
    expect(clientSpy).toBeCalledWith('http://localhost:8080/pegin/status?quoteHash=' + quoteHash)
  })

  test('fail when quoteHash is not present', async () => {
    const quoteHash: string | undefined = undefined
    const errorMsg = 'Validation failed for object with following missing properties: quoteHash'
    await expect(getPeginStatus(mockClient, providerMock, '')).rejects.toThrow(errorMsg)
    await expect(getPeginStatus(mockClient, providerMock, quoteHash as any)).rejects.toThrow(errorMsg)
  })

  test('fail on provider missing properties', async () => {
    await expect(getPeginStatus(mockClient, {} as any, '1234'))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })
})
