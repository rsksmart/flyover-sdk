import { describe, test, expect, jest } from '@jest/globals'
import { estimateRecommendedPegout } from './recommendedPegout'
import { FlyoverSDKContext } from '../utils/interfaces'
import { LiquidityProvider } from '../api'
import { HttpClient } from '@rsksmart/bridges-core-sdk'
import { BtcAddressType } from '../../lib'

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

describe('estimateRecommendedPegout function should', () => {
    test('validate amount is provided', async () => {
        await expect(
            estimateRecommendedPegout({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, undefined as any, {})
        ).rejects.toThrow('Validation failed for object with following missing properties: amount')
    })
    test('validate provider is in the context', async () => {
        await expect(
            estimateRecommendedPegout({} as FlyoverSDKContext, BigInt(100), {})
        ).rejects.toThrow('Expected provider to be set')
    })
    test('throw error for invalid destination address type', async () => {
        await expect(
            estimateRecommendedPegout({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt(100), { destinationAddressType: 'invalidType' as BtcAddressType })
        ).rejects.toThrow({ message: 'Flyover error', details: 'invalid btc address type'})
    })
    test('constructs request correctly', async () => {
        const clientSpy = jest.spyOn(mockClient, 'get')
        await estimateRecommendedPegout({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt("123456789987654321"), {})
        expect(clientSpy).toBeCalledWith('http://localhost:8080/pegout/recommended?amount=123456789987654321')
    })
    test('constructs request correctly appending destination address type', async () => {
        const clientSpy = jest.spyOn(mockClient, 'get')
        await estimateRecommendedPegout({ provider: providerMock, httpClient: mockClient } as FlyoverSDKContext, BigInt("123456789987654321"), { destinationAddressType: 'p2wsh' })
        expect(clientSpy).toBeCalledWith('http://localhost:8080/pegout/recommended?amount=123456789987654321&destination_type=p2wsh')
    })
})
