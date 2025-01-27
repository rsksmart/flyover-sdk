[@rsksmart/flyover-sdk](../README.md) / [Exports](../modules.md) / RegisterPeginParams

# Interface: RegisterPeginParams

Interface to encapsulate parameters required by the registerPegIn function of the Liquidity Bridge Contract

## Table of contents

### Properties

- [btcRawTransaction](RegisterPeginParams.md#btcrawtransaction)
- [height](RegisterPeginParams.md#height)
- [partialMerkleTree](RegisterPeginParams.md#partialmerkletree)
- [quote](RegisterPeginParams.md#quote)
- [signature](RegisterPeginParams.md#signature)

## Properties

### btcRawTransaction

• **btcRawTransaction**: `string`

The peg-in transaction

#### Defined in

[src/sdk/registerPegin.ts:12](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/registerPegin.ts#L12)

___

### height

• **height**: `number`

The block that contains the peg-in transaction

#### Defined in

[src/sdk/registerPegin.ts:16](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/registerPegin.ts#L16)

___

### partialMerkleTree

• **partialMerkleTree**: `string`

The merkle tree path that proves transaction inclusion

#### Defined in

[src/sdk/registerPegin.ts:14](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/registerPegin.ts#L14)

___

### quote

• **quote**: [`Quote`](Quote.md)

The quote of the service

#### Defined in

[src/sdk/registerPegin.ts:8](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/registerPegin.ts#L8)

___

### signature

• **signature**: `string`

The signature of the quote

#### Defined in

[src/sdk/registerPegin.ts:10](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/sdk/registerPegin.ts#L10)
