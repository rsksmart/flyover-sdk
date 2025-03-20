import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { type Connection } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverErrors } from '../constants/errors'
import { type FlyoverSDKContext } from '../utils/interfaces'
import * as isPaidMod from './isPegoutQuotePaid'
import { isPegoutRefundable } from './isPegoutRefundable'

jest.mock('./isPegoutQuotePaid')

const pegoutQuoteMock: PegoutQuote = {
  quote: {
    lbcAddress: '0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4',
    liquidityProviderRskAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    btcRefundAddress: 'mxqk28jvEtvjxRN8k7W9hFEJfWz5VcUgHW',
    rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
    lpBtcAddr: 'mnYcQxCZBbmLzNfE9BhV7E8E2u7amdz5y6',
    callFee: BigInt(1000),
    penaltyFee: BigInt(1000000),
    nonce: BigInt(5),
    depositAddr: 'miMRxGvjQCqWZtdyJCEZ6h8GsTXBtJjNo6',
    gasFee: BigInt(44000),
    value: BigInt('500000000000000'),
    agreementTimestamp: 1683115298,
    depositDateLimit: 3600,
    depositConfirmations: 10,
    transferConfirmations: 1,
    transferTime: 3600,
    expireDate: 1683118898,
    expireBlocks: 5023,
    productFeeAmount: BigInt(600000000000000000)
  },
  quoteHash: 'c73b616363ef74017a085c60acb96de88b57268708d06ed6a5d21fbf5f08b69b'
}

describe('isPegoutRefundable function should', () => {
  let lbcMock: Partial<jest.Mocked<LiquidityBridgeContract>>
  let connectionMock: Partial<jest.Mocked<Connection>>
  let contextMock: FlyoverSDKContext
  beforeEach(() => {
    lbcMock = {
      hashPegoutQuote: jest.fn(),
      isPegOutQuoteCompleted: jest.fn<(quoteHash: string) => Promise<boolean>>(),
      refundPegout: jest.fn()
    }
    connectionMock = {
      getChainHeight: jest.fn()
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    contextMock = {
      lbc: lbcMock as Partial<LiquidityBridgeContract>,
      rskConnection: connectionMock as Partial<Connection>
    } as FlyoverSDKContext
    pegoutQuoteMock.quote.expireDate = (Date.now() / 1000) + 1000
    lbcMock.hashPegoutQuote?.mockResolvedValue(pegoutQuoteMock.quoteHash)
  })
  test('return error if the quote is already paid', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: true })
    const result = await isPegoutRefundable(contextMock, pegoutQuoteMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_ALREADY_PAID)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(contextMock, pegoutQuoteMock.quoteHash)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.isPegOutQuoteCompleted).not.toHaveBeenCalled()
    expect(connectionMock.getChainHeight).not.toHaveBeenCalled()
    expect(lbcMock.refundPegout).not.toHaveBeenCalled()
  })
  test('return error if the quote is already completed', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.isPegOutQuoteCompleted?.mockResolvedValue(true)
    const result = await isPegoutRefundable(contextMock, pegoutQuoteMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_ALREADY_COMPLETED)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(contextMock, pegoutQuoteMock.quoteHash)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).not.toHaveBeenCalled()
    expect(lbcMock.refundPegout).not.toHaveBeenCalled()
  })
  test('return error if the quote is not expired by date', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.isPegOutQuoteCompleted?.mockResolvedValue(false)
    const result = await isPegoutRefundable(contextMock, pegoutQuoteMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_NOT_EXPIRED_BY_DATE)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(contextMock, pegoutQuoteMock.quoteHash)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).not.toHaveBeenCalled()
    expect(lbcMock.refundPegout).not.toHaveBeenCalled()
  })
  test('return error if the quote is not expired by blocks', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.isPegOutQuoteCompleted?.mockResolvedValue(false)
    pegoutQuoteMock.quote.expireDate = (Date.now() / 1000) - 5000
    connectionMock.getChainHeight?.mockResolvedValue(pegoutQuoteMock.quote.expireBlocks - 1)
    const result = await isPegoutRefundable(contextMock, pegoutQuoteMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_NOT_EXPIRED_BY_BLOCKS)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(contextMock, pegoutQuoteMock.quoteHash)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).toHaveBeenCalledTimes(1)
    expect(lbcMock.refundPegout).not.toHaveBeenCalled()
  })
  test('return error if the refund simulation fails', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.isPegOutQuoteCompleted?.mockResolvedValue(false)
    pegoutQuoteMock.quote.expireDate = (Date.now() / 1000) - 5000
    connectionMock.getChainHeight?.mockResolvedValue(pegoutQuoteMock.quote.expireBlocks + 5)
    lbcMock.refundPegout?.mockImplementation(() => { throw new Error('refund failed') })
    const result = await isPegoutRefundable(contextMock, pegoutQuoteMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_FAILED)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(contextMock, pegoutQuoteMock.quoteHash)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).toHaveBeenCalledTimes(1)
    expect(lbcMock.refundPegout).toHaveBeenCalledWith(pegoutQuoteMock, 'staticCall')
    expect(lbcMock.refundPegout).toHaveBeenCalledTimes(1)
  })
  test('return true if the quote is refundable', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.isPegOutQuoteCompleted?.mockResolvedValue(false)
    pegoutQuoteMock.quote.expireDate = (Date.now() / 1000) - 5000
    connectionMock.getChainHeight?.mockResolvedValue(pegoutQuoteMock.quote.expireBlocks + 5)
    lbcMock.refundPegout?.mockResolvedValue(null)
    const result = await isPegoutRefundable(contextMock, pegoutQuoteMock)
    expect(result.isRefundable).toBe(true)
    expect(result.error).toBeUndefined()
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(contextMock, pegoutQuoteMock.quoteHash)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).toHaveBeenCalledTimes(1)
    expect(lbcMock.refundPegout).toHaveBeenCalledWith(pegoutQuoteMock, 'staticCall')
    expect(lbcMock.refundPegout).toHaveBeenCalledTimes(1)
  })
})
