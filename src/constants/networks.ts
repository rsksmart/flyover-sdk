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
    pegInContractAddress: '0xcf871fB1D934301dD161A3AD5eB50379527B1CDc',
    pegOutContractAddress: '0x15c240d9Fb91224c0d3Ca9b04Ff63844aA3dF040',
    discoveryAddress: '0xe16b04a1a87aC65a4aF8D46a8b797D0d46572408',
    chainId: 31
  },
  Regtest: {
    pegInContractAddress: '0xcf871fB1D934301dD161A3AD5eB50379527B1CDc',
    pegOutContractAddress: '0x15c240d9Fb91224c0d3Ca9b04Ff63844aA3dF040',
    discoveryAddress: '0xe16b04a1a87aC65a4aF8D46a8b797D0d46572408',
    chainId: 33
  }
} as const)

export type FlyoverSupportedNetworks = keyof typeof FlyoverNetworks
