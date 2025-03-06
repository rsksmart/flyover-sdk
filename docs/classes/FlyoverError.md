[@rsksmart/flyover-sdk](../README.md) / [Exports](../modules.md) / FlyoverError

# Class: FlyoverError

## Hierarchy

- `BridgeError`

  ↳ **`FlyoverError`**

## Table of contents

### Constructors

- [constructor](FlyoverError.md#constructor)

### Properties

- [details](FlyoverError.md#details)
- [message](FlyoverError.md#message)
- [name](FlyoverError.md#name)
- [product](FlyoverError.md#product)
- [recoverable](FlyoverError.md#recoverable)
- [serverUrl](FlyoverError.md#serverurl)
- [stack](FlyoverError.md#stack)
- [timestamp](FlyoverError.md#timestamp)
- [prepareStackTrace](FlyoverError.md#preparestacktrace)
- [stackTraceLimit](FlyoverError.md#stacktracelimit)

### Methods

- [captureStackTrace](FlyoverError.md#capturestacktrace)
- [checksumError](FlyoverError.md#checksumerror)
- [invalidQuoteHashError](FlyoverError.md#invalidquotehasherror)
- [invalidRskAddress](FlyoverError.md#invalidrskaddress)
- [invalidSignatureError](FlyoverError.md#invalidsignatureerror)
- [manipulatedQuoteResonseError](FlyoverError.md#manipulatedquoteresonseerror)
- [unsupportedBtcAddressError](FlyoverError.md#unsupportedbtcaddresserror)
- [untrustedBtcAddressError](FlyoverError.md#untrustedbtcaddresserror)
- [withReason](FlyoverError.md#withreason)
- [wrongNetworkError](FlyoverError.md#wrongnetworkerror)

## Constructors

### constructor

• **new FlyoverError**(`args`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `ErrorDetails` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Inherited from

BridgeError.constructor

#### Defined in

node_modules/@rsksmart/bridges-core-sdk/lib/index.d.ts:206

## Properties

### details

• **details**: `any`

#### Inherited from

BridgeError.details

#### Defined in

node_modules/@rsksmart/bridges-core-sdk/lib/index.d.ts:203

___

### message

• **message**: `string`

#### Inherited from

BridgeError.message

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1054

___

### name

• **name**: `string`

#### Inherited from

BridgeError.name

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1053

___

### product

• `Optional` **product**: `string`

#### Inherited from

BridgeError.product

#### Defined in

node_modules/@rsksmart/bridges-core-sdk/lib/index.d.ts:205

___

### recoverable

• **recoverable**: `boolean`

#### Inherited from

BridgeError.recoverable

#### Defined in

node_modules/@rsksmart/bridges-core-sdk/lib/index.d.ts:202

___

### serverUrl

• `Optional` **serverUrl**: `string`

#### Inherited from

BridgeError.serverUrl

#### Defined in

node_modules/@rsksmart/bridges-core-sdk/lib/index.d.ts:204

___

### stack

• `Optional` **stack**: `string`

#### Inherited from

BridgeError.stack

#### Defined in

node_modules/typescript/lib/lib.es5.d.ts:1055

___

### timestamp

• **timestamp**: `number`

#### Inherited from

BridgeError.timestamp

#### Defined in

node_modules/@rsksmart/bridges-core-sdk/lib/index.d.ts:201

___

### prepareStackTrace

▪ `Static` `Optional` **prepareStackTrace**: (`err`: `Error`, `stackTraces`: `CallSite`[]) => `any`

Optional override for formatting stack traces

**`See`**

https://v8.dev/docs/stack-trace-api#customizing-stack-traces

#### Type declaration

▸ (`err`, `stackTraces`): `any`

##### Parameters

| Name | Type |
| :------ | :------ |
| `err` | `Error` |
| `stackTraces` | `CallSite`[] |

##### Returns

`any`

#### Inherited from

BridgeError.prepareStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:143

___

### stackTraceLimit

▪ `Static` **stackTraceLimit**: `number`

#### Inherited from

BridgeError.stackTraceLimit

#### Defined in

node_modules/@types/node/globals.d.ts:145

## Methods

### captureStackTrace

▸ **captureStackTrace**(`targetObject`, `constructorOpt?`): `void`

Create .stack property on a target object

#### Parameters

| Name | Type |
| :------ | :------ |
| `targetObject` | `object` |
| `constructorOpt?` | `Function` |

#### Returns

`void`

#### Inherited from

BridgeError.captureStackTrace

#### Defined in

node_modules/@types/node/globals.d.ts:136

___

### checksumError

▸ **checksumError**(`addresses`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `addresses` | `string`[] |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:83](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L83)

___

### invalidQuoteHashError

▸ **invalidQuoteHashError**(`serverUrl`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `serverUrl` | `string` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:13](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L13)

___

### invalidRskAddress

▸ **invalidRskAddress**(`address`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:74](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L74)

___

### invalidSignatureError

▸ **invalidSignatureError**(`args`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.address` | `string` |
| `args.serverUrl` | `string` |
| `args.sinature` | `string` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:34](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L34)

___

### manipulatedQuoteResonseError

▸ **manipulatedQuoteResonseError**(`serverUrl`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `serverUrl` | `string` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:23](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L23)

___

### unsupportedBtcAddressError

▸ **unsupportedBtcAddressError**(`address`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:56](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L56)

___

### untrustedBtcAddressError

▸ **untrustedBtcAddressError**(`args`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `args` | `Object` |
| `args.address` | `string` |
| `args.serverUrl` | `string` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:45](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L45)

___

### withReason

▸ **withReason**(`message`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `message` | `string` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:4](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L4)

___

### wrongNetworkError

▸ **wrongNetworkError**(`mainnet`): [`FlyoverError`](FlyoverError.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `mainnet` | `boolean` |

#### Returns

[`FlyoverError`](FlyoverError.md)

#### Defined in

[src/client/httpClient.ts:65](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/client/httpClient.ts#L65)
