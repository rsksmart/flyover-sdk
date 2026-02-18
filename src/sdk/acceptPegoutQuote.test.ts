import { describe, test, expect, jest } from '@jest/globals'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import {
  type PegoutQuote, type LiquidityProvider, pegoutQuoteDetailRequiredFields,
  pegoutQuoteRequiredFields, providerRequiredFields
} from '../api'
import { FlyoverError } from '../client/httpClient'
import { acceptPegoutQuote } from './acceptPegoutQuote'
import { LiquidityBridgeContract } from '../blockchain/lbc'

const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  },
  async post<T>(_url: string, _body: object) {
    return Promise.resolve({
      signature: '1d246d9e91d1b372d266678f9ce915522912d88c5ce918364b442702a0ef591274083f4af0f483a794a965e74cfcf76ace04067c0ffbf14862acbb5ab0a8ad5d1b',
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
    chainId: 31,
  },
  quoteHash: '8e7a1f104628f98780cb8ecf438534e9480b43525ede379995ee5838a407ef32'
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35',
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

const MOCK_LIQUIDITY_BRIDGE_CONTRACT: LiquidityBridgeContract = {
  pegOutContract: { hashPegoutQuoteEIP712: jest.fn() }
} as unknown as LiquidityBridgeContract

describe('acceptPegoutQuote function should', () => {
  test('build url correctly', async () => {
    jest.spyOn(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegOutContract, 'hashPegoutQuoteEIP712')
      .mockResolvedValue('0x85702c9a2cf27cda92c407fa8a495d489b4f06ff537bd576d67af802e289b3bb')
    const clientSpy = jest.spyOn(mockClient, 'post')
    await acceptPegoutQuote(mockClient,  MOCK_LIQUIDITY_BRIDGE_CONTRACT, providerMock, quoteMock)
    expect(clientSpy).toBeCalledWith(
      'http://localhost:8081/pegout/acceptQuote',
      { QuoteHash: quoteMock.quoteHash },
      { includeCaptcha: true }
    )
  })

  test('convert response to AcceptedPegoutQuote correctly', async () => {
    jest.spyOn(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegOutContract, 'hashPegoutQuoteEIP712')
      .mockResolvedValue('0x85702c9a2cf27cda92c407fa8a495d489b4f06ff537bd576d67af802e289b3bb')
    const acceptedQuote = await acceptPegoutQuote(mockClient,  MOCK_LIQUIDITY_BRIDGE_CONTRACT, providerMock, quoteMock)
    expect(acceptedQuote.lbcAddress).toBeTruthy()
    expect(acceptedQuote.signature).toBeTruthy()
  })

  test('fail on PegoutQuote missing properties', async () => {
    jest.spyOn(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegOutContract, 'hashPegoutQuoteEIP712')
      .mockResolvedValue('0x85702c9a2cf27cda92c407fa8a495d489b4f06ff537bd576d67af802e289b3bb')
    await expect(acceptPegoutQuote(mockClient, MOCK_LIQUIDITY_BRIDGE_CONTRACT, providerMock, {} as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
    await expect(acceptPegoutQuote(mockClient, MOCK_LIQUIDITY_BRIDGE_CONTRACT, providerMock, { quoteHash: 'any hash', quote: {} } as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteDetailRequiredFields.join(', ')}`)
  })

  test('fail on Provider missing properties', async () => {
    jest.spyOn(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegOutContract, 'hashPegoutQuoteEIP712')
      .mockResolvedValue('0x85702c9a2cf27cda92c407fa8a495d489b4f06ff537bd576d67af802e289b3bb')
    await expect(acceptPegoutQuote(mockClient, MOCK_LIQUIDITY_BRIDGE_CONTRACT, {} as any, quoteMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail if signature is not valid', async () => {
    expect.assertions(2)
    const otherProvider: LiquidityProvider = { ...providerMock, provider: '0xd6F117d8194Eba2fCA8bD63B2E259Dbea40E07d9' }
    await acceptPegoutQuote(mockClient,  MOCK_LIQUIDITY_BRIDGE_CONTRACT, otherProvider, quoteMock)
      .catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Invalid signature')
      })
  })
})
