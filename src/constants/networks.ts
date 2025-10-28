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
    pegInContractAddress: '0x9957A338858bc941dA9D0ED2ACBCa4F16116B836',
    pegOutContractAddress: '0x9f84F92d952f90027618089F6F2a3481f1a3fa0F',
    discoveryAddress: '0x24307fAF57D235783582F1912Ef6A384ab456568',
    chainId: 30
  },
  Testnet: {
    pegInContractAddress: '0x9957A338858bc941dA9D0ED2ACBCa4F16116B836',
    pegOutContractAddress: '0x9f84F92d952f90027618089F6F2a3481f1a3fa0F',
    discoveryAddress: '0x24307fAF57D235783582F1912Ef6A384ab456568',
    chainId: 31
  },
  Development: {
    pegInContractAddress: '0x9957A338858bc941dA9D0ED2ACBCa4F16116B836',
    pegOutContractAddress: '0x9f84F92d952f90027618089F6F2a3481f1a3fa0F',
    discoveryAddress: '0x24307fAF57D235783582F1912Ef6A384ab456568',
    chainId: 31
  },
  Regtest: {
    pegInContractAddress: '0x79bbC6403708C6578B0896bF1d1a91D2BB2AAa1c',
    pegOutContractAddress: '0xA66939ac57893C2E65425a5D66099Bc20C76D4CD',
    discoveryAddress: '0xdac5481925A298B95Bf5b54c35b68FC6fc2eF423',
    chainId: 33
  }
} as const)

export type FlyoverSupportedNetworks = keyof typeof FlyoverNetworks
