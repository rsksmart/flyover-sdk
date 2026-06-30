import { deepFreeze, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'

/**
 * Optional, network-overridable addresses for the commit-first peg-in contracts.
 *
 * These are surfaced as a flyover-sdk extension of {@link FlyoverConfig} so callers can point at a
 * freshly deployed PegInAddressRegistry / FlyoverConfigurations while no canonical mainnet/testnet
 * deployment exists yet. Mirrors the existing `customLbcAddress` override pattern.
 */
export interface FlyoverPeginConfig extends FlyoverConfig {
  /** Custom address of the PegInAddressRegistry contract. */
  customPegInAddressRegistryAddress?: string
  /** Custom address of the FlyoverConfigurations contract. */
  customFlyoverConfigurationsAddress?: string
}

/**
 * Object with available networks to use in the flyover client
 *
 * @remarks
 *
 * Regtest url will be overrided if  {@link FlyoverConfig.customRegtestUrl} is provided to the client in {@link FlyoverConfig}
 * Regtest LBC address will be overrided if  {@link FlyoverConfig.customLbcAddress} is provided to the client in {@link FlyoverConfig}
 *
 * The commit-first peg-in contracts ({@link pegInAddressRegistryAddress} and
 * {@link flyoverConfigurationsAddress}) are only deployed on regtest so far, so they are
 * optional per network. They can always be overridden through
 * {@link FlyoverConfig.customPegInAddressRegistryAddress} and
 * {@link FlyoverConfig.customFlyoverConfigurationsAddress} until canonical mainnet/testnet
 * deployments exist.
 */
export const FlyoverNetworks = deepFreeze({
  Mainnet: {
    pegInContractAddress: '0x9270733402dc7c5730ea24268fc11039fd75e189',
    pegOutContractAddress: '0x9a0678742cfb567874eb4e99df2106bded78f5e4',
    discoveryAddress: '0x9a48c6b18aa000d0bd35d55616bcc98ad3553e7a',
    pegInAddressRegistryAddress: undefined as string | undefined,
    flyoverConfigurationsAddress: undefined as string | undefined,
    chainId: 30
  },
  Testnet: {
    pegInContractAddress: '0xB29fa9754D41C3Bb17d5f89290294F48C13Af59b',
    pegOutContractAddress: '0x48d19e10A166E20746af5037e79A5cEa5BD38Cc8',
    discoveryAddress: '0xE8610c632c4219b0245b39d5Cd216A31F491d919',
    pegInAddressRegistryAddress: undefined as string | undefined,
    flyoverConfigurationsAddress: undefined as string | undefined,
    chainId: 31
  },
  Development: {
    pegInContractAddress: '0xb1e0f1f0a29f8b4c4a2f8eb161711c6527be6a81',
    pegOutContractAddress: '0x4dd0f80e26ed2416bf02550ff8e42de1d59170cb',
    discoveryAddress: '0x9bd4bd617d2a5df4b59a5ba78f52dd85681a3f4e',
    pegInAddressRegistryAddress: undefined as string | undefined,
    flyoverConfigurationsAddress: undefined as string | undefined,
    chainId: 31
  },
  Regtest: {
    pegInContractAddress: '0xcf871fB1D934301dD161A3AD5eB50379527B1CDc',
    pegOutContractAddress: '0x15c240d9Fb91224c0d3Ca9b04Ff63844aA3dF040',
    discoveryAddress: '0xe16b04a1a87aC65a4aF8D46a8b797D0d46572408',
    // Regtest deployment from lbc/broadcast (DeployPegInAddressRegistry / DeployFlyoverConfigurations, chainId 33)
    pegInAddressRegistryAddress: '0x145845fd06c85b7ea1aa2d030e1a747b3d8d15d7' as string | undefined,
    flyoverConfigurationsAddress: '0x4186a8ecd32cf005a5122b63195f7117cbc4be19' as string | undefined,
    chainId: 33
  }
} as const)

export type FlyoverSupportedNetworks = keyof typeof FlyoverNetworks
