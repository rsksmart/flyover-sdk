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
    pegInContractAddress: '0xc023b0df3794cc8a104a6c367796c1f7face6300',
    pegOutContractAddress: '0xee3254ee028a2c7971b6774210fdcc05b3267ca4',
    discoveryAddress: '0x9850388c612adacb1f7db1ebb2ca88573b3de4aa',
    chainId: 31
  },
  Regtest: {
    pegInContractAddress: '0x8A791620dd6260079BF849Dc5567aDC3F2FdC318',
    pegOutContractAddress: '0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e',
    discoveryAddress: '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    chainId: 33
  }
} as const)

export type FlyoverSupportedNetworks = keyof typeof FlyoverNetworks
