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
      signature: '1d246d9e91d1b372d266678f9ce915522912d88c5ce918364b442702a0ef591274083f4af0f483a794a965e74cfcf76ace04067c0ffbf14862acbb5ab0a8ad5d1b',
      bitcoinDepositAddressHash: 'any address hash'
    } as T)
  },
  getCaptchaToken: async () => Promise.resolve('')
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35',
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

const quoteMock: Quote = {
  quote: {
    fedBTCAddr: 'any addres',
    lbcAddr: 'any addres',
    lpRSKAddr: providerMock.provider,
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
    chainId: 31,
  },
  quoteHash: 'a1a6210bc03964779067d5acf23e5076639e4621a500f8ef3f87861eaabdb6e7'
}

const lbcMock = {
  pegInContract: {
    validatePeginDepositAddress: async (_quote: Quote, _depositAddress: string) => Promise.resolve(true),
    hashPeginQuoteEIP712: async (_quote: Quote) => Promise.resolve('0x85702c9a2cf27cda92c407fa8a495d489b4f06ff537bd576d67af802e289b3bb')
  }
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
    const otherQuote: Quote = { ...quoteMock, quote: { ...quoteMock.quote, lpRSKAddr: otherProvider.provider } }
    await acceptQuote(mockClient, lbcMock, otherProvider, otherQuote)
      .catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid signature')
      })
  })

  test('fail if address is not valid', async () => {
    const original = lbcMock.pegInContract.validatePeginDepositAddress
    lbcMock.pegInContract.validatePeginDepositAddress = async (_quote: Quote, _address: string) => Promise.resolve(false)
    expect.assertions(2)
    await acceptQuote(mockClient, lbcMock, providerMock, quoteMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Invalid BTC address')
    })
    lbcMock.pegInContract.validatePeginDepositAddress = original
  })
})
