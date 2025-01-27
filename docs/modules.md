[@rsksmart/flyover-sdk](README.md) / Exports

# @rsksmart/flyover-sdk

## Table of contents

### Classes

- [Flyover](classes/Flyover.md)
- [FlyoverError](classes/FlyoverError.md)

### Interfaces

- [AcceptedPegoutQuote](interfaces/AcceptedPegoutQuote.md)
- [AcceptedQuote](interfaces/AcceptedQuote.md)
- [AvailableLiquidity](interfaces/AvailableLiquidity.md)
- [DepositEvent](interfaces/DepositEvent.md)
- [LiquidityProviderBase](interfaces/LiquidityProviderBase.md)
- [LiquidityProviderDetail](interfaces/LiquidityProviderDetail.md)
- [PeginQuoteRequest](interfaces/PeginQuoteRequest.md)
- [PeginQuoteStatus](interfaces/PeginQuoteStatus.md)
- [PegoutQuote](interfaces/PegoutQuote.md)
- [PegoutQuoteDetail](interfaces/PegoutQuoteDetail.md)
- [PegoutQuoteRequest](interfaces/PegoutQuoteRequest.md)
- [PegoutQuoteStatus](interfaces/PegoutQuoteStatus.md)
- [ProviderDetail](interfaces/ProviderDetail.md)
- [Quote](interfaces/Quote.md)
- [QuoteDetail](interfaces/QuoteDetail.md)
- [RegisterPeginParams](interfaces/RegisterPeginParams.md)
- [ValidatePeginTransactionOptions](interfaces/ValidatePeginTransactionOptions.md)
- [ValidatePeginTransactionParams](interfaces/ValidatePeginTransactionParams.md)

### Type Aliases

- [LiquidityProvider](modules.md#liquidityprovider)

### Variables

- [FlyoverNetworks](modules.md#flyovernetworks)
- [FlyoverUtils](modules.md#flyoverutils)

## Type Aliases

### LiquidityProvider

Ƭ **LiquidityProvider**: [`LiquidityProviderBase`](interfaces/LiquidityProviderBase.md) & [`LiquidityProviderDetail`](interfaces/LiquidityProviderDetail.md)

#### Defined in

[src/api/index.ts:37](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/index.ts#L37)

## Variables

### FlyoverNetworks

• `Const` **FlyoverNetworks**: `Object`

Object with available networks to use in the flyover client

**`Remarks`**

Regtest url will be overrided if  FlyoverConfig.customRegtestUrl is provided to the client in FlyoverConfig
Regtest LBC address will be overrided if  FlyoverConfig.customLbcAddress is provided to the client in FlyoverConfig

#### Type declaration

| Name | Type |
| :------ | :------ |
| `Development` | \{ `chainId`: ``31`` = 31; `lbcAddress`: ``"0x18D8212bC00106b93070123f325021C723D503a3"`` = '0x18D8212bC00106b93070123f325021C723D503a3' } |
| `Development.chainId` | ``31`` |
| `Development.lbcAddress` | ``"0x18D8212bC00106b93070123f325021C723D503a3"`` |
| `Mainnet` | \{ `chainId`: ``30`` = 30; `lbcAddress`: ``"0xAA9cAf1e3967600578727F975F283446A3Da6612"`` = '0xAA9cAf1e3967600578727F975F283446A3Da6612' } |
| `Mainnet.chainId` | ``30`` |
| `Mainnet.lbcAddress` | ``"0xAA9cAf1e3967600578727F975F283446A3Da6612"`` |
| `Regtest` | \{ `chainId`: ``33`` = 33; `lbcAddress`: ``"0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8"`` = '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8' } |
| `Regtest.chainId` | ``33`` |
| `Regtest.lbcAddress` | ``"0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8"`` |
| `Testnet` | \{ `chainId`: ``31`` = 31; `lbcAddress`: ``"0xc2A630c053D12D63d32b025082f6Ba268db18300"`` = '0xc2A630c053D12D63d32b025082f6Ba268db18300' } |
| `Testnet.chainId` | ``31`` |
| `Testnet.lbcAddress` | ``"0xc2A630c053D12D63d32b025082f6Ba268db18300"`` |

#### Defined in

[src/constants/networks.ts:11](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/constants/networks.ts#L11)

___

### FlyoverUtils

• `Const` **FlyoverUtils**: `Object`

#### Type declaration

| Name | Type |
| :------ | :------ |
| `getQuoteTotal` | (`quote`: [`Quote`](interfaces/Quote.md) \| [`PegoutQuote`](interfaces/PegoutQuote.md)) => `bigint` |
| `getSimpleQuoteStatus` | (`status`: `string`) => ``"EXPIRED"`` \| ``"PENDING"`` \| ``"SUCCESS"`` \| ``"FAILED"`` |
| `isBtcAddress` | (`address`: `string`) => `boolean` |
| `isBtcMainnetAddress` | (`address`: `string`) => `boolean` |
| `isBtcNativeSegwitAddress` | (`address`: `string`) => `boolean` |
| `isBtcTestnetAddress` | (`address`: `string`) => `boolean` |
| `isLegacyBtcAddress` | (`address`: `string`) => `boolean` |
| `isPeginStillPayable` | (`quote`: [`Quote`](interfaces/Quote.md)) => `boolean` |
| `isRskAddress` | (`address`: `string`) => `boolean` |
| `isRskChecksummedAddress` | (`address`: `string`, `chainId`: ``30`` \| ``31`` \| ``33``) => `boolean` |
| `rskChecksum` | (`address`: `string`, `chainId`: ``30`` \| ``31`` \| ``33``) => `string` |

#### Defined in

[src/sdk/flyoverUtils.ts:9](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyoverUtils.ts#L9)
