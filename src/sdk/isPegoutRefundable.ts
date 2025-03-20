import { type Connection, assertTruthy, type BridgeError } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, type PegoutQuoteDetail } from '../api/index'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverErrors } from '../constants/errors'
import { type FlyoverSDKContext, type IsQuoteRefundableResponse } from '../utils/interfaces'
import { isPegoutQuotePaid } from './isPegoutQuotePaid'

export async function isPegoutRefundable (
  context: FlyoverSDKContext,
  quote: PegoutQuote
): Promise<IsQuoteRefundableResponse> {
  const { lbc, rskConnection } = context
  const quoteHash = await lbc.hashPegoutQuote(quote)
  const result = await isPegoutQuotePaid(context, quoteHash)
  if (result.isPaid) {
    return { isRefundable: false, error: FlyoverErrors.PEG_OUT_REFUND_ALREADY_PAID }
  }
  const isCompleted = await lbc.isPegOutQuoteCompleted(quoteHash)
  if (isCompleted) {
    return { isRefundable: false, error: FlyoverErrors.PEG_OUT_REFUND_ALREADY_COMPLETED }
  }

  const expiredByDate = isExpiredByDate(quote.quote)
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
        detail: refundError.details.error.error.message
      }
    }
  }
  return { isRefundable: true }
}

function isExpiredByDate (quote: PegoutQuoteDetail): boolean {
  return quote.expireDate < (Date.now() / 1000)
}

async function isExpiredByBlocks (rsk: Connection, quote: PegoutQuoteDetail): Promise<boolean> {
  const currentBlock = await rsk.getChainHeight()
  assertTruthy(currentBlock, 'Failed to get current block height')
  return quote.expireBlocks < currentBlock
}

async function verifyRefundExecution (lbc: LiquidityBridgeContract, quote: PegoutQuote): Promise<BridgeError | null> {
  try {
    await lbc.refundPegout(quote, 'staticCall')
    return null
  } catch (error) {
    return error as BridgeError
  }
}
