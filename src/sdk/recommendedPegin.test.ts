import { describe, test, expect, jest } from '@jest/globals'
import { estimateRecommendedPegin } from './recommendedPegin'
import { FlyoverSDKContext } from '../utils/interfaces'
import { LiquidityProvider } from '../api'
import { HttpClient } from '@rsksmart/bridges-core-sdk'

const providerMock: LiquidityProvider = {
    id: 1,
    provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    apiBaseUrl: "http://localhost:8080",
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

const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  }
} as HttpClient

describe('estimateRecommendedPegin function should', () => {
    test('validate amount is provided', async () => {
        await expect(
            estimateRecommendedPegin({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, undefined as any, {})
        ).rejects.toThrow('Validation failed for object with following missing properties: amount')
    })
    test('validate provider is in the context', async () => {
        await expect(
            estimateRecommendedPegin({} as FlyoverSDKContext, BigInt(100), {})
        ).rejects.toThrow('Expected provider to be set')
    })
    test('throw error for invalid destination address', async () => {
        await expect(
            estimateRecommendedPegin({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt(100), { destinationAddress: 'invalid_address' })
        ).rejects.toThrow('Invalid RSK address')
    })
    test('throw error for invalid data format', async () => {
        await expect(
            estimateRecommendedPegin({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt(100), { data: 'invalid_data' })
        ).rejects.toThrow({ message: 'Flyover error', details: 'invalid data format' })
    })
    test('constructs request correctly', async () => {
        const clientSpy = jest.spyOn(mockClient, 'get')
        await estimateRecommendedPegin({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt("123456789987654321"), {})
        expect(clientSpy).toBeCalledWith('http://localhost:8080/pegin/recommended?amount=123456789987654321')
    })
    test('constructs request correctly appending data', async () => {
        const clientSpy = jest.spyOn(mockClient, 'get')
        await estimateRecommendedPegin({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt("123456789987654321"), { data: '0xdeadbeef' })
        expect(clientSpy).toBeCalledWith('http://localhost:8080/pegin/recommended?amount=123456789987654321&data=0xdeadbeef')
    })
    test('constructs request correctly appending destination address', async () => {
        const clientSpy = jest.spyOn(mockClient, 'get')
        await estimateRecommendedPegin({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt("123456789987654321"), { destinationAddress: '0x03f23ae1917722d5a27a2ea0bcc98725a2a2a49a' })
        expect(clientSpy).toBeCalledWith('http://localhost:8080/pegin/recommended?amount=123456789987654321&destination_address=0x03f23ae1917722d5a27a2ea0bcc98725a2a2a49a')
    })
})
