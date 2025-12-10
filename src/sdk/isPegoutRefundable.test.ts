import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { BridgeError, type ethers, type Connection } from '@rsksmart/bridges-core-sdk'
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
  let providerMock: Partial<jest.Mocked<ethers.providers.Provider>>
  let expiredBlock: ethers.providers.Block
  beforeEach(() => {
    lbcMock = {
      pegOutContract: {
        hashPegoutQuote: jest.fn(),
        isPegOutQuoteCompleted: jest.fn<(quoteHash: string) => Promise<boolean>>(),
        refundPegout: jest.fn()
      } as any
    }
    connectionMock = {
      getChainHeight: jest.fn(),
      getUnderlyingProvider: jest.fn()
    }
    providerMock = {
      getBlock: jest.fn()
    }

    contextMock = {
      lbc: lbcMock as Partial<LiquidityBridgeContract>,
      rskConnection: connectionMock as Partial<Connection>
    } as FlyoverSDKContext
    lbcMock.pegOutContract?.hashPegoutQuote?.mockResolvedValue(pegoutQuoteMock.quoteHash)
    connectionMock.getUnderlyingProvider?.mockReturnValue(providerMock as ethers.providers.Provider)
    expiredBlock = { timestamp: pegoutQuoteMock.quote.expireDate + 5000 } as ethers.providers.Block
  })
  test('return error if the quote is already paid', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: true })
    const result = await isPegoutRefundable(pegoutQuoteMock, contextMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_ALREADY_PAID)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash, contextMock)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).not.toHaveBeenCalled()
    expect(connectionMock.getChainHeight).not.toHaveBeenCalled()
    expect(lbcMock.pegOutContract?.refundPegout).not.toHaveBeenCalled()
    expect(providerMock.getBlock).not.toHaveBeenCalled()
  })
  test('return error if the quote is already completed', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.pegOutContract?.isPegOutQuoteCompleted?.mockResolvedValue(true)
    const result = await isPegoutRefundable(pegoutQuoteMock, contextMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_ALREADY_COMPLETED)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash, contextMock)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).not.toHaveBeenCalled()
    expect(lbcMock.pegOutContract?.refundPegout).not.toHaveBeenCalled()
    expect(providerMock.getBlock).not.toHaveBeenCalled()
  })
  test('return error if the quote is not expired by date', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.pegOutContract?.isPegOutQuoteCompleted?.mockResolvedValue(false)
    providerMock.getBlock?.mockResolvedValue({ timestamp: pegoutQuoteMock.quote.expireDate - 5000 } as ethers.providers.Block)
    const result = await isPegoutRefundable(pegoutQuoteMock, contextMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_NOT_EXPIRED_BY_DATE)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash, contextMock)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(providerMock.getBlock).toHaveBeenCalledWith('latest')
    expect(providerMock.getBlock).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).not.toHaveBeenCalled()
    expect(lbcMock.pegOutContract?.refundPegout).not.toHaveBeenCalled()
  })
  test('return error if the quote is not expired by blocks', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.pegOutContract?.isPegOutQuoteCompleted?.mockResolvedValue(false)
    providerMock.getBlock?.mockResolvedValue(expiredBlock)
    connectionMock.getChainHeight?.mockResolvedValue(pegoutQuoteMock.quote.expireBlocks - 1)
    const result = await isPegoutRefundable(pegoutQuoteMock, contextMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_OUT_REFUND_NOT_EXPIRED_BY_BLOCKS)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash, contextMock)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(providerMock.getBlock).toHaveBeenCalledWith('latest')
    expect(providerMock.getBlock).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.refundPegout).not.toHaveBeenCalled()
  })
  test('return error if the refund simulation fails', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.pegOutContract?.isPegOutQuoteCompleted?.mockResolvedValue(false)
    providerMock.getBlock?.mockResolvedValue(expiredBlock)
    connectionMock.getChainHeight?.mockResolvedValue(pegoutQuoteMock.quote.expireBlocks + 5)
    const ethersError = { error: new Error('refund failed') }
    const bridgeError = new BridgeError({
      timestamp: Date.now(),
      recoverable: true,
      message: 'an error',
      details: { error: ethersError }
    })
    lbcMock.pegOutContract?.refundPegout?.mockImplementation(() => { throw bridgeError })
    const result = await isPegoutRefundable(pegoutQuoteMock, contextMock)
    expect(result.isRefundable).toBe(false)
    expect(result.error).toMatchObject({
      ...FlyoverErrors.PEG_OUT_REFUND_FAILED,
      detail: bridgeError
    })
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash, contextMock)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.refundPegout).toHaveBeenCalledWith(pegoutQuoteMock, 'staticCall')
    expect(lbcMock.pegOutContract?.refundPegout).toHaveBeenCalledTimes(1)
    expect(providerMock.getBlock).toHaveBeenCalledWith('latest')
    expect(providerMock.getBlock).toHaveBeenCalledTimes(1)
  })
  test('return true if the quote is refundable', async () => {
    jest.spyOn(isPaidMod, 'isPegoutQuotePaid').mockResolvedValue({ isPaid: false, error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND })
    lbcMock.pegOutContract?.isPegOutQuoteCompleted?.mockResolvedValue(false)
    providerMock.getBlock?.mockResolvedValue(expiredBlock)
    connectionMock.getChainHeight?.mockResolvedValue(pegoutQuoteMock.quote.expireBlocks + 5)
    lbcMock.pegOutContract?.refundPegout?.mockResolvedValue(null)
    const result = await isPegoutRefundable(pegoutQuoteMock, contextMock)
    expect(result.isRefundable).toBe(true)
    expect(result.error).toBeUndefined()
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
    expect(lbcMock.pegOutContract?.hashPegoutQuote).toHaveBeenCalledTimes(1)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash, contextMock)
    expect(isPaidMod.isPegoutQuotePaid).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledWith(pegoutQuoteMock.quoteHash)
    expect(lbcMock.pegOutContract?.isPegOutQuoteCompleted).toHaveBeenCalledTimes(1)
    expect(connectionMock.getChainHeight).toHaveBeenCalledTimes(1)
    expect(lbcMock.pegOutContract?.refundPegout).toHaveBeenCalledWith(pegoutQuoteMock, 'staticCall')
    expect(lbcMock.pegOutContract?.refundPegout).toHaveBeenCalledTimes(1)
    expect(providerMock.getBlock).toHaveBeenCalledWith('latest')
    expect(providerMock.getBlock).toHaveBeenCalledTimes(1)
  })
  test('throw error when lbc in context is missing', async () => {
    // Test with undefined lbc
    const contextWithUndefinedLbc = {
      ...contextMock,
      lbc: undefined
    } as unknown as FlyoverSDKContext

    await expect(
      isPegoutRefundable(pegoutQuoteMock, contextWithUndefinedLbc)
    ).rejects.toThrow('Missing Liquidity Bridge Contract')

    // Test with null lbc
    const contextWithNullLbc = {
      ...contextMock,
      lbc: null
    } as unknown as FlyoverSDKContext

    await expect(
      isPegoutRefundable(pegoutQuoteMock, contextWithNullLbc)
    ).rejects.toThrow('Missing Liquidity Bridge Contract')
  })

  test('throw error when rskConnection in context is missing', async () => {
    // Test with undefined rskConnection
    const contextWithUndefinedConnection = {
      ...contextMock,
      rskConnection: undefined
    } as unknown as FlyoverSDKContext

    await expect(
      isPegoutRefundable(pegoutQuoteMock, contextWithUndefinedConnection)
    ).rejects.toThrow('Missing RSK connection')

    // Test with null rskConnection
    const contextWithNullConnection = {
      ...contextMock,
      rskConnection: null
    } as unknown as FlyoverSDKContext

    await expect(
      isPegoutRefundable(pegoutQuoteMock, contextWithNullConnection)
    ).rejects.toThrow('Missing RSK connection')
  })
})
