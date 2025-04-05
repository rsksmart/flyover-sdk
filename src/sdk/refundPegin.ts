import type { Quote } from '../api'
import type { FlyoverSDKContext } from '../utils/interfaces'
import { isPeginRefundable } from './isPeginRefundable'
import { getRawTxWithoutWitnesses } from '../bitcoin/utils'
import pmtBuilder from '@rsksmart/pmt-builder'

export interface RefundPeginParams {
  quote: Quote
  providerSignature: string
  userBtcTransactionHash: string
  flyoverContext: FlyoverSDKContext
}

export async function refundPegin (
  params: RefundPeginParams
): Promise<string> {
  const { quote, providerSignature, userBtcTransactionHash, flyoverContext } = params

  const isRefundable = await isPeginRefundable({
    quote,
    providerSignature,
    btcTransactionHash: userBtcTransactionHash,
    flyoverContext
  })

  if (!isRefundable.isRefundable) {
    throw isRefundable.error
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
