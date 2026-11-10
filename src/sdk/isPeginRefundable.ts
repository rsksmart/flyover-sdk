import { assertTruthy, BridgeError } from '@rsksmart/bridges-core-sdk'
import { type FlyoverSDKContext, type IsQuoteRefundableResponse } from '../utils/interfaces'
import { isPeginQuotePaid } from './isPeginQuotePaid'
import { type Quote } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import pmtBuilder from '@rsksmart/pmt-builder'
import { FlyoverErrors } from '../constants/errors'
import { getRawTxWithoutWitnesses } from '../bitcoin/utils'
export interface IsPeginRefundableParams {
  quote: Quote
  providerSignature: string
  btcTransactionHash: string
}

export async function isPeginRefundable (
  params: IsPeginRefundableParams,
  context: FlyoverSDKContext
): Promise<IsQuoteRefundableResponse> {
  const FAILED_TO_VALIDATE_BTC_TRANSACTION_ERROR_CODE = 'LBC031'

  const { quote, providerSignature, btcTransactionHash } = params
  const { btcConnection, lbc } = context

  assertTruthy(btcConnection, 'Bitcoin connection is required')
  assertTruthy(lbc, 'Liquidity bridge contract is required')

  // Validate the quote is not paid
  const isPaidResponse = await isPeginQuotePaid(quote.quoteHash, context)

  if (isPaidResponse.isPaid) {
    return { isRefundable: false, error: FlyoverErrors.PEG_IN_REFUND_ALREADY_PAID }
  }

  // Execute a static call to registerPegin()
  try {
    await executeStaticCallToRegisterPegin(
      btcConnection,
      quote,
      providerSignature,
      btcTransactionHash,
      lbc
    )
  } catch (error) {
    if (error instanceof BridgeError) {
      if (error.details.error.message.includes(FAILED_TO_VALIDATE_BTC_TRANSACTION_ERROR_CODE)) {
        return { isRefundable: false, error: FlyoverErrors.PEG_IN_REFUND_DOES_NOT_HAVE_ENOUGH_CONFIRMATIONS }
      }

      return {
        isRefundable: false,
        error: {
          ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
          detail: error.details.error.message
        }
      }
    }

    return {
      isRefundable: false,
      error: {
        ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
        detail: new Error('Unknown error')
      }
    }
  }

  return { isRefundable: true }
}

async function executeStaticCallToRegisterPegin (
  btcDataSource: BitcoinDataSource,
  quote: Quote,
  providerSignature: string,
  btcTransactionHash: string,
  liquidityBridgeContract: LiquidityBridgeContract
): Promise<void> {
  const btcRawTxWithoutWitnesses = await getRawTxWithoutWitnesses(btcTransactionHash, btcDataSource)

  const block = await btcDataSource.getBlockFromTransaction(btcTransactionHash)
  const partialMarkleTree = pmtBuilder.buildPMT(block.transactionHashes, btcTransactionHash)

  await liquidityBridgeContract.pegInContract.registerPegin({
    quote,
    signature: providerSignature,
    btcRawTransaction: btcRawTxWithoutWitnesses,
    partialMerkleTree: partialMarkleTree.hex,
    height: block.height
  }, 'staticCall')
}
