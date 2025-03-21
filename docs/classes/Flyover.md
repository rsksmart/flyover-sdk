[@rsksmart/flyover-sdk](../README.md) / [Exports](../modules.md) / Flyover

# Class: Flyover

Class that represents the entrypoint to the Flyover SDK

## Implements

- `Bridge`

## Table of contents

### Constructors

- [constructor](Flyover.md#constructor)

### Properties

- [config](Flyover.md#config)
- [httpClient](Flyover.md#httpclient)
- [lastPeginQuote](Flyover.md#lastpeginquote)
- [lastPegoutQuote](Flyover.md#lastpegoutquote)
- [liquidityBridgeContract](Flyover.md#liquiditybridgecontract)
- [liquidityProvider](Flyover.md#liquidityprovider)
- [rskBridge](Flyover.md#rskbridge)

### Methods

- [acceptPegoutQuote](Flyover.md#acceptpegoutquote)
- [acceptQuote](Flyover.md#acceptquote)
- [checkLbc](Flyover.md#checklbc)
- [checkLiquidityProvider](Flyover.md#checkliquidityprovider)
- [connectToRsk](Flyover.md#connecttorsk)
- [depositPegout](Flyover.md#depositpegout)
- [disconnectFromRsk](Flyover.md#disconnectfromrsk)
- [ensureRskBridge](Flyover.md#ensurerskbridge)
- [generateQrCode](Flyover.md#generateqrcode)
- [getAvailableLiquidity](Flyover.md#getavailableliquidity)
- [getLiquidityProviders](Flyover.md#getliquidityproviders)
- [getMetadata](Flyover.md#getmetadata)
- [getPeginStatus](Flyover.md#getpeginstatus)
- [getPegoutQuotes](Flyover.md#getpegoutquotes)
- [getPegoutStatus](Flyover.md#getpegoutstatus)
- [getQuotes](Flyover.md#getquotes)
- [getSelectedLiquidityProvider](Flyover.md#getselectedliquidityprovider)
- [getUserQuotes](Flyover.md#getuserquotes)
- [isConnected](Flyover.md#isconnected)
- [refundPegout](Flyover.md#refundpegout)
- [registerPegin](Flyover.md#registerpegin)
- [setNetwork](Flyover.md#setnetwork)
- [supportsConversion](Flyover.md#supportsconversion)
- [supportsNetwork](Flyover.md#supportsnetwork)
- [useLiquidityProvider](Flyover.md#useliquidityprovider)
- [validatePeginTransaction](Flyover.md#validatepegintransaction)
- [createForNetwork](Flyover.md#createfornetwork)

## Constructors

### constructor

• **new Flyover**(`config`): [`Flyover`](Flyover.md)

Create a Flyover client instance.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `config` | `FlyoverConfig` | Object that holds the connection configuration |

#### Returns

[`Flyover`](Flyover.md)

#### Defined in

[src/sdk/flyover.ts:51](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L51)

## Properties

### config

• `Private` `Readonly` **config**: `FlyoverConfig`

Object that holds the connection configuration

#### Defined in

[src/sdk/flyover.ts:52](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L52)

___

### httpClient

• `Private` `Readonly` **httpClient**: `HttpClient`

#### Defined in

[src/sdk/flyover.ts:42](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L42)

___

### lastPeginQuote

• `Private` **lastPeginQuote**: ``null`` \| [`Quote`](../interfaces/Quote.md)

#### Defined in

[src/sdk/flyover.ts:43](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L43)

___

### lastPegoutQuote

• `Private` **lastPegoutQuote**: ``null`` \| [`PegoutQuote`](../interfaces/PegoutQuote.md)

#### Defined in

[src/sdk/flyover.ts:44](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L44)

___

### liquidityBridgeContract

• `Private` `Optional` **liquidityBridgeContract**: `LiquidityBridgeContract`

#### Defined in

[src/sdk/flyover.ts:40](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L40)

___

### liquidityProvider

• `Private` `Optional` **liquidityProvider**: [`LiquidityProvider`](../modules.md#liquidityprovider)

#### Defined in

[src/sdk/flyover.ts:39](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L39)

___

### rskBridge

• `Private` `Optional` **rskBridge**: `RskBridge`

#### Defined in

[src/sdk/flyover.ts:41](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L41)

## Methods

### acceptPegoutQuote

▸ **acceptPegoutQuote**(`quote`): `Promise`\<[`AcceptedPegoutQuote`](../interfaces/AcceptedPegoutQuote.md)\>

Accept a specific pegout quote

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quote` | [`PegoutQuote`](../interfaces/PegoutQuote.md) | Pegout quote to be accepted |

#### Returns

`Promise`\<[`AcceptedPegoutQuote`](../interfaces/AcceptedPegoutQuote.md)\>

Accepted quote with confirmation data

**`Throws`**

When provider has not been set in the Flyover instance

**`Throws`**

When quote has missing fields

**`Example`**

```ts
flyover.useProvider(provider)
const quotes = await flyover.getPegoutQuotes(quoteRequest)
await flyover.acceptPegoutQuote(quotes[0])
```

#### Defined in

[src/sdk/flyover.ts:177](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L177)

___

### acceptQuote

▸ **acceptQuote**(`quote`): `Promise`\<[`AcceptedQuote`](../interfaces/AcceptedQuote.md)\>

Accept a specific pegin quote

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quote` | [`Quote`](../interfaces/Quote.md) | Quote to be accepted |

#### Returns

`Promise`\<[`AcceptedQuote`](../interfaces/AcceptedQuote.md)\>

Accepted quote with confirmation data

**`Throws`**

When provider has not been set in the Flyover instance

**`Throws`**

When quote has missing fields

**`Example`**

```ts
flyover.useProvider(provider)
const quotes = await flyover.getQuotes(quoteRequest)
await flyover.acceptQuote(quotes[0])
```

#### Defined in

[src/sdk/flyover.ts:124](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L124)

___

### checkLbc

▸ **checkLbc**(): `void`

#### Returns

`void`

#### Defined in

[src/sdk/flyover.ts:323](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L323)

___

### checkLiquidityProvider

▸ **checkLiquidityProvider**(): `void`

#### Returns

`void`

#### Defined in

[src/sdk/flyover.ts:315](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L315)

___

### connectToRsk

▸ **connectToRsk**(`rskConnection`): `Promise`\<`void`\>

Connects Flyover to RSK network. It is useful if connetion wasn't provided on initial configuration

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `rskConnection` | `BlockchainConnection` | object representing connection to the network |

#### Returns

`Promise`\<`void`\>

**`Throws`**

If Flyover already has a connection to the network

#### Defined in

[src/sdk/flyover.ts:250](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L250)

___

### depositPegout

▸ **depositPegout**(`quote`, `signature`, `amount`): `Promise`\<`string`\>

Executes the depositPegout function of Liquidity Bridge Contract. For executing this method is required to have an active
connection to RSK network. It can be provided on initial configuration or using [Flyover.connectToRsk](Flyover.md#connecttorsk)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quote` | [`PegoutQuote`](../interfaces/PegoutQuote.md) | the quote of the pegout that is going to be deposited |
| `signature` | `string` | accepted quote signed by liquidity provider |
| `amount` | `bigint` | the amount to deposit. Should be the sum of the value to pegout plus all the fees |

#### Returns

`Promise`\<`string`\>

string the transaction hash

**`Throws`**

If not connected to RSK

#### Defined in

[src/sdk/flyover.ts:269](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L269)

___

### disconnectFromRsk

▸ **disconnectFromRsk**(): `void`

Disconnects from RSK network, removing BlockchainConnection object from Flyover and also current LiquidityProvider

#### Returns

`void`

#### Defined in

[src/sdk/flyover.ts:309](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L309)

___

### ensureRskBridge

▸ **ensureRskBridge**(): `void`

#### Returns

`void`

#### Defined in

[src/sdk/flyover.ts:331](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L331)

___

### generateQrCode

▸ **generateQrCode**(`address`, `amount`, `blockchain`): `Promise`\<`string`\>

Generate QR code for given address. The supported networks are Bitcoin and RSK

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | Adrress to generate QR code from |
| `amount` | `string` | Amount to use ex. "1.405" |
| `blockchain` | `string` | Blockchain to use for QR code |

#### Returns

`Promise`\<`string`\>

#### Defined in

[src/sdk/flyover.ts:214](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L214)

___

### getAvailableLiquidity

▸ **getAvailableLiquidity**(): `Promise`\<[`AvailableLiquidity`](../interfaces/AvailableLiquidity.md)\>

Returns the available liquidity of the selected provider for both pegin and pegout operations.
This feature might be disabled by the provider for privacy reasons

#### Returns

`Promise`\<[`AvailableLiquidity`](../interfaces/AvailableLiquidity.md)\>

**`Throws`**

If the feature was disabled by the provider

#### Defined in

[src/sdk/flyover.ts:425](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L425)

___

### getLiquidityProviders

▸ **getLiquidityProviders**(): `Promise`\<[`LiquidityProvider`](../modules.md#liquidityprovider)[]\>

Get list of liquidity providers that can be set to the client. For executing this method
is required to have an active connection to RSK network. It can be provided on initial
configuration or using [Flyover.connectToRsk](Flyover.md#connecttorsk)

#### Returns

`Promise`\<[`LiquidityProvider`](../modules.md#liquidityprovider)[]\>

Providers list

#### Defined in

[src/sdk/flyover.ts:76](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L76)

___

### getMetadata

▸ **getMetadata**(): `Promise`\<`BridgeMetadata`[]\>

#### Returns

`Promise`\<`BridgeMetadata`[]\>

#### Implementation of

Bridge.getMetadata

#### Defined in

[src/sdk/flyover.ts:358](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L358)

___

### getPeginStatus

▸ **getPeginStatus**(`quoteHash`): `Promise`\<[`PeginQuoteStatus`](../interfaces/PeginQuoteStatus.md)\>

Returns the information of an accepted pegin quote. This involves the details of the quote
and information about its current status in the sever such as the state and the involved
transactions hashes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quoteHash` | `string` | the has of the quote |

#### Returns

`Promise`\<[`PeginQuoteStatus`](../interfaces/PeginQuoteStatus.md)\>

**`Remarks`**

If you want to have a simplified version of the state of the quote to display as a status in
a client UI, you can use the getSimpleQuoteStatus function

**`Throws`**

If quote wasn't accepted or doesn't exist

#### Defined in

[src/sdk/flyover.ts:390](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L390)

___

### getPegoutQuotes

▸ **getPegoutQuotes**(`quoteRequest`): `Promise`\<[`PegoutQuote`](../interfaces/PegoutQuote.md)[]\>

Get available pegout quotes for given parameters

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quoteRequest` | [`PegoutQuoteRequest`](../interfaces/PegoutQuoteRequest.md) | Quote request to compute available quotes |

#### Returns

`Promise`\<[`PegoutQuote`](../interfaces/PegoutQuote.md)[]\>

List of available quotes

**`Throws`**

When provider has not been set in the Flyover instance

**`Throws`**

When quoteRequest has missing fields

**`Example`**

```ts
flyover.useProvider(provider)
await flyover.getPegoutQuotes(quoteRequest)
```

#### Defined in

[src/sdk/flyover.ts:147](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L147)

___

### getPegoutStatus

▸ **getPegoutStatus**(`quoteHash`): `Promise`\<[`PegoutQuoteStatus`](../interfaces/PegoutQuoteStatus.md)\>

Returns the information of an accepted pegout quote. This involves the details of the quote
and information about its current status in the sever such as the state and the involved
transactions hashes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quoteHash` | `string` | the has of the quote |

#### Returns

`Promise`\<[`PegoutQuoteStatus`](../interfaces/PegoutQuoteStatus.md)\>

**`Remarks`**

If you want to have a simplified version of the state of the quote to display as a status in
a client UI, you can use the getSimpleQuoteStatus function

**`Throws`**

If quote wasn't accepted or doesn't exist

#### Defined in

[src/sdk/flyover.ts:411](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L411)

___

### getQuotes

▸ **getQuotes**(`quoteRequest`): `Promise`\<[`Quote`](../interfaces/Quote.md)[]\>

Get available quotes for given parameters

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quoteRequest` | [`PeginQuoteRequest`](../interfaces/PeginQuoteRequest.md) | Quote request to compute available quotes |

#### Returns

`Promise`\<[`Quote`](../interfaces/Quote.md)[]\>

List of available quotes

**`Throws`**

When provider has not been set in the Flyover instance

**`Throws`**

When quoteRequest has missing fields

**`Example`**

```ts
flyover.useProvider(provider)
await flyover.getQuotes(quoteRequest)
```

#### Defined in

[src/sdk/flyover.ts:98](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L98)

___

### getSelectedLiquidityProvider

▸ **getSelectedLiquidityProvider**(): `undefined` \| [`LiquidityProvider`](../modules.md#liquidityprovider)

#### Returns

`undefined` \| [`LiquidityProvider`](../modules.md#liquidityprovider)

#### Defined in

[src/sdk/flyover.ts:371](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L371)

___

### getUserQuotes

▸ **getUserQuotes**(`address`): `Promise`\<[`DepositEvent`](../interfaces/DepositEvent.md)[]\>

Returns array of all users quotes with deposits. Requires a provider to be selected, and user address as parameter

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | user RSK address |

#### Returns

`Promise`\<[`DepositEvent`](../interfaces/DepositEvent.md)[]\>

**`Throws`**

If not connected to RSK

#### Defined in

[src/sdk/flyover.ts:348](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L348)

___

### isConnected

▸ **isConnected**(): `Promise`\<`boolean`\>

Checks if Flyover object has an active connection with the RSK network

#### Returns

`Promise`\<`boolean`\>

boolean

#### Defined in

[src/sdk/flyover.ts:239](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L239)

___

### refundPegout

▸ **refundPegout**(`quote`): `Promise`\<`string`\>

Executes the refundUserPegout function of Liquidity Bridge Contract. For executing this method is required to have an active
connection to RSK network. It can be provided on initial configuration or using [Flyover.connectToRsk](Flyover.md#connecttorsk)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `quote` | [`PegoutQuote`](../interfaces/PegoutQuote.md) | the quote of the pegout that is being refunded |

#### Returns

`Promise`\<`string`\>

string the transaction hash

**`Throws`**

If not connected to RSK

#### Defined in

[src/sdk/flyover.ts:285](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L285)

___

### registerPegin

▸ **registerPegin**(`params`): `Promise`\<`string`\>

Registers a peg-in transaction with the bridge and pays to the involved parties

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | [`RegisterPeginParams`](../interfaces/RegisterPeginParams.md) | Object with all parameters required by the contract |

#### Returns

`Promise`\<`string`\>

string the transaction hash

**`Throws`**

If not connected to RSK

**`Throws`**

If there was an error during transaction execution

#### Defined in

[src/sdk/flyover.ts:300](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L300)

___

### setNetwork

▸ **setNetwork**(`network`): `void`

Change client network after instantiating it. Useful if plan to switch networks between operations

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `network` | `Network` | New network to use |

#### Returns

`void`

#### Defined in

[src/sdk/flyover.ts:199](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L199)

___

### supportsConversion

▸ **supportsConversion**(`fromToken`, `toToken`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fromToken` | `string` |
| `toToken` | `string` |

#### Returns

`boolean`

#### Implementation of

Bridge.supportsConversion

#### Defined in

[src/sdk/flyover.ts:354](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L354)

___

### supportsNetwork

▸ **supportsNetwork**(`chainId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `chainId` | `number` |

#### Returns

`boolean`

#### Implementation of

Bridge.supportsNetwork

#### Defined in

[src/sdk/flyover.ts:367](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L367)

___

### useLiquidityProvider

▸ **useLiquidityProvider**(`provider`): `void`

Set provider whose LPS will be used to get/accept quotes

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `provider` | [`LiquidityProvider`](../modules.md#liquidityprovider) | Provider to use its apiBaseUrl |

#### Returns

`void`

#### Defined in

[src/sdk/flyover.ts:188](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L188)

___

### validatePeginTransaction

▸ **validatePeginTransaction**(`params`, `options?`): `Promise`\<`string`\>

Checks if a Bitcoin transaction is valid for a specific PegIn. This check involves the following conditions:
- The transaction is a well formed Bitcoin transaction
- The transaction sends the expected amount of satoshis to the correct address according to the quote
- The address in the transaction is the specific address derived for that quote
- All the UTXOs sent to the derivation address are above the RSK Bridge minimum
- (Optional) The validation is being done before the quote expiration

This function can be used either before or after of funding and signing the transaction.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `params` | [`ValidatePeginTransactionParams`](../interfaces/ValidatePeginTransactionParams.md) | The parameters required for the validation |
| `options?` | [`ValidatePeginTransactionOptions`](../interfaces/ValidatePeginTransactionOptions.md) | The options for the validation |

#### Returns

`Promise`\<`string`\>

The error message if the validation fails and options.throwError is false

**`Throws`**

If options.throwError is true and the validation fails

#### Defined in

[src/sdk/flyover.ts:448](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L448)

___

### createForNetwork

▸ **createForNetwork**(`network`, `captchaResolver`, `provider?`): [`Flyover`](Flyover.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `network` | `Network` |
| `captchaResolver` | `CaptchaTokenResolver` |
| `provider?` | [`LiquidityProvider`](../modules.md#liquidityprovider) |

#### Returns

[`Flyover`](Flyover.md)

#### Defined in

[src/sdk/flyover.ts:61](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/flyover.ts#L61)
