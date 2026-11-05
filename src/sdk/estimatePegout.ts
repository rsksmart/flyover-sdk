import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type PegOutConfiguration } from '../blockchain/flyoverConfigurations'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { SAT_TO_WEI } from '../constants/units'

const FEE_PERCENTAGE_DENOMINATOR = BigInt(10_000)
// PegOutContract caps a quote's deadlines at the native peg-out's: 36 hours and 4000 blocks
const NATIVE_PEGOUT_SECONDS = BigInt(129_600)
const NATIVE_PEGOUT_BLOCKS = BigInt(4_000)
const ZERO = BigInt(0)
const ONE = BigInt(1)

/** How `PegOutEscrow.requestPegOut` splits the RBTC sent with the request. */
export interface PegoutValueSplit {
  /** Peg-out principal in wei, a whole number of satoshis. The BTC delivered is at least this amount. */
  amount: bigint
  /** Fee kept by the LP that serves the peg-out, in wei. Covers the LP's RSK gas for the claim and the proof. */
  callFee: bigint
  /** BTC miner-fee reserve, in wei. Equals `maxMinerFee` at request time. */
  gasFee: bigint
  /** Part of the sent value refunded to the refund address in the same transaction, in wei */
  change: bigint
}

/** Commit-first peg-out estimate, built from on-chain reads at one block. */
export interface PegoutEstimate extends PegoutValueSplit {
  /** RBTC to send with `requestPegOut`, in wei: `amount + callFee + gasFee + change` */
  value: bigint
  /** Minimum BTC the destination address is guaranteed to receive, in wei. Equals `amount`. */
  minimumBtcReceived: bigint
  /** BTC confirmations the LP's payment needs before the LP can settle */
  requiredConfirmations: bigint
  /** Claim deadline (unix seconds). An unclaimed peg-out is refundable after it. */
  depositDateLimit: bigint
  /** Fulfillment deadline (unix seconds). A claimed but unproven peg-out is refundable after it and after `expireBlock`. */
  expireDate: bigint
  /** Fulfillment block bound. A claimed but unproven peg-out is refundable after it and after `expireDate`. */
  expireBlock: bigint
  /** Late-delivery window measured from the claim, in seconds. Delivering later penalizes the LP. */
  transferTime: bigint
  /** Block the estimate was read at. The deadlines assume the request is mined in this block. */
  blockNumber: bigint
  /** Timestamp of {@link PegoutEstimate.blockNumber}, in unix seconds */
  blockTimestamp: bigint
}

/**
 * Peg-out fee for a principal, mirroring `FlyoverConfigurations.calculatePegOutFee`:
 * `fixedFee + percentageFee * amount / 10000`, floored to a satoshi when it exceeds one satoshi.
 */
export function calculatePegoutFee (
  config: Pick<PegOutConfiguration, 'fixedFee' | 'percentageFee'>,
  amount: bigint
): bigint {
  let fee = config.fixedFee + (amount * config.percentageFee) / FEE_PERCENTAGE_DENOMINATOR
  if (fee > SAT_TO_WEI && fee % SAT_TO_WEI !== ZERO) {
    fee -= fee % SAT_TO_WEI
  }
  return fee
}

/**
 * Splits the value sent with `requestPegOut` exactly as `PegOutEscrow` does: reserves `maxMinerFee`
 * as `gasFee`, derives the satoshi-floored principal from the remainder, then refunds change at or
 * above `dustThreshold` and folds smaller change into `callFee`.
 *
 * @param value the RBTC sent with the request, in wei
 * @param config the active peg-out configuration
 * @param dustThreshold `PegOutContract.dustThreshold`, in wei
 *
 * @throws { FlyoverError } When the value cannot cover `fixedFee + maxMinerFee` and its own fee
 */
export function splitPegoutValue (
  value: bigint,
  config: Pick<PegOutConfiguration, 'fixedFee' | 'percentageFee' | 'maxMinerFee'>,
  dustThreshold: bigint
): PegoutValueSplit {
  const gasFee = config.maxMinerFee
  if (value <= config.fixedFee + gasFee) {
    throw FlyoverError.pegoutInsufficientValue({ value, minimum: config.fixedFee + gasFee + ONE })
  }
  let amount = ((value - config.fixedFee - gasFee) * FEE_PERCENTAGE_DENOMINATOR) /
    (FEE_PERCENTAGE_DENOMINATOR + config.percentageFee)
  amount -= amount % SAT_TO_WEI
  let callFee = calculatePegoutFee(config, amount)
  const required = amount + callFee + gasFee
  if (value < required) {
    throw FlyoverError.pegoutInsufficientValue({ value, minimum: required })
  }
  let change = value - required
  if (dustThreshold > change) {
    callFee += change
    change = ZERO
  }
  return { amount, callFee, gasFee, change }
}

/**
 * Smallest value whose {@link splitPegoutValue} yields exactly `amount`. Adding
 * `calculatePegoutFee(amount)` to the amount is not enough: that fee is floored to a satoshi, so
 * the escrow would derive one satoshi less.
 *
 * @param amount the peg-out principal in wei, a whole number of satoshis
 * @param config the active peg-out configuration
 */
export function pegoutValueForAmount (
  amount: bigint,
  config: Pick<PegOutConfiguration, 'fixedFee' | 'percentageFee' | 'maxMinerFee'>
): bigint {
  const grossAmount = ceilDiv(amount * (FEE_PERCENTAGE_DENOMINATOR + config.percentageFee), FEE_PERCENTAGE_DENOMINATOR)
  return config.fixedFee + config.maxMinerFee + grossAmount
}

/**
 * Builds the commit-first peg-out estimate for a principal. Every read happens at the same block,
 * so the result equals what `requestPegOut` would charge and store if mined in that block.
 * It makes no request to any liquidity provider.
 *
 * @param context the SDK context, with the RSK connection and the FlyoverConfigurations contract set
 * @param amount the BTC to deliver, in wei; must be a whole number of satoshis
 */
export async function estimatePegout (context: FlyoverSDKContext, amount: bigint): Promise<PegoutEstimate> {
  const { lbc, rskConnection } = context
  assertTruthy(rskConnection, 'Missing RSK connection')
  assertTruthy(lbc, 'Missing Liquidity Bridge Contract')
  assertTruthy(lbc.flyoverConfigurations, 'Missing FlyoverConfigurations contract')

  if (amount <= ZERO) {
    throw FlyoverError.invalidPegoutAmount({ amount, reason: 'the amount must be greater than zero' })
  }
  if (amount % SAT_TO_WEI !== ZERO) {
    throw FlyoverError.invalidPegoutAmount({ amount, reason: 'the amount must be a whole number of satoshis' })
  }

  const provider = rskConnection.getUnderlyingProvider()
  assertTruthy(provider, 'Missing RSK provider')
  const block = await provider.getBlock('latest')
  const configurations = lbc.flyoverConfigurations
  const [config, dustThreshold, onchainFee, requiredConfirmations] = await Promise.all([
    configurations.getPegOutConfiguration(block.number),
    lbc.pegOutContract.getDustThreshold(block.number),
    configurations.calculatePegOutFee(amount, block.number),
    configurations.getRequiredPegOutBtcConfirmations(amount, block.number)
  ])

  const sdkFee = calculatePegoutFee(config, amount)
  if (sdkFee !== onchainFee) {
    throw FlyoverError.withReason(
      `peg-out fee mismatch: the SDK computes ${sdkFee.toString()}, FlyoverConfigurations returns ${onchainFee.toString()}`
    )
  }
  const value = pegoutValueForAmount(amount, config)
  const split = splitPegoutValue(value, config, dustThreshold)

  assertPegoutServiceable(amount, config)

  const blockNumber = BigInt(block.number)
  const blockTimestamp = BigInt(block.timestamp)
  const depositDateLimit = blockTimestamp + config.claimWindow
  return {
    ...split,
    value,
    minimumBtcReceived: split.amount,
    requiredConfirmations,
    depositDateLimit,
    expireDate: depositDateLimit + config.expireTime,
    expireBlock: blockNumber + config.claimWindowBlocks + config.expireBlocks,
    transferTime: config.callTime,
    blockNumber,
    blockTimestamp
  }
}

/**
 * Rejects what `PegOutEscrow.requestPegOut` would reject for a principal, in the contract's order:
 * an amount outside `[minAmount, maxAmount]`, then deadlines above the native peg-out cap.
 *
 * @throws { FlyoverError } When the escrow would revert with `NotServiceable` or `UnfairQuote`
 */
export function assertPegoutServiceable (amount: bigint, config: PegOutConfiguration): void {
  if (amount < config.minAmount || amount > config.maxAmount) {
    throw FlyoverError.pegoutNotServiceable({
      amount,
      minAmount: config.minAmount,
      maxAmount: config.maxAmount,
      violatedBound: amount < config.minAmount ? 'minAmount' : 'maxAmount'
    })
  }
  const deadlineSeconds = config.claimWindow + config.expireTime
  const deadlineBlocks = config.claimWindowBlocks + config.expireBlocks
  if (deadlineSeconds > NATIVE_PEGOUT_SECONDS || deadlineBlocks > NATIVE_PEGOUT_BLOCKS) {
    throw FlyoverError.unfairPegoutConfiguration({
      deadlineSeconds,
      maxSeconds: NATIVE_PEGOUT_SECONDS,
      deadlineBlocks,
      maxBlocks: NATIVE_PEGOUT_BLOCKS
    })
  }
}

function ceilDiv (numerator: bigint, denominator: bigint): bigint {
  return (numerator + denominator - ONE) / denominator
}
