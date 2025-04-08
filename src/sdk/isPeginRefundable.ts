import { BridgeError } from '@rsksmart/bridges-core-sdk'
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
  flyoverContext: FlyoverSDKContext
}

export async function isPeginRefundable (
  params: IsPeginRefundableParams
): Promise<IsQuoteRefundableResponse> {
  const FAILED_TO_VALIDATE_BTC_TRANSACTION_ERROR_CODE = 'LBC031'
  const { quote, providerSignature, btcTransactionHash, flyoverContext } = params
  const { httpClient, provider, rskConnection, btcConnection, lbc } = flyoverContext

  // Validate the quote is not paid
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const isPaidResponse = await isPeginQuotePaid(httpClient, provider!, quote.quoteHash, rskConnection!)

  if (isPaidResponse.isPaid) {
    return { isRefundable: false, error: FlyoverErrors.PEG_IN_REFUND_ALREADY_PAID }
  }

  // Execute a static call to registerPegin()
  try {
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    await executeStaticCallToRegisterPegin(
      btcConnection!,
      quote,
      providerSignature,
      btcTransactionHash,
      lbc!
    )
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
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

  // Make a static call to registerPegin
  await liquidityBridgeContract.registerPegin({
    quote,
    signature: providerSignature,
    btcRawTransaction: btcRawTxWithoutWitnesses,
    partialMerkleTree: partialMarkleTree.hex,
    height: block.height
  }, 'staticCall')
}
