import type { Quote } from '../api'
import type { FlyoverSDKContext } from '../utils/interfaces'
import { isPeginRefundable } from './isPeginRefundable'
import { getRawTxWithoutWitnesses } from '../bitcoin/utils'
import pmtBuilder from '@rsksmart/pmt-builder'
import { FlyoverError } from '../client/httpClient'

/** Interface  to encapsulate the parameters for the SDK function that builds the parameters for the
 * registerPegIn function of the Liquidity Bridge Contract */
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

export async function registerPegin (
  params: RegisterPeginParams,
  flyoverContext: FlyoverSDKContext
): Promise<string> {
  const { quote, providerSignature, userBtcTransactionHash } = params

  const isRefundable = await isPeginRefundable({
    quote,
    providerSignature,
    btcTransactionHash: userBtcTransactionHash,
    flyoverContext
  })

  if (!isRefundable.isRefundable) {
    throw new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Quote is not refundable',
      details: isRefundable.error
    })
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const btcDataSource = flyoverContext.btcConnection!

  const btcRawTxWithoutWitnesses = await getRawTxWithoutWitnesses(userBtcTransactionHash, btcDataSource)

  const block = await btcDataSource.getBlockFromTransaction(userBtcTransactionHash)
  const partialMarkleTree = pmtBuilder.buildPMT(block.transactionHashes, userBtcTransactionHash)

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const txResult = await flyoverContext.lbc!.registerPegin({
    quote,
    signature: providerSignature,
    btcRawTransaction: btcRawTxWithoutWitnesses,
    partialMerkleTree: partialMarkleTree.hex,
    height: block.height
  }, 'execution')

  return txResult.txHash
}
