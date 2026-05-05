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
    pegInContractAddress: '0x2d0b3915ae7765b3ea7c097ac3e3e53421765335',
    pegOutContractAddress: '0x9dcf3c5778abbe63bfc97dcaa52139b8c234d253',
    discoveryAddress: '0x10e55f37bdcd38a18679f1c7cd8584f7daea7bb5',
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
