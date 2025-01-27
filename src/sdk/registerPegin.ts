import { throwErrorIfFailedTx, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { quoteDetailRequiredFields, quoteRequiredFields, type Quote } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'

/** Interface to encapsulate parameters required by the registerPegIn function of the Liquidity Bridge Contract */
export interface RegisterPeginParams {
  /** The quote of the service */
  quote: Quote
  /** The signature of the quote */
  signature: string
  /** The peg-in transaction */
  btcRawTransaction: string
  /** The merkle tree path that proves transaction inclusion */
  partialMerkleTree: string
  /** The block that contains the peg-in transaction */
  height: number
}

export async function registerPegin (params: RegisterPeginParams, lbc: LiquidityBridgeContract): Promise<string> {
  validateRequiredFields(params, 'quote', 'signature', 'btcRawTransaction', 'partialMerkleTree', 'height')
  validateRequiredFields(params.quote, ...quoteRequiredFields)
  validateRequiredFields(params.quote.quote, ...quoteDetailRequiredFields)
  const { quote, signature, btcRawTransaction, partialMerkleTree, height } = params
  const result = await lbc.registerPegin(quote, signature, btcRawTransaction, partialMerkleTree, height)
  throwErrorIfFailedTx(result, "register pegin transaction didn't complete successfully")
  return result.txHash
}
