import { Connection, FlyoverConfig, isRskAddress, TxResult } from "@rsksmart/bridges-core-sdk"
import { Contract } from "ethers"
import abi from './pegin-abi'
import { type RegisterPeginLbcParams } from '../sdk/registerPegin'
import { type Quote as PeginQuote } from '../api'
import { FlyoverNetworks, FlyoverSupportedNetworks } from "../constants/networks"
import { getEip712Domain } from "./lbc"
import { FlyoverError } from '../client/httpClient'

export class PegInContract {
  private readonly peginContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegInContractAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid address')
    }
    const peginContract = new Contract(address, abi, rskConnection.getAbstraction())
    this.peginContract = peginContract
  }

  async getAddress (): Promise<string> {
    return this.peginContract.address
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async validatePeginDepositAddress (_quote: PeginQuote, _depositAddress: string): Promise<boolean> {
    throw removedFromContract('validatePegInDepositAddress')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async registerPegin (_params: RegisterPeginLbcParams, _action: 'staticCall' | 'execution' = 'execution'): Promise<TxResult> {
    throw removedFromContract('registerPegIn')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async hashPeginQuoteEIP712 (_quote: PeginQuote): Promise<string> {
    throw removedFromContract('hashPegInQuoteEIP712')
  }

  async getEip712Domain (): Promise<{ name: string, version: string, chainId: bigint, verifyingContract: string }> {
    return getEip712Domain(this.peginContract)
  }
}

function removedFromContract (functionName: string): FlyoverError {
  const message = `${functionName} is no longer part of the PegIn contract`
  return new FlyoverError({
    timestamp: Date.now(),
    recoverable: false,
    message,
    details: { error: new Error(message) }
  })
}
