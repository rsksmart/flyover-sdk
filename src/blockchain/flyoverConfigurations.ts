import { type Connection, executeContractView, type FlyoverConfig, isRskAddress } from '@rsksmart/bridges-core-sdk'
import { type BigNumber, Contract } from 'ethers'
import abi from './flyover-configurations-abi'
import { type IFlyoverConfigurations } from './bindings/FlyoverConfigurations'
import { FlyoverNetworks, type FlyoverSupportedNetworks } from '../constants/networks'

/** A confirmation tier: amounts up to maxAmount (wei) require confirmations BTC confirmations. */
export interface ConfirmationTier {
  maxAmount: bigint
  confirmations: bigint
}

/** Normalized (bigint) view of the on-chain `IFlyoverConfigurations.PegOutConfiguration`. */
export interface PegOutConfiguration {
  /** Fixed component of the peg-out fee, in wei */
  fixedFee: bigint
  /** Proportional component of the peg-out fee, in basis points over 10,000 */
  percentageFee: bigint
  /** Minimum serviceable peg-out amount, in wei */
  minAmount: bigint
  /** Maximum serviceable peg-out amount, in wei */
  maxAmount: bigint
  /** BTC confirmations required by amount, strictly ascending by maxAmount */
  confirmationTiers: ConfirmationTier[]
  /** Individual / global slash amount, in wei */
  penaltyFee: bigint
  /** Seconds from request to the claim deadline */
  claimWindow: bigint
  /** Blocks from request added to the fulfillment block bound; does not gate the claim */
  claimWindowBlocks: bigint
  /** Late-delivery window measured from the claim, in seconds */
  callTime: bigint
  /** Seconds after the claim deadline until the user can be refunded */
  expireTime: bigint
  /** Blocks after the claim block bound until the user can be refunded */
  expireBlocks: bigint
  /** BTC miner-fee reserve charged as the peg-out gasFee, in wei */
  maxMinerFee: bigint
}

/** Wrapper around the on-chain FlyoverConfigurations contract. */
export class FlyoverConfigurationsContract {
  private readonly configurationsContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = config.customFlyoverConfigurationsAddress ??
      FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.flyoverConfigurationsAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid FlyoverConfigurations address. Provide customFlyoverConfigurationsAddress in the Flyover config for this network')
    }
    this.configurationsContract = new Contract(address, abi, rskConnection.getAbstraction())
  }

  async getAddress (): Promise<string> {
    return this.configurationsContract.address
  }

  /**
   * Reads the active peg-out configuration.
   *
   * @param blockTag block number to read at
   */
  async getPegOutConfiguration (blockTag: number): Promise<PegOutConfiguration> {
    const config = await executeContractView<IFlyoverConfigurations.PegOutConfigurationStructOutput>(
      this.configurationsContract, 'getPegOutConfiguration', { blockTag }
    )
    return {
      fixedFee: config.fixedFee.toBigInt(),
      percentageFee: config.percentageFee.toBigInt(),
      minAmount: config.minAmount.toBigInt(),
      maxAmount: config.maxAmount.toBigInt(),
      confirmationTiers: config.confirmationTiers.map(tier => ({
        maxAmount: tier.maxAmount.toBigInt(),
        confirmations: tier.confirmations.toBigInt()
      })),
      penaltyFee: config.penaltyFee.toBigInt(),
      claimWindow: config.claimWindow.toBigInt(),
      claimWindowBlocks: config.claimWindowBlocks.toBigInt(),
      callTime: config.callTime.toBigInt(),
      expireTime: config.expireTime.toBigInt(),
      expireBlocks: config.expireBlocks.toBigInt(),
      maxMinerFee: config.maxMinerFee.toBigInt()
    }
  }

  /**
   * Reads the peg-out fee (callFee) for the given principal.
   *
   * @param amount the peg-out principal, in wei
   * @param blockTag block number to read at
   */
  async calculatePegOutFee (amount: bigint, blockTag: number): Promise<bigint> {
    const fee = await executeContractView<BigNumber>(
      this.configurationsContract, 'calculatePegOutFee', amount, { blockTag }
    )
    return fee.toBigInt()
  }

  /**
   * Reads the BTC confirmations required before a peg-out of the given principal can settle.
   *
   * @param amount the peg-out principal, in wei
   * @param blockTag block number to read at
   */
  async getRequiredPegOutBtcConfirmations (amount: bigint, blockTag: number): Promise<bigint> {
    const confirmations = await executeContractView<BigNumber>(
      this.configurationsContract, 'getRequiredPegOutBtcConfirmations', amount, { blockTag }
    )
    return confirmations.toBigInt()
  }
}
