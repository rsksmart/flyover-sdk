import { deepFreeze } from '@rsksmart/bridges-core-sdk'

/**
 * Object with available networks to use in the flyover client
 *
 * @remarks
 *
 * Regtest url will be overrided if  {@link FlyoverConfig.customRegtestUrl} is provided to the client in {@link FlyoverConfig}
 * Regtest LBC address will be overrided if  {@link FlyoverConfig.customLbcAddress} is provided to the client in {@link FlyoverConfig}
 */
export const FlyoverNetworks = deepFreeze({
  Mainnet: {
    pegInContractAddress: '0x514148ca5bb08acfb082777cd4ce32beb6bf5d00',
    pegOutContractAddress: '0xde16e087cc8209182b693b619c13aa272df9de84',
    discoveryAddress: '0xf484ed4aaf47a5f584c4edcf29c146139baea460',
    chainId: 30
  },
  Testnet: {
    pegInContractAddress: '0xB29fa9754D41C3Bb17d5f89290294F48C13Af59b',
    pegOutContractAddress: '0x48d19e10A166E20746af5037e79A5cEa5BD38Cc8',
    discoveryAddress: '0xE8610c632c4219b0245b39d5Cd216A31F491d919',
    chainId: 31
  },
  Development: {
    pegInContractAddress: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    pegOutContractAddress: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    discoveryAddress: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    chainId: 31
  },
  Regtest: {
    pegInContractAddress: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    pegOutContractAddress: '0x0DCd1Bf9A1b36cE34237eEaFef220932846BCD82',
    discoveryAddress: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    chainId: 33
  }
} as const)

export type FlyoverSupportedNetworks = keyof typeof FlyoverNetworks
