import { Connection, executeContractView, isRskAddress } from '@rsksmart/bridges-core-sdk'
import { BigNumber, Contract } from 'ethers'
import abi from './flyover-configurations-abi'
import { IFlyoverConfigurations } from './bindings/FlyoverConfigurations'
import { FlyoverNetworks, FlyoverSupportedNetworks, type FlyoverPeginConfig } from '../constants/networks'

/** A confirmation tier of the peg-in configuration. */
export interface ConfirmationTier {
  maxAmount: bigint
  confirmations: bigint
}

/** Normalized (bigint) view of the on-chain peg-in configuration. */
export interface PegInConfiguration {
  fixedFee: bigint
  percentageFee: bigint
  penaltyFee: bigint
  confirmationTiers: ConfirmationTier[]
  callTime: bigint
  expireTime: bigint
  expireBlocks: bigint
  deliveryGrace: bigint
  minAmount: bigint
  maxAmount: bigint
}

/** Wrapper around the on-chain FlyoverConfigurations contract. */
export class FlyoverConfigurationsContract {
  private readonly configurationsContract: Contract

  constructor (rskConnection: Connection, config: FlyoverPeginConfig) {
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
   * Reads the protocol fee for a peg-in of the given amount from the configurations contract.
   * This replaces the old per-LP quote: the fee is read directly from chain.
   *
   * @param amount the peg-in amount in wei (RBTC)
   * @returns the fee in wei
   */
  async calculatePegInFee (amount: bigint): Promise<bigint> {
    const fee = await executeContractView<BigNumber>(this.configurationsContract, 'calculatePegInFee', amount)
    return BigInt(fee.toString())
  }

  /**
   * Reads the number of BTC confirmations required for a peg-in of the given amount.
   *
   * @param amount the peg-in amount in wei (RBTC)
   * @returns the required confirmations
   */
  async getRequiredPegInConfirmations (amount: bigint): Promise<bigint> {
    const confirmations = await executeContractView<BigNumber>(
      this.configurationsContract, 'getRequiredPegInConfirmations', amount
    )
    return BigInt(confirmations.toString())
  }

  /** Reads the full peg-in configuration. */
  async getPegInConfiguration (): Promise<PegInConfiguration> {
    const config = await executeContractView<IFlyoverConfigurations.PegConfigurationStructOutput>(
      this.configurationsContract, 'getPegInConfiguration'
    )
    return {
      fixedFee: BigInt(config.fixedFee.toString()),
      percentageFee: BigInt(config.percentageFee.toString()),
      penaltyFee: BigInt(config.penaltyFee.toString()),
      confirmationTiers: config.confirmationTiers.map(tier => ({
        maxAmount: BigInt(tier.maxAmount.toString()),
        confirmations: BigInt(tier.confirmations.toString())
      })),
      callTime: BigInt(config.callTime.toString()),
      expireTime: BigInt(config.expireTime.toString()),
      expireBlocks: BigInt(config.expireBlocks.toString()),
      deliveryGrace: BigInt(config.deliveryGrace.toString()),
      minAmount: BigInt(config.minAmount.toString()),
      maxAmount: BigInt(config.maxAmount.toString())
    }
  }
}
