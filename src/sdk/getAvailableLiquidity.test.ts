import { describe, test, expect, jest } from '@jest/globals'

import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, providerRequiredFields } from '../api'
import { getAvailableLiquidity } from './getAvailableLiquidity'
import { FlyoverError } from '../client/httpClient'

/* eslint-disable @typescript-eslint/consistent-type-assertions */
const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  }
} as HttpClient
/* eslint-enable @typescript-eslint/consistent-type-assertions */

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
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    requiredConfirmations: 5
  }
}

describe('getAvailableLiquidity function should', () => {
  test('build url correctly', async () => {
    const clientSpy = jest.spyOn(mockClient, 'get')
    await getAvailableLiquidity(mockClient, providerMock)
    expect(clientSpy).toBeCalledWith('http://localhost:8080/providers/liquidity')
  })

  test('fail on provider missing properties', async () => {
    await expect(getAvailableLiquidity(mockClient, {} as any))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail if feature is disabled', async () => {
    expect.assertions(3)
    const featureDisabledProvider = structuredClone(providerMock)
    featureDisabledProvider.liquidityCheckEnabled = false
    await getAvailableLiquidity(mockClient, featureDisabledProvider)
      .catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Flyover error')
        expect(e.details).toBe('Liquidity check is not enabled for this provider')
      })
  })
})
