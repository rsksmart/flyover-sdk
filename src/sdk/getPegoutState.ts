import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { isPegoutId, type PegoutState } from '../blockchain/pegoutEscrow'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'

const ZERO_ID = /^0x0{64}$/

/**
 * Reads the state of a commit-first peg-out for its whole life, from chain reads alone.
 *
 * The escrow keeps a peg-out under its request id until an LP claims it, then moves it to a new id,
 * so the request id alone reads NONE after a claim. With the nonce that requestPegOut returned, the
 * current id is resolved through the escrow, and the claimed peg-out keeps reporting its real state.
 *
 * @param context the SDK context, with the RSK connection and the PegOutEscrow contract set
 * @param requestHash the peg-out id returned by requestPegOut
 * @param nonce the escrow nonce returned by requestPegOut; without it a claimed peg-out reads NONE
 */
export async function getPegoutState (context: FlyoverSDKContext, requestHash: string, nonce?: bigint): Promise<PegoutState> {
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

  // REQUESTED, CANCELLED and the no-claim REFUNDED stay under the request id
  const state = await escrow.getPegOutState(requestHash, chainHeight)
  if (state !== 'NONE' || nonce === undefined) {
    return state
  }
  // NONE with a nonce: either never issued, or claimed and moved to a new id
  const currentId = await escrow.requestIdAt(nonce, chainHeight)
  if (ZERO_ID.test(currentId)) {
    return 'NONE'
  }
  return escrow.getPegOutState(currentId, chainHeight)
}
