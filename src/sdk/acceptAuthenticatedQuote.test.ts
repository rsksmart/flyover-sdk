import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { acceptAuthenticatedQuote } from './acceptAuthenticatedQuote'
import * as bridgesCoreSdk from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type Quote, providerRequiredFields, quoteRequiredFields, quoteDetailRequiredFields, Routes, type QuoteDetail } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'

jest.mock('@rsksmart/bridges-core-sdk', () => {
    const actual = jest.requireActual<typeof import('@rsksmart/bridges-core-sdk')>('@rsksmart/bridges-core-sdk');
    return {
      ...actual,
      isValidSignature: jest.fn(() => true),
    };
  });

const mockClient: bridgesCoreSdk.HttpClient = {
  async post<M>(_url: string, _body: object) {
    return Promise.resolve({
      signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      bitcoinDepositAddressHash: 'valid_address'
    } as M)
  }
} as bridgesCoreSdk.HttpClient

const mockApiBaseUrl = 'http://localhost:8080'

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  apiBaseUrl: mockApiBaseUrl,
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
  quoteHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  quote: {
    fedBTCAddr: 'any address',
    lbcAddr: 'any address',
    lpRSKAddr: 'any address',
    btcRefundAddr: 'any address',
    rskRefundAddr: 'any address',
    lpBTCAddr: 'any address',
    contractAddr: 'any address',
    callFee: BigInt(1),
    penaltyFee: BigInt(1),
    data: 'any data',
    gasLimit: 1,
    nonce: BigInt(1),
    value: BigInt('9007199254740993'),
    timeForDeposit: 1,
    lpCallTime: 1,
    agreementTimestamp: 1,
    confirmations: 1,
    callOnRegister: true,
    gasFee: BigInt('1'),
    productFeeAmount: BigInt(50000000000000)
  }
}

const signatureMock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

const lbcMock = {
  pegInContract: {
    validatePeginDepositAddress: async (_quote: Quote, _depositAddress: string) => Promise.resolve(true),
  }
} as unknown as LiquidityBridgeContract

describe('acceptAuthenticatedQuote function should', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('build url correctly and call post with correct parameters', async () => {
    jest.spyOn(bridgesCoreSdk, 'isValidSignature').mockImplementation(() => true)
    const clientSpy = jest.spyOn(mockClient, 'post')

    await acceptAuthenticatedQuote(mockClient, lbcMock, providerMock, quoteMock, signatureMock)

    expect(clientSpy).toBeCalledWith(
      mockApiBaseUrl + Routes.acceptAuthenticatedQuote,
      { quoteHash: quoteMock.quoteHash, signature: signatureMock },
      { includeCaptcha: false }
    )
  })

  test('fail on provider missing properties', async () => {
    await expect(acceptAuthenticatedQuote(mockClient, lbcMock, {} as any, quoteMock, signatureMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail on quote missing properties', async () => {
    await expect(acceptAuthenticatedQuote(mockClient, lbcMock, providerMock, {} as any, signatureMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${quoteRequiredFields.join(', ')}`)
  })

  test('fail on quote detail missing properties', async () => {
    const invalidQuote = { ...quoteMock, quote: {} as QuoteDetail }
    await expect(acceptAuthenticatedQuote(mockClient, lbcMock, providerMock, invalidQuote, signatureMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${quoteDetailRequiredFields.join(', ')}`)
  })

  test('fail when signature is invalid', async () => {
    jest.spyOn(bridgesCoreSdk, 'isValidSignature').mockReturnValue(false)

    await expect(async () => {
      await acceptAuthenticatedQuote(mockClient, lbcMock, providerMock, quoteMock, signatureMock)
    }).rejects.toThrow(/Invalid signature/)
  })

  test('fail when deposit address is invalid', async () => {
    jest.spyOn(bridgesCoreSdk, 'isValidSignature').mockReturnValue(true)
    const lbcWithInvalidAddress = {
      pegInContract: {
        ...lbcMock.pegInContract,
        validatePeginDepositAddress: async () => Promise.resolve(false)
      }
    } as unknown as LiquidityBridgeContract

    await expect(async () => {
      await acceptAuthenticatedQuote(mockClient, lbcWithInvalidAddress, providerMock, quoteMock, signatureMock)
    }).rejects.toThrow(/Invalid BTC address/)
  })
})
