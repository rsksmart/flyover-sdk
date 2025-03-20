import { assertTruthy, throwErrorIfFailedTx, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'

export async function refundPegout (quote: PegoutQuote, lbc: LiquidityBridgeContract): Promise<string> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(quote.quote, ...pegoutQuoteDetailRequiredFields)

  const result = await lbc.refundPegout(quote)
  assertTruthy(result, 'refund pegout transaction failed')
  throwErrorIfFailedTx(result, 'refund pegout transaction did not complete successfully')
  return result.txHash
}
