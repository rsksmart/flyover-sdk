import {
  assertTruthy, type FlyoverConfig, isBtcAddress, isBtcMainnetAddress, isBtcTestnetAddress, isRskAddress
} from '@rsksmart/bridges-core-sdk'
import { type PegoutRequest } from '../blockchain/pegoutEscrow'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { validateRskChecksum } from '../utils/validation'
import { assertPegoutServiceable, splitPegoutValue } from './estimatePegout'

const ZERO_ADDRESS = /^0x0{40}$/i

/**
 * Starts a commit-first peg-out: one PegOutEscrow.requestPegOut transaction that escrows `value`.
 * Every check the escrow would revert on runs first, against the live peg-out configuration, so a
 * rejected request never sends a transaction.
 *
 * @param context the SDK context, with the RSK connection and the commit-first contracts set
 * @param destinationAddress the BTC address that receives the peg-out
 * @param refundAddress the RSK address that can cancel the request and receives every refund
 * @param value the RBTC to send, in wei; use `value` from the peg-out estimate
 */
export async function requestPegout (
  context: FlyoverSDKContext,
  destinationAddress: string,
  refundAddress: string,
  value: bigint
): Promise<PegoutRequest> {
  const { config, lbc, rskConnection } = context
  assertTruthy(rskConnection, 'Missing RSK connection')
  assertTruthy(lbc, 'Missing Liquidity Bridge Contract')
  assertTruthy(lbc.flyoverConfigurations, 'Missing FlyoverConfigurations contract')
  assertTruthy(lbc.pegOutEscrow, 'Missing PegOutEscrow contract')

  validateDestinationAddress(config, destinationAddress)
  validateRefundAddress(config, refundAddress)

  const chainHeight = await rskConnection.getChainHeight()
  assertTruthy(chainHeight, 'Unable to read the RSK chain height')
  const pegOutConfig = await lbc.flyoverConfigurations.getPegOutConfiguration(chainHeight)
  const { amount } = splitPegoutValue(value, pegOutConfig, BigInt(0))
  assertPegoutServiceable(amount, pegOutConfig)

  return lbc.pegOutEscrow.requestPegOut(destinationAddress, refundAddress, value)
}

function validateDestinationAddress (config: FlyoverConfig, address: string): void {
  if (!isBtcAddress(address)) {
    throw FlyoverError.unsupportedBtcAddressError(address)
  }
  const isMainnet = config.network === 'Mainnet'
  if (isMainnet ? !isBtcMainnetAddress(address) : !isBtcTestnetAddress(address)) {
    throw FlyoverError.wrongNetworkError(isMainnet)
  }
}

function validateRefundAddress (config: FlyoverConfig, address: string): void {
  if (!isRskAddress(address) || ZERO_ADDRESS.test(address)) {
    throw FlyoverError.invalidRskAddress(address)
  }
  validateRskChecksum(config, address)
}
