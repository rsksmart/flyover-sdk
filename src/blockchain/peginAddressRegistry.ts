import { Connection, executeContractView, isRskAddress } from '@rsksmart/bridges-core-sdk'
import { BytesLike, Contract, utils } from 'ethers'
import abi from './pegin-address-registry-abi'
import { FlyoverNetworks, FlyoverSupportedNetworks, type FlyoverPeginConfig } from '../constants/networks'

/**
 * Address encoding reported by the on-chain PegInAddressRegistry.
 * Mirrors the `IPegInAddressRegistry.Encoding` enum.
 */
export enum PegInAddressEncoding {
  BASE58 = 0,
  BECH32 = 1,
  BECH32M = 2
}

/**
 * Decode the raw bytes returned by `getPegInAddress` into a human readable BTC address,
 * according to the reported {@link PegInAddressEncoding}.
 *
 * For BASE58 the registry returns the raw base58check **payload** (version byte +
 * 20-byte hash + 4-byte checksum), so we base58-encode it directly (the checksum is
 * already part of the payload, hence no additional base58check wrapping).
 *
 * @param rawAddress the raw `bytes` returned by the registry
 * @param encoding the `Encoding` value returned alongside the bytes
 * @returns the human readable BTC address string
 */
export function decodePegInAddress (rawAddress: BytesLike, encoding: PegInAddressEncoding): string {
  switch (encoding) {
    case PegInAddressEncoding.BASE58:
      return utils.base58.encode(rawAddress)
    case PegInAddressEncoding.BECH32:
    case PegInAddressEncoding.BECH32M:
      throw new Error(`unsupported peg-in address encoding: ${PegInAddressEncoding[encoding]} (not implemented yet)`)
    default:
      throw new Error(`unknown peg-in address encoding: ${String(encoding)}`)
  }
}

/** Wrapper around the on-chain PegInAddressRegistry contract. */
export class PegInAddressRegistryContract {
  private readonly registryContract: Contract

  constructor (rskConnection: Connection, config: FlyoverPeginConfig) {
    const address = config.customPegInAddressRegistryAddress ??
      FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegInAddressRegistryAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid PegInAddressRegistry address. Provide customPegInAddressRegistryAddress in the Flyover config for this network')
    }
    this.registryContract = new Contract(address, abi, rskConnection.getAbstraction())
  }

  async getAddress (): Promise<string> {
    return this.registryContract.address
  }

  /**
   * Re-derives, live, the BTC deposit address for the given RSK address from the registry.
   * Reflects the current powpeg, since the contract derives against the active redeem script.
   *
   * @param rskAddress the user's RSK address
   * @returns the human readable BTC deposit address
   */
  async getPegInDepositAddress (rskAddress: string): Promise<string> {
    if (!isRskAddress(rskAddress)) {
      throw new Error('invalid RSK address')
    }
    const [rawAddress, encoding] = await executeContractView<[string, number]>(
      this.registryContract, 'getPegInAddress', rskAddress
    )
    return decodePegInAddress(rawAddress, encoding as PegInAddressEncoding)
  }

  /**
   * Batch version of {@link getPegInDepositAddress}. The registry returns a single shared
   * encoding for the whole batch.
   *
   * @param rskAddresses the user RSK addresses
   * @returns the human readable BTC deposit addresses, in the same order
   */
  async getPegInDepositAddresses (rskAddresses: string[]): Promise<string[]> {
    rskAddresses.forEach(address => {
      if (!isRskAddress(address)) {
        throw new Error(`invalid RSK address: ${address}`)
      }
    })
    const [rawAddresses, encoding] = await executeContractView<[string[], number]>(
      this.registryContract, 'getPegInAddresses', rskAddresses
    )
    return rawAddresses.map(rawAddress => decodePegInAddress(rawAddress, encoding as PegInAddressEncoding))
  }

  /**
   * Whether the given RSK address has been registered in the registry.
   *
   * @param rskAddress the user's RSK address
   */
  async isRegistered (rskAddress: string): Promise<boolean> {
    if (!isRskAddress(rskAddress)) {
      throw new Error('invalid RSK address')
    }
    return executeContractView<boolean>(this.registryContract, 'isRegistered', rskAddress)
  }

  /** The current registration root (running hash of all registrations). */
  async getRegistrationRoot (): Promise<string> {
    const root = await executeContractView<BytesLike>(this.registryContract, 'getRegistrationRoot')
    return utils.hexlify(root)
  }
}
