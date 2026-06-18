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
    pegInContractAddress: '0x9270733402dc7c5730ea24268fc11039fd75e189',
    pegOutContractAddress: '0x9a0678742cfb567874eb4e99df2106bded78f5e4',
    discoveryAddress: '0x9a48c6b18aa000d0bd35d55616bcc98ad3553e7a',
    chainId: 30
  },
  Testnet: {
    pegInContractAddress: '0xB29fa9754D41C3Bb17d5f89290294F48C13Af59b',
    pegOutContractAddress: '0x48d19e10A166E20746af5037e79A5cEa5BD38Cc8',
    discoveryAddress: '0xE8610c632c4219b0245b39d5Cd216A31F491d919',
    chainId: 31
  },
  Development: {
    pegInContractAddress: '0xb1e0f1f0a29f8b4c4a2f8eb161711c6527be6a81',
    pegOutContractAddress: '0x4dd0f80e26ed2416bf02550ff8e42de1d59170cb',
    discoveryAddress: '0x9bd4bd617d2a5df4b59a5ba78f52dd85681a3f4e',
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
