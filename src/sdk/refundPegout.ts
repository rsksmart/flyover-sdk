import { assertTruthy, throwErrorIfFailedTx, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { isPegoutRefundable } from './isPegoutRefundable'
import { FlyoverError } from '../client/httpClient'

export async function refundPegout (quote: PegoutQuote, context: FlyoverSDKContext): Promise<string> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(quote.quote, ...pegoutQuoteDetailRequiredFields)

  const isRefundable = await isPegoutRefundable(quote, context)
  if (!isRefundable.isRefundable) {
    throw new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Quote is not refundable',
      details: isRefundable.error
    })
  }

  const { lbc } = context
  assertTruthy(lbc, 'Missing Liquidity Bridge Contract')

  const result = await lbc.refundPegout(quote)
  assertTruthy(result, 'refund pegout transaction failed')
  throwErrorIfFailedTx(result, 'refund pegout transaction did not complete successfully')
  return result.txHash
}
