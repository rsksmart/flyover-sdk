import { describe, test, expect, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type Quote, type LiquidityProvider, quoteDetailRequiredFields, quoteRequiredFields, providerRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { acceptQuote } from './acceptQuote'

const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  },
  async post<T>(_url: string, _body: object) {
    return Promise.resolve({
      signature: '02e620159216c49acb29a0f32ba6e190fab648667aab4027de41c134665f6c2b103065818178c108ab9a0603d16ae10c57e974151b057c3276a4c9a646a3559a1b',
      bitcoinDepositAddressHash: 'any address hash'
    } as T)
  },
  getCaptchaToken: async () => Promise.resolve('')
}

const quoteMock: Quote = {
  quote: {
    fedBTCAddr: 'any addres',
    lbcAddr: 'any addres',
    lpRSKAddr: 'any addres',
    btcRefundAddr: 'any addres',
    rskRefundAddr: 'any addres',
    lpBTCAddr: 'any addres',
    callFee: BigInt(1),
    penaltyFee: BigInt(1),
    contractAddr: 'any addres',
    data: 'any data',
    gasLimit: 1,
    nonce: BigInt(1),
    gasFee: BigInt(1),
    value: BigInt('9007199254750000'),
    agreementTimestamp: 1,
    timeForDeposit: 1,
    lpCallTime: 1,
    confirmations: 1,
    callOnRegister: true,
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: 'a1a6210bc03964779067d5acf23e5076639e4621a500f8ef3f87861eaabdb6e7'
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  apiBaseUrl: 'http://localhost:8081',
  name: 'any name',
  status: true,
  providerType: 'pegin',
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

const lbcMock = {
  validatePeginDepositAddress: async (_quote: Quote, _depositAddress: string) => Promise.resolve(true)
} as LiquidityBridgeContract

describe('acceptQuote function should', () => {
  test('build url correctly', async () => {
    const clientSpy = jest.spyOn(mockClient, 'post')
    await acceptQuote(mockClient, lbcMock, providerMock, quoteMock)
    expect(clientSpy).toBeCalledWith(
      'http://localhost:8081/pegin/acceptQuote',
      { QuoteHash: quoteMock.quoteHash },
      { includeCaptcha: true }
    )
  })

  test('convert response to AcceptedQuote correctly', async () => {
    const acceptedQuote = await acceptQuote(mockClient, lbcMock, providerMock, quoteMock)
    expect(acceptedQuote.bitcoinDepositAddressHash).toBeTruthy()
    expect(acceptedQuote.signature).toBeTruthy()
  })

  test('fail on Quote missing properties', async () => {
    await expect(acceptQuote(mockClient, lbcMock, providerMock, {} as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${quoteRequiredFields.join(', ')}`)
    await expect(acceptQuote(mockClient, lbcMock, providerMock, { quoteHash: 'any hash', quote: {} } as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${quoteDetailRequiredFields.join(', ')}`)
  })

  test('fail on Provider missing properties', async () => {
    await expect(acceptQuote(mockClient, lbcMock, {} as any, quoteMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail if signature is not valid', async () => {
    expect.assertions(2)
    const otherProvider: LiquidityProvider = { ...providerMock, provider: '0xd6F117d8194Eba2fCA8bD63B2E259Dbea40E07d9' }
    await acceptQuote(mockClient, lbcMock, otherProvider, quoteMock)
      .catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid signature')
      })
  })

  test('fail if address is not valid', async () => {
    const original = lbcMock.validatePeginDepositAddress
    lbcMock.validatePeginDepositAddress = async (_quote: Quote, _address: string) => Promise.resolve(false)
    expect.assertions(2)
    await acceptQuote(mockClient, lbcMock, providerMock, quoteMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Invalid BTC address')
    })
    lbcMock.validatePeginDepositAddress = original
  })
})
