import { callContractFunction, Connection, executeContractFunction, executeContractView, FlyoverConfig, isRskAddress, TxResult } from "@rsksmart/bridges-core-sdk"
import { BigNumber, BytesLike, Contract, utils } from "ethers"
import abi from './pegin-abi'
import { type RegisterPeginLbcParams } from '../sdk/registerPegin'
import { ensureHexPrefix } from '../utils/format'
import { FlyoverNetworks, FlyoverSupportedNetworks } from "../constants/networks"
import { getEip712Domain, validateNotPaused } from "./lbc"

export class PegInContract {
  private static readonly COMMIT_FIRST_ABI = [
    'function resolvePegIn(address rskAddr, bytes btcRawTransaction, bytes partialMerkleTree, uint256 height) external returns (int256 registerResult)',
    'function getPegInAddressRegistry() external view returns (address)',
    'event PegInRequested(bytes32 indexed pegInId, address indexed claimer, address indexed rskAddr, uint256 amount, uint256 netToUser, bool callSuccess)'
  ]

  private static readonly ADDRESS_REGISTRY_ABI = [
    'function getPegInAddress(address rskAddr) external view returns (bytes payload, uint8 encoding)',
    'function getRegistrationBlock(address rskAddr) external view returns (uint96 registrationBlock)'
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

  async isPeginPaid (rskAddress: string, btcTransactionHash: string): Promise<boolean> {
    const destination = rskAddress.toLowerCase()
    const registry = await this.getAddressRegistry()
    const registrationBlock = await executeContractView<BigNumber>(registry, 'getRegistrationBlock', destination)
    if (registrationBlock.isZero()) {
      return false
    }
    const pegInId = utils.solidityKeccak256(['address', 'bytes32'], [destination, ensureHexPrefix(btcTransactionHash)])
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const filter = this.peginContract.filters.PegInRequested!(pegInId)
    const events = await this.peginContract.queryFilter(filter, registrationBlock.toNumber())
    return events.some(event => event.args?.callSuccess === true)
  }

  async resolvePegin (params: RegisterPeginLbcParams): Promise<TxResult> {
    await validateNotPaused(this.peginContract)
    return executeContractFunction(this.peginContract, 'resolvePegIn', ...this.toResolvePeginArguments(params))
  }

  async simulateResolvePegin (params: RegisterPeginLbcParams): Promise<bigint> {
    await validateNotPaused(this.peginContract)
    const result = await callContractFunction<BigNumber>(this.peginContract, 'resolvePegIn', ...this.toResolvePeginArguments(params))
    return result.toBigInt()
  }

  async getEip712Domain (): Promise<{ name: string, version: string, chainId: bigint, verifyingContract: string }> {
    return getEip712Domain(this.peginContract)
  }

  private async getAddressRegistry (): Promise<Contract> {
    const registryAddress = await executeContractView<string>(this.peginContract, 'getPegInAddressRegistry')
    return new Contract(registryAddress, PegInContract.ADDRESS_REGISTRY_ABI, this.rskConnection.getAbstraction())
  }

  private toResolvePeginArguments (params: RegisterPeginLbcParams): [string, Uint8Array, Uint8Array, number] {
    const { rskAddress, btcRawTransaction, partialMerkleTree, height } = params
    return [
      rskAddress.toLowerCase(),
      utils.arrayify(ensureHexPrefix(btcRawTransaction)),
      utils.arrayify(ensureHexPrefix(partialMerkleTree)),
      height
    ]
  }
}
