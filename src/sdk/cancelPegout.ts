import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { isPegoutId } from '../blockchain/pegoutEscrow'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { isTextEqualNoCase } from '../utils/validation'

/**
 * Cancels a commit-first peg-out that no LP has claimed yet, with one PegOutEscrow.cancelPegOut
 * transaction. The escrow refunds the whole deposit to the refund address and slashes nobody.
 * The state and the sender are checked first, so a cancel the escrow would reject sends no transaction.
 *
 * @param context the SDK context, with a signing RSK connection and the PegOutEscrow contract set
 * @param requestHash the peg-out id returned by requestPegOut
 * @returns the transaction hash
 */
export async function cancelPegout (context: FlyoverSDKContext, requestHash: string): Promise<string> {
  const { lbc, rskConnection } = context
  assertTruthy(rskConnection, 'Missing RSK connection')
  assertTruthy(lbc, 'Missing Liquidity Bridge Contract')
  assertTruthy(lbc.pegOutEscrow, 'Missing PegOutEscrow contract')
  if (!isPegoutId(requestHash)) {
    throw FlyoverError.withReason(`invalid peg-out id ${requestHash}`)
  }

  const escrow = lbc.pegOutEscrow
  const chainHeight = await rskConnection.getChainHeight()
  assertTruthy(chainHeight, 'Unable to read the RSK chain height')
  const state = await escrow.getPegOutState(requestHash, chainHeight)
  if (state !== 'REQUESTED') {
    throw FlyoverError.pegoutInvalidState({ requestHash, expected: 'REQUESTED', actual: state })
  }
  const [refundAddress, sender] = await Promise.all([
    escrow.getRefundAddress(requestHash, chainHeight),
    escrow.getSenderAddress()
  ])
  if (!isTextEqualNoCase(refundAddress, sender)) {
    throw FlyoverError.pegoutInvalidSender({ requestHash, expected: refundAddress, actual: sender })
  }

  return escrow.cancelPegOut(requestHash)
}
