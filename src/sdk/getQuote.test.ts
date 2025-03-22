import { describe, test, expect, jest } from '@jest/globals'
import { providerRequiredFields, type Quote, type QuoteDetail, quoteRequestRequiredFields, quoteRequiredFields, quoteDetailRequiredFields, type LiquidityProvider, type PeginQuoteRequest } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { type HttpClient, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { getQuote } from './getQuote'
import * as validation from '../utils/validation'
import { BTC_ZERO_ADDRESS_MAINNET } from '@rsksmart/bridges-core-sdk'

const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  },
  post: async <M>(_url: string, _body: object) => Promise.resolve([quoteResponseMock] as M),
  getCaptchaToken: async () => Promise.resolve('')
}

const mockSanitizedClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  },
  post: async <M>(_url: string, _body: object) => Promise.resolve([quoteResponseSanitizedMock] as M),
  getCaptchaToken: async () => Promise.resolve('')
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: 'any address',
  apiBaseUrl: 'http://localhost:8081',
  name: 'any name',
  status: true,
  providerType: 'pegin',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    requiredConfirmations: 7,
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1)
  },
  pegout: {
    requiredConfirmations: 5,
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1)
  }
}

const quoteRequestMock: PeginQuoteRequest = {
  callEoaOrContractAddress: '0xF5ad1A6F6BA49C507Bb24676bbF80b8ed19B694c',
  callContractArguments: '',
  rskRefundAddress: '0xB050eE2D61c7A5fd4f2ed193f752fBa85E18b1d4',
  valueToTransfer: BigInt('9007199254750000')
}

const quoteRequestToSanitizeMock: PeginQuoteRequest = {
  callEoaOrContractAddress: '0xF5ad1A6F6BA49C507Bb24676bbF80b8ed19B694c',
  callContractArguments: '0x',
  rskRefundAddress: '0xB050eE2D61c7A5fd4f2ed193f752fBa85E18b1d4',
  valueToTransfer: BigInt('9007199254750000')
}

const quoteResponseMock: Quote =
  {
    quote: {
      fedBTCAddr: 'any addres',
      lbcAddr: 'any addres',
      lpRSKAddr: 'any addres',
      btcRefundAddr: BTC_ZERO_ADDRESS_MAINNET,
      rskRefundAddr: quoteRequestMock.rskRefundAddress,
      lpBTCAddr: 'any addres',
      callFee: BigInt(1),
      penaltyFee: BigInt(1),
      contractAddr: quoteRequestMock.callEoaOrContractAddress,
      data: quoteRequestMock.callContractArguments,
      gasLimit: 1,
      nonce: BigInt(1),
      value: quoteRequestMock.valueToTransfer,
      agreementTimestamp: 1,
      timeForDeposit: 1,
      lpCallTime: 1,
      confirmations: 1,
      callOnRegister: true,
      gasFee: BigInt(1),
      productFeeAmount: BigInt(50000000000000)
    },
    quoteHash: 'any hash'
  }

const quoteResponseSanitizedMock: Quote =
  {
    quote: {
      fedBTCAddr: 'any addres',
      lbcAddr: 'any addres',
      lpRSKAddr: 'any addres',
      btcRefundAddr: BTC_ZERO_ADDRESS_MAINNET,
      rskRefundAddr: quoteRequestToSanitizeMock.rskRefundAddress,
      lpBTCAddr: 'any addres',
      callFee: BigInt(1),
      penaltyFee: BigInt(1),
      contractAddr: quoteRequestToSanitizeMock.callEoaOrContractAddress,
      data: '',
      gasLimit: 1,
      nonce: BigInt(1),
      value: quoteRequestToSanitizeMock.valueToTransfer,
      agreementTimestamp: 1,
      timeForDeposit: 1,
      lpCallTime: 1,
      confirmations: 1,
      callOnRegister: true,
      gasFee: BigInt(1),
      productFeeAmount: BigInt(50000000000000)
    },
    quoteHash: 'any hash'
  }

const lbcMock = {
  hashPeginQuote: async (quote: Quote) => Promise.resolve(quote.quoteHash)
} as LiquidityBridgeContract

const configMock: FlyoverConfig = {
  network: 'Mainnet',
  captchaTokenResolver: async () => Promise.resolve('')
}

describe('getQuote function should', () => {
  test('build url correctly', async () => {
    const clientSpy = jest.spyOn(mockClient, 'post')
    await getQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock)
    expect(clientSpy).toBeCalledWith('http://localhost:8081/pegin/getQuote', quoteRequestMock)
  })

  test('convert response to Quote array correctly', async () => {
    const client = { ...mockClient }
    const data = 'c1f1d1'
    const request = { ...quoteRequestMock }
    const dataMock = structuredClone(quoteResponseMock)
    request.callContractArguments = data
    dataMock.quote.data = data
    client.post = async <T>(_url: string, _body: object) => Promise.resolve([dataMock] as T)
    const quotes = await getQuote(configMock, client, lbcMock, providerMock, request)
    const quote = quotes[0]! // eslint-disable-line @typescript-eslint/no-non-null-assertion

    expect(quotes).toBeTruthy()
    quoteDetailRequiredFields.forEach(requiredField => { expect(quote.quote[requiredField as keyof QuoteDetail]).toBeTruthy() })
    quoteRequiredFields.forEach(requiredField => { expect(quote[requiredField as keyof Quote]).toBeTruthy() })
  })

  test('fail on Provider missing properties', async () => {
    await expect(getQuote(configMock, mockClient, lbcMock, {} as any, quoteRequestMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail on QuoteRequest missing properties', async () => {
    await expect(getQuote(configMock, mockClient, lbcMock, providerMock, {} as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${quoteRequestRequiredFields.join(', ')}`)
  })

  test('fail invalid rsk address', async () => {
    const addresses: string[] = [
      'anything',
      'mhghaQCHedKZZQuFqSzg6Z3Rf1TqqDEPCc',
      '0x7Z4890A0f1D4bBf2C669Ac2d1efFa185c505359b',
      '0x7C4890A0f1D4bBf2C669Ac2d1efFa185c505359N',
      '1230x7C4890A0f1D4bBf2C669Ac2d1efFa185c505359b',
      '1230x7C4890A0f1D4bBf2C669Ac2d1efFa185c505359bbb'
    ]
    expect.assertions(addresses.length * 2 * 3)

    for (const address of addresses) {
      const quote = { ...quoteRequestMock }
      quote.rskRefundAddress = address
      const quoteResponse = structuredClone(quoteResponseMock)
      quoteResponse.quote.contractAddr = quote.callEoaOrContractAddress

      await getQuote(configMock, mockClient, lbcMock, providerMock, quote).catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid RSK address')
        expect(e.details).toBe(`Address ${address} is not a valid RSK address.`)
      })
    }

    for (const address of addresses) {
      const quote = { ...quoteRequestMock }
      quote.rskRefundAddress = address
      const quoteResponse = structuredClone(quoteResponseMock)
      quoteResponse.quote.rskRefundAddr = quote.rskRefundAddress

      await getQuote(configMock, mockClient, lbcMock, providerMock, quote).catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid RSK address')
        expect(e.details).toBe(`Address ${address} is not a valid RSK address.`)
      })
    }
  })

  test('validate quote hash', async () => {
    const original = lbcMock.hashPeginQuote
    lbcMock.hashPeginQuote = async (_: Quote) => Promise.resolve('fake hash')
    expect.assertions(2)
    await getQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Quote hash mismatch')
    })
    lbcMock.hashPeginQuote = original
  })

  test('validate response fields', async () => {
    const oldQuote = quoteResponseMock.quote
    const badQuote = structuredClone(quoteResponseMock.quote)
    badQuote.value = BigInt(500)
    badQuote.btcRefundAddr = 'bad lp address'
    badQuote.rskRefundAddr = 'bad lp address'
    badQuote.contractAddr = 'bad lp address'
    badQuote.data = 'bad lp data'
    quoteResponseMock.quote = badQuote
    expect.assertions(2)
    await getQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Manipulated quote response')
    })
    quoteResponseMock.quote = oldQuote
  })

  test('invoke validateRskChecksum function', async () => {
    jest.spyOn(validation, 'validateRskChecksum')
    await getQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock)
    expect(validation.validateRskChecksum).toBeCalledTimes(1)
    expect(validation.validateRskChecksum).toBeCalledWith(configMock, quoteRequestMock.callEoaOrContractAddress, quoteRequestMock.rskRefundAddress)
  })

  test('sanitize call contract arguments correctly', async () => {
    const clientSpy = jest.spyOn(mockSanitizedClient, 'post')
    await getQuote(configMock, mockSanitizedClient, lbcMock, providerMock, quoteRequestToSanitizeMock)
    expect(clientSpy).toBeCalledTimes(1)
    expect(clientSpy).toHaveBeenCalledWith('http://localhost:8081/pegin/getQuote', quoteRequestToSanitizeMock)
  })

  test('validate that the btcRefundAddr is the BTC zero address', async () => {
    const oldQuote = quoteResponseMock.quote

    const badQuote = structuredClone(quoteResponseMock.quote)
    badQuote.btcRefundAddr = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // Non-zero BTC address
    quoteResponseMock.quote = badQuote

    expect.assertions(2)
    await getQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Manipulated quote response')
    })
    quoteResponseMock.quote = oldQuote // reset quote
  })

  test('work with prefixed and not prefixed data', async () => {
    const oldQuote = quoteResponseMock.quote
    const prefixedRequest = structuredClone(quoteRequestMock)
    prefixedRequest.callContractArguments = '0x1a1b1c'
    const notPrefixedRequest = structuredClone(quoteRequestMock)
    notPrefixedRequest.callContractArguments = '1a1b1c'

    const dataQuote = structuredClone(quoteResponseMock.quote)
    dataQuote.data = '1a1b1c'
    quoteResponseMock.quote = dataQuote

    await expect(getQuote(configMock, mockClient, lbcMock, providerMock, prefixedRequest)).resolves.not.toThrow()
    await expect(getQuote(configMock, mockClient, lbcMock, providerMock, notPrefixedRequest)).resolves.not.toThrow()

    quoteResponseMock.quote = oldQuote // reset quote
  })
})
