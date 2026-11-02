import { Connection, executeContractView, FlyoverConfig, isRskAddress } from "@rsksmart/bridges-core-sdk"
import { BytesLike, Contract, utils } from "ethers"
import abi from './pegin-abi'
import { FlyoverNetworks, FlyoverSupportedNetworks } from "../constants/networks"
import { getEip712Domain } from "./lbc"

export class PegInContract {
  private static readonly COMMIT_FIRST_ABI = [
    'function getPegInAddressRegistry() external view returns (address)'
  ]

  private static readonly ADDRESS_REGISTRY_ABI = [
    'function getPegInAddress(address rskAddr) external view returns (bytes payload, uint8 encoding)'
  ]

  private readonly peginContract: Contract

  constructor (private readonly rskConnection: Connection, config: FlyoverConfig) {
    const address = FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegInContractAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid address')
    }
    const peginContract = new Contract(address, [...abi, ...PegInContract.COMMIT_FIRST_ABI], rskConnection.getAbstraction())
    this.peginContract = peginContract
  }

  async getAddress (): Promise<string> {
    return this.peginContract.address
  }

  async getDepositAddress (rskAddress: string): Promise<string> {
    const registry = await this.getAddressRegistry()
    const [payload] = await executeContractView<[BytesLike, number]>(registry, 'getPegInAddress', rskAddress.toLowerCase())
    return utils.base58.encode(payload)
  }

  async getEip712Domain (): Promise<{ name: string, version: string, chainId: bigint, verifyingContract: string }> {
    return getEip712Domain(this.peginContract)
  }

  private async getAddressRegistry (): Promise<Contract> {
    const registryAddress = await executeContractView<string>(this.peginContract, 'getPegInAddressRegistry')
    return new Contract(registryAddress, PegInContract.ADDRESS_REGISTRY_ABI, this.rskConnection.getAbstraction())
  }
}
