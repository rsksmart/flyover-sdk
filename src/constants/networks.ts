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
    lbcAddress: '0xAA9cAf1e3967600578727F975F283446A3Da6612',
    chainId: 30
  },
  Testnet: {
    lbcAddress: '0xc2A630c053D12D63d32b025082f6Ba268db18300',
    chainId: 31
  },
  Development: {
    lbcAddress: '0x18D8212bC00106b93070123f325021C723D503a3',
    chainId: 31
  },
  Regtest: {
    lbcAddress: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
    chainId: 33
  }
} as const)

export type FlyoverSupportedNetworks = keyof typeof FlyoverNetworks
