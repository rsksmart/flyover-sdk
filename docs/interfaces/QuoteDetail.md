[@rsksmart/flyover-sdk](../README.md) / [Exports](../modules.md) / QuoteDetail

# Interface: QuoteDetail

## Table of contents

### Properties

- [agreementTimestamp](QuoteDetail.md#agreementtimestamp)
- [btcRefundAddr](QuoteDetail.md#btcrefundaddr)
- [callFee](QuoteDetail.md#callfee)
- [callOnRegister](QuoteDetail.md#callonregister)
- [confirmations](QuoteDetail.md#confirmations)
- [contractAddr](QuoteDetail.md#contractaddr)
- [data](QuoteDetail.md#data)
- [fedBTCAddr](QuoteDetail.md#fedbtcaddr)
- [gasFee](QuoteDetail.md#gasfee)
- [gasLimit](QuoteDetail.md#gaslimit)
- [lbcAddr](QuoteDetail.md#lbcaddr)
- [lpBTCAddr](QuoteDetail.md#lpbtcaddr)
- [lpCallTime](QuoteDetail.md#lpcalltime)
- [lpRSKAddr](QuoteDetail.md#lprskaddr)
- [nonce](QuoteDetail.md#nonce)
- [penaltyFee](QuoteDetail.md#penaltyfee)
- [productFeeAmount](QuoteDetail.md#productfeeamount)
- [rskRefundAddr](QuoteDetail.md#rskrefundaddr)
- [timeForDeposit](QuoteDetail.md#timefordeposit)
- [value](QuoteDetail.md#value)

## Properties

### agreementTimestamp

• **agreementTimestamp**: `number`

The timestamp of the agreement

#### Defined in

[src/api/bindings/data-contracts.ts:225](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L225)

___

### btcRefundAddr

• **btcRefundAddr**: `string`

A User BTC refund address

#### Defined in

[src/api/bindings/data-contracts.ts:227](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L227)

___

### callFee

• **callFee**: `bigint`

The fee charged by the LP

#### Defined in

[src/api/bindings/data-contracts.ts:229](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L229)

___

### callOnRegister

• **callOnRegister**: `boolean`

A boolean value indicating whether the callForUser can be called on registerPegIn

#### Defined in

[src/api/bindings/data-contracts.ts:231](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L231)

___

### confirmations

• **confirmations**: `number`

The number of confirmations that the LP requires before making the call

#### Defined in

[src/api/bindings/data-contracts.ts:233](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L233)

___

### contractAddr

• **contractAddr**: `string`

The destination address of the peg-in

#### Defined in

[src/api/bindings/data-contracts.ts:235](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L235)

___

### data

• **data**: `string`

The arguments to send in the call

#### Defined in

[src/api/bindings/data-contracts.ts:237](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L237)

___

### fedBTCAddr

• **fedBTCAddr**: `string`

The BTC address of the PowPeg

#### Defined in

[src/api/bindings/data-contracts.ts:239](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L239)

___

### gasFee

• **gasFee**: `bigint`

Fee to pay for the gas of every call done during the pegin (call on behalf of the user and call to the dao fee collector)

#### Defined in

[src/api/bindings/data-contracts.ts:241](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L241)

___

### gasLimit

• **gasLimit**: `number`

The gas limit

#### Defined in

[src/api/bindings/data-contracts.ts:243](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L243)

___

### lbcAddr

• **lbcAddr**: `string`

The address of the LBC

#### Defined in

[src/api/bindings/data-contracts.ts:245](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L245)

___

### lpBTCAddr

• **lpBTCAddr**: `string`

The BTC address of the LP

#### Defined in

[src/api/bindings/data-contracts.ts:247](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L247)

___

### lpCallTime

• **lpCallTime**: `number`

The time (in seconds) that the LP has to perform the call on behalf of the user after the deposit achieves the number of confirmations

#### Defined in

[src/api/bindings/data-contracts.ts:249](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L249)

___

### lpRSKAddr

• **lpRSKAddr**: `string`

The RSK address of the LP

#### Defined in

[src/api/bindings/data-contracts.ts:251](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L251)

___

### nonce

• **nonce**: `bigint`

A nonce that uniquely identifies this quote

#### Defined in

[src/api/bindings/data-contracts.ts:253](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L253)

___

### penaltyFee

• **penaltyFee**: `bigint`

The penalty fee that the LP pays if it fails to deliver the service

#### Defined in

[src/api/bindings/data-contracts.ts:255](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L255)

___

### productFeeAmount

• **productFeeAmount**: `bigint`

The DAO Fee amount

#### Defined in

[src/api/bindings/data-contracts.ts:257](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L257)

___

### rskRefundAddr

• **rskRefundAddr**: `string`

A User RSK refund address

#### Defined in

[src/api/bindings/data-contracts.ts:259](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L259)

___

### timeForDeposit

• **timeForDeposit**: `number`

The time (in seconds) that the user has to achieve one confirmation on the BTC deposit

#### Defined in

[src/api/bindings/data-contracts.ts:261](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L261)

___

### value

• **value**: `bigint`

The value to transfer in the call

#### Defined in

[src/api/bindings/data-contracts.ts:263](https://github.com/rsksmart/flyover-sdk/blob/18dbf4f19eeffd80a65cc3f468bbc1f72a91f197/src/api/bindings/data-contracts.ts#L263)
