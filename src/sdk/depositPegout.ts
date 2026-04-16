import { throwErrorIfFailedTx, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'

export async function depositPegout (quote: PegoutQuote, signature: string, amount: bigint, lbc: LiquidityBridgeContract): Promise<string> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(quote.quote, ...pegoutQuoteDetailRequiredFields)
  validateRequiredFields({ amount, signature }, 'amount', 'signature')

  const result = await lbc.pegOutContract.depositPegout(quote, signature, amount)
  throwErrorIfFailedTx(result, 'deposit pegout transaction did not complete successfully')
  return result.txHash
}
