import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { acceptAuthenticatedPegoutQuote } from './acceptAuthenticatedPegoutQuote'
import * as bridgesCoreSdk from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PegoutQuote, providerRequiredFields, pegoutQuoteRequiredFields, pegoutQuoteDetailRequiredFields, Routes, type PegoutQuoteDetail } from '../api'

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
      lbcAddress: '0x18D8212bC00106b93070123f325021C723D503a3'
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

const pegoutQuoteMock: PegoutQuote = {
  quoteHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  quote: {
    agreementTimestamp: 1,
    btcRefundAddress: 'any address',
    callFee: BigInt(1),
    depositAddr: 'any address',
    depositConfirmations: 1,
    depositDateLimit: 1,
    expireBlocks: 1,
    expireDate: 1,
    gasFee: BigInt('1'),
    lbcAddress: 'any address',
    liquidityProviderRskAddress: 'any address',
    lpBtcAddr: 'any address',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddress: 'any address',
    transferConfirmations: 1,
    transferTime: 1,
    value: BigInt('9007199254740993'),
    productFeeAmount: BigInt(50000000000000)
  }
}

const signatureMock = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'

describe('acceptAuthenticatedPegoutQuote function should', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('build url correctly and call post with correct parameters', async () => {
    jest.spyOn(bridgesCoreSdk, 'isValidSignature').mockImplementation(() => true)
    const clientSpy = jest.spyOn(mockClient, 'post')

    await acceptAuthenticatedPegoutQuote(mockClient, providerMock, pegoutQuoteMock, signatureMock)

    expect(clientSpy).toBeCalledWith(
      mockApiBaseUrl + Routes.acceptAuthenticatedPegoutQuote,
      { quoteHash: pegoutQuoteMock.quoteHash, signature: signatureMock },
      { includeCaptcha: false }
    )
  })

  test('fail on provider missing properties', async () => {
    await expect(acceptAuthenticatedPegoutQuote(mockClient, {} as any, pegoutQuoteMock, signatureMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })

  test('fail on quote missing properties', async () => {
    await expect(acceptAuthenticatedPegoutQuote(mockClient, providerMock, {} as any, signatureMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
  })

  test('fail on quote detail missing properties', async () => {
    const invalidQuote = { ...pegoutQuoteMock, quote: {} as PegoutQuoteDetail }
    await expect(acceptAuthenticatedPegoutQuote(mockClient, providerMock, invalidQuote, signatureMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteDetailRequiredFields.join(', ')}`)
  })

  test('fail when signature is invalid', async () => {
    jest.spyOn(bridgesCoreSdk, 'isValidSignature').mockReturnValue(false)

    await expect(async () => {
      await acceptAuthenticatedPegoutQuote(mockClient, providerMock, pegoutQuoteMock, signatureMock)
    }).rejects.toThrow(/Invalid signature/)
  })
})
