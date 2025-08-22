import { describe, test, expect, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import {
  type PegoutQuote, type LiquidityProvider, pegoutQuoteDetailRequiredFields,
  pegoutQuoteRequiredFields, providerRequiredFields
} from '../api'
import { FlyoverError } from '../client/httpClient'
import { acceptPegoutQuote } from './acceptPegoutQuote'

const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  },
  async post<T>(_url: string, _body: object) {
    return Promise.resolve({
      signature: '6bd8d8adb95b381a0c13d6823c3a890f323af022fd946f4e7fc70d7778413b527e0f33475fd1311e00f7976afd098badb03260ee29ca97d73c987b17c6d471e41b',
      lbcAddress: 'any address hash'
    } as T)
  },
  getCaptchaToken: async () => Promise.resolve('')
}

const quoteMock: PegoutQuote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddress: 'any address',
    callFee: BigInt(1),
    depositAddr: 'any address',
    depositConfirmations: 1,
    depositDateLimit: 1,
    expireBlocks: 1,
    expireDate: 1,
    gasFee: BigInt(1),
    lbcAddress: 'any address',
    liquidityProviderRskAddress: 'any address',
    lpBtcAddr: 'any address',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddress: 'any address',
    transferConfirmations: 1,
    transferTime: 1,
    value: BigInt(1),
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: '8e7a1f104628f98780cb8ecf438534e9480b43525ede379995ee5838a407ef32'
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  apiBaseUrl: 'http://localhost:8081',
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

describe('acceptPegoutQuote function should', () => {
  test('build url correctly', async () => {
    const clientSpy = jest.spyOn(mockClient, 'post')
    await acceptPegoutQuote(mockClient, providerMock, quoteMock)
    expect(clientSpy).toBeCalledWith(
      'http://localhost:8081/pegout/acceptQuote',
      { QuoteHash: quoteMock.quoteHash },
      { includeCaptcha: true }
    )
  })

  test('convert response to AcceptedPegoutQuote correctly', async () => {
    const acceptedQuote = await acceptPegoutQuote(mockClient, providerMock, quoteMock)
    expect(acceptedQuote.lbcAddress).toBeTruthy()
    expect(acceptedQuote.signature).toBeTruthy()
  })

  test('fail on PegoutQuote missing properties', async () => {
    await expect(acceptPegoutQuote(mockClient, providerMock, {} as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
    await expect(acceptPegoutQuote(mockClient, providerMock, { quoteHash: 'any hash', quote: {} } as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteDetailRequiredFields.join(', ')}`)
  })

  test('fail on Provider missing properties', async () => {
    await expect(acceptPegoutQuote(mockClient, {} as any, quoteMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail if signature is not valid', async () => {
    expect.assertions(2)
    const otherProvider: LiquidityProvider = { ...providerMock, provider: '0xd6F117d8194Eba2fCA8bD63B2E259Dbea40E07d9' }
    await acceptPegoutQuote(mockClient, otherProvider, quoteMock)
      .catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid signature')
      })
  })
})
