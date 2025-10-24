import { Connection, executeContractView, FlyoverConfig, isRskAddress } from "@rsksmart/bridges-core-sdk"
import { BigNumberish, Contract } from "ethers"
import abi from './flyover-discovery-abi'
import { LiquidityProviderBase } from "../api"
import { FlyoverNetworks, FlyoverSupportedNetworks } from "../constants/networks"
import { Flyover } from "./bindings/Discovery"

export class DiscoveryContract {
    private readonly discoveryContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.discoveryAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid address')
    }
    const discoveryContract = new Contract(address, abi, rskConnection.getAbstraction())
    this.discoveryContract = discoveryContract
  }

  async getAddress (): Promise<string> {
    return this.discoveryContract.getAddress()
  }

  async getProviders (): Promise<LiquidityProviderBase[]> {
    return executeContractView<Flyover.LiquidityProviderStructOutput[]>(this.discoveryContract, 'getProviders')
      .then(liquidityProviders => liquidityProviders.map(lp => this.fromContractLiquidityProvider(lp)))
  }

    private fromContractLiquidityProvider (lp: Flyover.LiquidityProviderStructOutput): LiquidityProviderBase {
      return {
        apiBaseUrl: lp.apiBaseUrl,
        id: lp.id.toNumber(),
        name: lp.name,
        provider: lp.providerAddress,
        providerType: this.getProviderType(lp.providerType),
        status: lp.status
      }
}

    private getProviderType(type: BigNumberish): string {
        switch (BigInt(type.toString())) {
            case BigInt(0):
                return 'pegin'
            case BigInt(1):
                return 'pegout'
            case BigInt(2):
                return 'both'
            default:
                throw new Error('invalid provider type')
        }
    }
}
