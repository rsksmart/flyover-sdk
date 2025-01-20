import { describe, test, expect, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { getProviders } from './getProviders'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type LiquidityProviderBase, type LiquidityProviderDetail } from '..'
import JSONbig from 'json-bigint'

const detailMock: LiquidityProviderDetail = {
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    fee: BigInt(1),
    maxTransactionValue: BigInt(2),
    minTransactionValue: BigInt(1),
    requiredConfirmations: 3
  },
  pegout: {
    fee: BigInt(1),
    maxTransactionValue: BigInt(2),
    minTransactionValue: BigInt(1),
    requiredConfirmations: 3
  }
}

const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve(detailMock as M)
  },
  async post<M>(_url: string, _body: object) {
    return Promise.resolve({} as M) // eslint-disable-line @typescript-eslint/consistent-type-assertions
  },
  getCaptchaToken: async () => Promise.resolve('')
}

const providersMock: LiquidityProviderBase[] = [
  {
    id: 1,
    provider: 'any address',
    apiBaseUrl: 'http://localhost:8080',
    name: 'any name',
    providerType: 'both',
    status: true
  },
  {
    id: 2,
    provider: 'any address 2',
    apiBaseUrl: 'http://localhost:8081',
    name: 'any name 2',
    providerType: 'both',
    status: true
  }
]

const lbcMock = { // eslint-disable-line @typescript-eslint/consistent-type-assertions
  getProviders: async () => Promise.resolve(providersMock)
} as LiquidityBridgeContract

describe('getProviders function should', () => {
  test('build result correctly', async () => {
    const result = await getProviders(mockClient, lbcMock)
    expect(result.at(0)).toEqual({ ...providersMock[0], ...detailMock })
    expect(result.at(1)).toEqual({ ...providersMock[1], ...detailMock })
    expect(result.length).toBe(2)
  })

  test('call getProviders', async () => {
    const spy = jest.spyOn(lbcMock, 'getProviders')
    await getProviders(mockClient, lbcMock)
    expect(spy).toHaveBeenCalledTimes(1)
  })

  test('call provider details', async () => {
    const clientSpy = jest.spyOn(mockClient, 'get')
    await getProviders(mockClient, lbcMock)
    expect(clientSpy.mock.calls.at(0)?.at(0)).toBe('http://localhost:8080/providers/details')
    expect(clientSpy.mock.calls.at(1)?.at(0)).toBe('http://localhost:8081/providers/details')
    expect(clientSpy).toBeCalledTimes(2)
  })

  test('work if one of the providers is not available', async () => {
    const serializer = JSONbig({ useNativeBigInt: true })
    const clientSpy = jest.spyOn(mockClient, 'get')
    clientSpy.mockRejectedValueOnce('an error')
    const result = await getProviders(mockClient, lbcMock)
    expect(clientSpy.mock.calls.at(0)?.at(0)).toBe('http://localhost:8080/providers/details')
    expect(clientSpy.mock.calls.at(1)?.at(0)).toBe('http://localhost:8081/providers/details')
    expect(clientSpy).toBeCalledTimes(2)
    expect(serializer.stringify(result.at(0))).toEqual(serializer.stringify({ ...providersMock[1], ...detailMock }))
    expect(result).toHaveLength(1)
  })
})
