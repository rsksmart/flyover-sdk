import { describe, test, jest, expect, beforeEach } from '@jest/globals'
import { BridgeError } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { refundPegout } from './refundPegout'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { isPegoutRefundable } from './isPegoutRefundable'
import { FlyoverErrors } from '../constants/errors'

jest.mock('./isPegoutRefundable')
const mockedIsPegoutRefundable = isPegoutRefundable as jest.Mock<typeof isPegoutRefundable>

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
  quoteHash: 'any hash'
}
const successfulResultMock = { successful: true, txHash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }

const lbcMock = jest.mocked({
  refundPegout: async (_quote: PegoutQuote, _signature: string) => Promise.resolve(successfulResultMock)
} as LiquidityBridgeContract, { shallow: true })

const mockFlyoverContext: FlyoverSDKContext = {
  lbc: lbcMock
} as unknown as FlyoverSDKContext

describe('refundPegout function should', () => {
  beforeEach(() => {
    mockedIsPegoutRefundable.mockClear()
    mockedIsPegoutRefundable.mockResolvedValue({ isRefundable: true })
  })

  test('fail on pegout quote missing properties', async () => {
    await expect(refundPegout({} as any, mockFlyoverContext)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
    await expect(refundPegout({ quoteHash: 'any hash', quote: {} } as any, mockFlyoverContext)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteDetailRequiredFields.join(', ')}`)
  })

  test('fail on pegout quote not refundable', async () => {
    mockedIsPegoutRefundable.mockResolvedValue({ isRefundable: false, error: FlyoverErrors.PEG_OUT_REFUND_ALREADY_PAID })

    await expect(refundPegout(quoteMock, mockFlyoverContext)).rejects
      .toMatchObject({
        timestamp: expect.any(Number),
        recoverable: false,
        message: 'Quote is not refundable',
        details: FlyoverErrors.PEG_OUT_REFUND_ALREADY_PAID
      })
  })

  test('execute LBC refundPegout correctly', async () => {
    jest.spyOn(lbcMock, 'refundPegout').mockResolvedValue(successfulResultMock)
    await refundPegout(quoteMock, mockFlyoverContext)
    expect(lbcMock.refundPegout).toBeCalledTimes(1)
    expect(lbcMock.refundPegout).lastCalledWith(quoteMock)
  })

  test('return txHash on successful execution', async () => {
    const txHash = await refundPegout(quoteMock, mockFlyoverContext)
    expect(txHash).toEqual(successfulResultMock.txHash)
  })

  test('throw FlyoverError on non successful execution (tx returned ok but with status 0)', async () => {
    jest.spyOn(lbcMock, 'refundPegout').mockResolvedValue({ successful: false, txHash: '0x8fbfb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' })
    expect.assertions(2)
    await refundPegout(quoteMock, mockFlyoverContext).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('refund pegout transaction did not complete successfully')
    })
  })

  test('throw error when lbc is not defined in context', async () => {
    // lbc undefined
    const contextWithoutLbc: FlyoverSDKContext = {
      ...mockFlyoverContext,
      lbc: undefined
    } as unknown as FlyoverSDKContext

    await expect(refundPegout(quoteMock, contextWithoutLbc)).rejects
      .toThrow('Missing Liquidity Bridge Contract')

    // lbc null
    const contextWithNullLbc: FlyoverSDKContext = {
      ...mockFlyoverContext,
      lbc: null
    } as unknown as FlyoverSDKContext

    await expect(refundPegout(quoteMock, contextWithNullLbc)).rejects
      .toThrow('Missing Liquidity Bridge Contract')
  })
})
