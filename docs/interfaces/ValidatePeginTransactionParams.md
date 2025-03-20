[@rsksmart/flyover-sdk](../README.md) / [Exports](../modules.md) / ValidatePeginTransactionParams

# Interface: ValidatePeginTransactionParams

Interface that holds the parameters for a PegIn deposit validation

## Table of contents

### Properties

- [acceptInfo](ValidatePeginTransactionParams.md#acceptinfo)
- [btcTx](ValidatePeginTransactionParams.md#btctx)
- [quoteInfo](ValidatePeginTransactionParams.md#quoteinfo)

## Properties

### acceptInfo

• **acceptInfo**: [`AcceptedQuote`](AcceptedQuote.md)

The signature and derivation address for the PegIn quote

#### Defined in

[src/sdk/validatePeginTransaction.ts:15](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/sdk/validatePeginTransaction.ts#L15)

___

### btcTx

• **btcTx**: `string`

The serialized Bitcoin transaction to validate

#### Defined in

[src/sdk/validatePeginTransaction.ts:17](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/sdk/validatePeginTransaction.ts#L17)

___

### quoteInfo

• **quoteInfo**: [`Quote`](Quote.md)

The detail of the quote of the PegIn

#### Defined in

[src/sdk/validatePeginTransaction.ts:13](https://github.com/rsksmart/flyover-sdk/blob/c4e062545df2cd84086a652b1972659c273d682e/src/sdk/validatePeginTransaction.ts#L13)
