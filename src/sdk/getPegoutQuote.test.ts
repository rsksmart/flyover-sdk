import { describe, test, expect, jest } from '@jest/globals'
import {
  providerRequiredFields, type PegoutQuote, type PegoutQuoteDetail,
  pegoutQuoteRequestRequiredFields, pegoutQuoteRequiredFields,
  pegoutQuoteDetailRequiredFields, type LiquidityProvider, type PegoutQuoteRequest
} from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { getPegoutQuote } from './getPegoutQuote'
import { type HttpClient, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import * as validation from '../utils/validation'

function getMockClient (): HttpClient {
  return {
    async get<M>(_url: string) {
      return Promise.resolve({} as M) // eslint-disable-line @typescript-eslint/consistent-type-assertions
    },
    post: async <M>(_url: string, _body: object) => Promise.resolve([quoteResponseMock] as M),
    getCaptchaToken: async () => Promise.resolve('')
  }
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: 'any address',
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
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    requiredConfirmations: 5
  }
}

const quoteRequestMock: PegoutQuoteRequest = {
  rskRefundAddress: '0x7c4890A0f1d4bBf2C669AC2D1eFFA185C505359b',
  to: 'bc1qnlwtjzg82cpw7aa8r9teq74hqfk7t5z5ch4pay',
  valueToTransfer: BigInt('9007199254750000')
}

const quoteResponseMock: PegoutQuote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddress: quoteRequestMock.to,
    callFee: BigInt(1),
    depositAddr: quoteRequestMock.to,
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
    rskRefundAddress: quoteRequestMock.rskRefundAddress,
    transferConfirmations: 1,
    transferTime: 1,
    value: quoteRequestMock.valueToTransfer,
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: 'any hash'
}

const configMock: FlyoverConfig = {
  network: 'Mainnet',
  disableChecksum: true,
  captchaTokenResolver: async () => Promise.resolve('')
}

const lbcMock = { // eslint-disable-line @typescript-eslint/consistent-type-assertions
  hashPegoutQuote: async (quote: PegoutQuote) => Promise.resolve(quote.quoteHash)
} as LiquidityBridgeContract

describe('getPegoutQuote function should', () => {
  test('build url correctly', async () => {
    const mockClient = getMockClient()
    const clientSpy = jest.spyOn(mockClient, 'post')
    await getPegoutQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock)
    expect(clientSpy).toBeCalledWith('http://localhost:8081/pegout/getQuotes', quoteRequestMock)
  })

  test('convert response to PegoutQuote array correctly', async () => {
    const quotes = await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, quoteRequestMock)
    const quote = quotes[0]! // eslint-disable-line @typescript-eslint/no-non-null-assertion

    expect(quotes).toBeTruthy()
    pegoutQuoteDetailRequiredFields.forEach(requiredField => { expect(quote.quote[requiredField as keyof PegoutQuoteDetail]).toBeTruthy() })
    pegoutQuoteRequiredFields.forEach(requiredField => { expect(quote[requiredField as keyof PegoutQuote]).toBeTruthy() })
  })

  test('fail on Provider missing properties', async () => {
    await expect(getPegoutQuote(configMock, getMockClient(), lbcMock, {} as any, quoteRequestMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail on QuoteRequest missing properties', async () => {
    await expect(getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, {} as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequestRequiredFields.join(', ')}`)
  })

  test('accept all types of bitcoin address for mainnet', () => {
    const addresses = [
      '1HVJrk1dEGiLpVhU6GPGVFRvjSspkzJbAn', // P2PKH
      '39C7fxSzEACPjM78Z7xdPxhf7mKxJwvfMJ', // P2SH
      'bc1qnlwtjzg82cpw7aa8r9teq74hqfk7t5z5ch4pay', // P2WPKH
      'bc1qrxjnp9djm9wvv8azhu8vccwpl7mxllyec7udtnjk73fl5faxmvgsv7667r', // P2WSH
      'bc1pq9qkd4tpcs73x0c9mhnsmswlvlfqxty8rcu8lntg0gx9p0pknfwsm40azm' // P2TR
    ]
    for (const address of addresses) {
      const quote = { ...quoteRequestMock }
      quote.to = address
      const quoteResponse = structuredClone(quoteResponseMock)
      quoteResponse.quote.depositAddr = quote.to
      quoteResponse.quote.btcRefundAddress = quote.to
      const client = getMockClient()
      client.post = jest.fn<HttpClient['post']>().mockResolvedValue([quoteResponse]) as jest.MockedFunction<HttpClient['post']>
      expect(async () => { await getPegoutQuote(configMock, client, lbcMock, providerMock, quote) }).not.toThrow()
    }
  })

  test('accept all types of bitcoin address for testnet', async () => {
    const config = { ...configMock }
    config.network = 'Testnet'
    const addresses = [
      'mquTt49yCrV2eYZgpHoqZsksvPkSs1qv3W', // P2PKH Testnet
      '2MuagfCwj8bWKS2CnkdmMHqp7jPPjkbsVCV', // P2SH Testnet
      'tb1qe8xfezrwslpk02r8rntvxvywz9dfdce8n4dzh5', // P2WPKH Testnet
      'tb1qcmxntqal4n0hhj0vemvu5myp6xwrhg05efpjdgnqan0rpnv3ey9s9tytr0', // P2WSH Testnet
      'tb1p35pqanduqnatapcj7nda4k8e43f9fn82kuyp43pg4qzhney9lh8sapr5gf', // P2TR Testnet
      'bcrt1q9fg8p4uz04hkzzmtlpvgsrf5wcnsz89w3cjz80', // P2WPKH Regtest
      'bcrt1qtmm4qallkmnd2vl5y3w3an3uvq6w5v2ahqvfqm0mfxny8cnsdrashv8fsr', // P2WSH Regtest
      'bcrt1psnu5cxqztrqq89gq2mznd55kwdvmqpyufk3jjs73fv06t6089vgq88mt3w' // P2TR Regtest
    ]
    for (const address of addresses) {
      const quote = { ...quoteRequestMock }
      quote.to = address
      const quoteResponse = structuredClone(quoteResponseMock)
      quoteResponse.quote.depositAddr = quote.to
      quoteResponse.quote.btcRefundAddress = quote.to
      const client = getMockClient()
      client.post = jest.fn<HttpClient['post']>().mockResolvedValue([quoteResponse]) as jest.MockedFunction<HttpClient['post']>
      await expect(getPegoutQuote(config, client, lbcMock, providerMock, quote)).resolves.not.toThrow()
    }
  })

  test('fail on different bitcoinRefundAddress', async () => {
    const response = structuredClone(quoteResponseMock)
    response.quote.btcRefundAddress = 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx'
    const mockClient = getMockClient()
    mockClient.post = jest.fn<HttpClient['post']>().mockResolvedValue([response]) as jest.MockedFunction<HttpClient['post']>

    expect.assertions(2)
    await getPegoutQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Manipulated quote response')
    })
  })

  test('fail on invalid btc address', async () => {
    const addresses: string[] = [
      'anything',
      'mhghaQCHedKZZQuFqSzg6Z3Rf1TqqDEPCcasv',
      '0x7Z4890A0f1D4bBf2C669Ac2d1efFa185c505359b',
      '0x7C4890A0f1D4bBf2C669Ac2d1efFa185c505359N',
      '1230x7C4890A0f1D4bBf2C669Ac2d1efFa185c505359b'
    ]
    expect.assertions(addresses.length * 3)
    for (const address of addresses) {
      const quote = { ...quoteRequestMock }
      quote.to = address

      await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, quote).catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid BTC address')
        expect(e.details).toBe(`The type of address ${address} is not supported currently.`)
      })
    }
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
    expect.assertions(addresses.length * 3)
    for (const address of addresses) {
      const quote = { ...quoteRequestMock }
      quote.rskRefundAddress = address
      const quoteResponse = structuredClone(quoteResponseMock)
      quoteResponse.quote.rskRefundAddress = quote.rskRefundAddress

      await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, quote).catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid RSK address')
        expect(e.details).toBe(`Address ${address} is not a valid RSK address.`)
      })
    }
  })

  test('validate btc destination address network', async () => {
    configMock.network = 'Testnet'
    expect.assertions(4)
    await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, quoteRequestMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Wrong network')
    })

    configMock.network = 'Mainnet'

    const testnetRequest = { ...quoteRequestMock }
    testnetRequest.to = 'mhghaQCHedKZZQuFqSzg6Z3Rf1TqqDEPCc'
    quoteResponseMock.quote.depositAddr = testnetRequest.to
    await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, testnetRequest).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Wrong network')
    })
    quoteResponseMock.quote.depositAddr = quoteRequestMock.to
  })

  test('validate quote hash', async () => {
    const original = lbcMock.hashPegoutQuote
    lbcMock.hashPegoutQuote = async (_: PegoutQuote) => Promise.resolve('fake hash')
    expect.assertions(2)
    await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, quoteRequestMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Quote hash mismatch')
    })
    lbcMock.hashPegoutQuote = original
  })

  test('validate response fields', async () => {
    const oldQuote = quoteResponseMock.quote
    const badQuote = structuredClone(quoteResponseMock.quote)
    badQuote.value = BigInt(500)
    badQuote.depositAddr = 'bad lp address'
    badQuote.btcRefundAddress = 'bad lp address'
    badQuote.rskRefundAddress = '0x88250F772101179a4EcfAA4b92a983676a3cE445'
    quoteResponseMock.quote = badQuote
    expect.assertions(2)
    await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, quoteRequestMock).catch(e => {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Manipulated quote response')
    })
    quoteResponseMock.quote = oldQuote
  })

  test('invoke validateRskChecksum function', async () => {
    jest.spyOn(validation, 'validateRskChecksum')
    await getPegoutQuote(configMock, getMockClient(), lbcMock, providerMock, quoteRequestMock)
    expect(validation.validateRskChecksum).toBeCalledTimes(1)
    expect(validation.validateRskChecksum).toBeCalledWith(configMock, quoteRequestMock.rskRefundAddress)
  })
})
