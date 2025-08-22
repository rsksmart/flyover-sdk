import type { Quote } from '../api'
import type { FlyoverSDKContext } from '../utils/interfaces'
import { isPeginRefundable } from './isPeginRefundable'
import { getRawTxWithoutWitnesses } from '../bitcoin/utils'
import pmtBuilder from '@rsksmart/pmt-builder'
import { FlyoverError } from '../client/httpClient'
import { assertTruthy } from '@rsksmart/bridges-core-sdk'

/** Interface  to encapsulate the parameters for calling the registerPegin function */
export interface RegisterPeginParams {
  quote: Quote
  providerSignature: string
  userBtcTransactionHash: string
}

/** Interface to encapsulate parameters required by the registerPegIn function of the Liquidity Bridge Contract */
export interface RegisterPeginLbcParams {
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

/**
 * Registers a peg-in transaction in the Liquidity Bridge Contract. Takes a RegisterPeginParams object
 * and fill the missing parameters to get a RegisterPeginLbcParams object. Then calls the registerPegin function
 * of the Liquidity Bridge Contract.
 * @param params - The parameters for calling the registerPegin function
 * @param flyoverContext - The context of the Flyover SDK
 * @returns The transaction hash of the register pegin transaction
 */
export async function registerPegin (
  params: RegisterPeginParams,
  flyoverContext: FlyoverSDKContext
): Promise<string> {
  const { quote, providerSignature, userBtcTransactionHash } = params

  const isRefundable = await isPeginRefundable({
    quote,
    providerSignature,
    btcTransactionHash: userBtcTransactionHash
  }, flyoverContext)

  if (!isRefundable.isRefundable) {
    throw new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Quote is not refundable',
      details: isRefundable.error
    })
  }
  const { btcConnection, lbc } = flyoverContext

  assertTruthy(btcConnection, 'Bitcoin connection is required')
  assertTruthy(lbc, 'Liquidity Bridge Contract is required')

  const btcRawTxWithoutWitnesses = await getRawTxWithoutWitnesses(userBtcTransactionHash, btcConnection)

  const block = await btcConnection.getBlockFromTransaction(userBtcTransactionHash)
  const partialMarkleTree = pmtBuilder.buildPMT(block.transactionHashes, userBtcTransactionHash)

  const txResult = await lbc.registerPegin({
    quote,
    signature: providerSignature,
    btcRawTransaction: btcRawTxWithoutWitnesses,
    partialMerkleTree: partialMarkleTree.hex,
    height: block.height
  }, 'execution')

  return txResult.txHash
}
