import { type Connection, assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, type PegoutQuoteDetail } from '../api/index'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverErrors } from '../constants/errors'
import { type FlyoverSDKContext, type IsQuoteRefundableResponse } from '../utils/interfaces'
import { isPegoutQuotePaid } from './isPegoutQuotePaid'

export async function isPegoutRefundable (
  quote: PegoutQuote,
  context: FlyoverSDKContext
): Promise<IsQuoteRefundableResponse> {
  const { lbc, rskConnection } = context
  assertTruthy(lbc, 'Missing Liquidity Bridge Contract')
  assertTruthy(rskConnection, 'Missing RSK connection')

  const quoteHash = await lbc.hashPegoutQuote(quote)
  const result = await isPegoutQuotePaid(quoteHash, context)
  if (result.isPaid) {
    return { isRefundable: false, error: FlyoverErrors.PEG_OUT_REFUND_ALREADY_PAID }
  }
  const isCompleted = await lbc.isPegOutQuoteCompleted(quoteHash)
  if (isCompleted) {
    return { isRefundable: false, error: FlyoverErrors.PEG_OUT_REFUND_ALREADY_COMPLETED }
  }

  const expiredByDate = await isExpiredByDate(rskConnection, quote.quote)
  if (!expiredByDate) {
    return { isRefundable: false, error: FlyoverErrors.PEG_OUT_REFUND_NOT_EXPIRED_BY_DATE }
  }

  const expiredByBlock = await isExpiredByBlocks(rskConnection, quote.quote)
  if (!expiredByBlock) {
    return { isRefundable: false, error: FlyoverErrors.PEG_OUT_REFUND_NOT_EXPIRED_BY_BLOCKS }
  }

  const refundError = await verifyRefundExecution(lbc, quote)
  if (refundError !== null) {
    return {
      isRefundable: false,
      error: {
        ...FlyoverErrors.PEG_OUT_REFUND_FAILED,
        detail: refundError
      }
    }
  }
  return { isRefundable: true }
}

async function isExpiredByDate (rsk: Connection, quote: PegoutQuoteDetail): Promise<boolean> {
  const provider = rsk.getUnderlyingProvider()
  assertTruthy(provider, 'Failed to get provider')
  const block = await provider.getBlock('latest')
  return quote.expireDate < block.timestamp
}

async function isExpiredByBlocks (rsk: Connection, quote: PegoutQuoteDetail): Promise<boolean> {
  const currentBlock = await rsk.getChainHeight()
  assertTruthy(currentBlock, 'Failed to get current block height')
  return quote.expireBlocks < currentBlock
}

async function verifyRefundExecution (lbc: LiquidityBridgeContract, quote: PegoutQuote): Promise<Error | null> {
  try {
    await lbc.refundPegout(quote, 'staticCall')
    return null
  } catch (error) {
    return error as Error
  }
}
