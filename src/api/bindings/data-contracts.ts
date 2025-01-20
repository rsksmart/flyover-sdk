/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export type Type = any;

export interface AcceptPeginRespose {
  /**
   * Hash of the deposit BTC address
   * @example "0x0"
   */
  bitcoinDepositAddressHash: string;
  /**
   * Signature of the quote
   * @example "0x0"
   */
  signature: string;
}

export const AcceptPeginResposeRequiredFields: string[] = ["signature", "bitcoinDepositAddressHash"];

export interface AcceptPegoutResponse {
  /**
   * LBC address to execute depositPegout function
   * @example "0x0"
   */
  lbcAddress: string;
  /**
   * Signature of the quote
   * @example "0x0"
   */
  signature: string;
}

export const AcceptPegoutResponseRequiredFields: string[] = ["signature", "lbcAddress"];

export interface AcceptQuoteRequest {
  /**
   * QuoteHash
   * @example "0x0"
   */
  quoteHash: string;
}

export const AcceptQuoteRequestRequiredFields: string[] = ["quoteHash"];

export interface AddCollateralRequest {
  /**
   * Amount to add to the collateral
   * @example 100000000000
   */
  amount: bigint;
}

export const AddCollateralRequestRequiredFields: string[] = ["amount"];

export interface AddCollateralResponse {
  /**
   * New Collateral Balance
   * @example 100000000000
   */
  newCollateralBalance?: number;
}

export interface AvailableLiquidityDTO {
  /**
   * Available liquidity for PegIn operations in wei
   * @example "5000000000000000000"
   */
  peginLiquidityAmount: bigint;
  /**
   * Available liquidity for PegOut operations in satoshi
   * @example "500000000"
   */
  pegoutLiquidityAmount: bigint;
}

export const AvailableLiquidityDtoRequiredFields: string[] = ["peginLiquidityAmount", "pegoutLiquidityAmount"];

export interface ChangeStatusRequest {
  status?: boolean;
}

export interface ConfirmationsPerAmount {
  key?: number;
}

export interface DepositEventDTO {
  /**
   * Event Value
   * @example "10000"
   */
  amount?: bigint;
  /**
   * From Address
   * @example "0x0"
   */
  from?: string;
  /**
   * QuoteHash
   * @example "0x0"
   */
  quoteHash?: string;
  /**
   * Event Timestamp
   * @format date-time
   * @example "10000"
   */
  timestamp?: string;
}

export interface GeneralConfiguration {
  btcConfirmations?: bigint;
  publicLiquidityCheck?: boolean;
  rskConfirmations?: bigint;
}

export interface GeneralConfigurationRequest {
  configuration?: GeneralConfiguration;
}

export interface GetCollateralResponse {
  collateral: number;
}

export const GetCollateralResponseRequiredFields: string[] = ["collateral"];

export interface GetPeginQuoteResponse {
  /** Detail of the quote */
  quote: PeginQuoteDTO;
  /** This is a 64 digit number that derives from a quote object */
  quoteHash: string;
}

export const GetPeginQuoteResponseRequiredFields: string[] = ["quote", "quoteHash"];

export interface GetPegoutQuoteResponse {
  /** Detail of the quote */
  quote: PegoutQuoteDTO;
  /** This is a 64 digit number that derives from a quote object */
  quoteHash: string;
}

export const GetPegoutQuoteResponseRequiredFields: string[] = ["quote", "quoteHash"];

export interface HealthResponse {
  /**
   * LPS Services Status
   * @example {"btc":"ok","db":"ok","rsk":"ok"}
   */
  services: object;
  /**
   * Overall LPS Health Status
   * @example "ok"
   */
  status: string;
}

export const HealthResponseRequiredFields: string[] = ["status", "services"];

export interface LiquidityProvider {
  /**
   * API base URL
   * @example "https://api.example.com"
   */
  apiBaseUrl: string;
  /**
   * Provider Id
   * @example 1
   */
  id: number;
  /**
   * Provider Name
   * @example "New Provider"
   */
  name: string;
  /**
   * Provider Address
   * @example "0x0"
   */
  provider: string;
  /**
   * Provider type
   * @example "pegin"
   */
  providerType: string;
  /**
   * Provider status
   * @example true
   */
  status: boolean;
}

export const LiquidityProviderRequiredFields: string[] = [
  "id",
  "provider",
  "name",
  "apiBaseUrl",
  "status",
  "providerType",
];

export interface PeginConfigurationDTO {
  callFee?: bigint;
  callTime?: number;
  maxValue?: bigint;
  minValue?: bigint;
  penaltyFee?: bigint;
  timeForDeposit?: number;
}

export interface PeginConfigurationRequest {
  configuration?: PeginConfigurationDTO;
}

export interface PeginQuoteDTO {
  /** The timestamp of the agreement */
  agreementTimestamp: number;
  /** A User BTC refund address */
  btcRefundAddr: string;
  /** The fee charged by the LP */
  callFee: bigint;
  /** A boolean value indicating whether the callForUser can be called on registerPegIn */
  callOnRegister: boolean;
  /** The number of confirmations that the LP requires before making the call */
  confirmations: number;
  /** The destination address of the peg-in */
  contractAddr: string;
  /** The arguments to send in the call */
  data: string;
  /** The BTC address of the PowPeg */
  fedBTCAddr: string;
  /** Fee to pay for the gas of every call done during the pegin (call on behalf of the user and call to the dao fee collector) */
  gasFee: bigint;
  /** The gas limit */
  gasLimit: number;
  /** The address of the LBC */
  lbcAddr: string;
  /** The BTC address of the LP */
  lpBTCAddr: string;
  /** The time (in seconds) that the LP has to perform the call on behalf of the user after the deposit achieves the number of confirmations */
  lpCallTime: number;
  /** The RSK address of the LP */
  lpRSKAddr: string;
  /** A nonce that uniquely identifies this quote */
  nonce: bigint;
  /** The penalty fee that the LP pays if it fails to deliver the service */
  penaltyFee: bigint;
  /** The DAO Fee amount */
  productFeeAmount: bigint;
  /** A User RSK refund address */
  rskRefundAddr: string;
  /** The time (in seconds) that the user has to achieve one confirmation on the BTC deposit */
  timeForDeposit: number;
  /** The value to transfer in the call */
  value: bigint;
}

export const PeginQuoteDtoRequiredFields: string[] = [
  "fedBTCAddr",
  "lbcAddr",
  "lpRSKAddr",
  "btcRefundAddr",
  "rskRefundAddr",
  "lpBTCAddr",
  "callFee",
  "penaltyFee",
  "contractAddr",
  "data",
  "gasLimit",
  "nonce",
  "value",
  "agreementTimestamp",
  "timeForDeposit",
  "lpCallTime",
  "confirmations",
  "callOnRegister",
  "gasFee",
  "productFeeAmount",
];

export interface PeginQuoteRequest {
  /**
   * Contract data
   * @example "0x0"
   */
  callContractArguments: string;
  /**
   * Contract address or EOA address
   * @example "0x0"
   */
  callEoaOrContractAddress: string;
  /**
   * User RSK refund address
   * @example "0x0"
   */
  rskRefundAddress: string;
  /**
   * Value to send in the call
   * @example 0
   */
  valueToTransfer: bigint;
}

export const PeginQuoteRequestRequiredFields: string[] = [
  "callEoaOrContractAddress",
  "callContractArguments",
  "valueToTransfer",
  "rskRefundAddress",
];

export interface PeginQuoteStatusDTO {
  /** Agreed specification of the quote */
  detail: PeginQuoteDTO;
  /** Current status of the quote */
  status: RetainedPeginQuoteDTO;
}

export const PeginQuoteStatusDtoRequiredFields: string[] = ["detail", "status"];

export interface PegoutConfigurationDTO {
  bridgeTransactionMin?: string;
  callFee?: bigint;
  expireBlocks?: number;
  expireTime?: number;
  maxValue?: bigint;
  minValue?: bigint;
  penaltyFee?: bigint;
  timeForDeposit?: number;
}

export interface PegoutConfigurationRequest {
  configuration?: PegoutConfigurationDTO;
}

export interface PegoutQuoteDTO {
  agreementTimestamp: number;
  btcRefundAddress: string;
  callFee: bigint;
  depositAddr: string;
  depositConfirmations: number;
  depositDateLimit: number;
  expireBlocks: number;
  expireDate: number;
  /** Fee to pay for the gas of every call done during the pegout (call on behalf of the user in Bitcoin network and call to the dao fee collector in Rootstock) */
  gasFee: bigint;
  lbcAddress: string;
  liquidityProviderRskAddress: string;
  lpBtcAddr: string;
  nonce: bigint;
  penaltyFee: bigint;
  /** The DAO fee amount */
  productFeeAmount: bigint;
  rskRefundAddress: string;
  transferConfirmations: number;
  transferTime: number;
  value: bigint;
}

export const PegoutQuoteDtoRequiredFields: string[] = [
  "lbcAddress",
  "liquidityProviderRskAddress",
  "btcRefundAddress",
  "rskRefundAddress",
  "lpBtcAddr",
  "callFee",
  "penaltyFee",
  "nonce",
  "depositAddr",
  "value",
  "agreementTimestamp",
  "depositDateLimit",
  "depositConfirmations",
  "transferConfirmations",
  "transferTime",
  "expireDate",
  "expireBlocks",
  "gasFee",
  "productFeeAmount",
];

export interface PegoutQuoteRequest {
  /**
   * RskRefundAddress
   * @example "0x0"
   */
  rskRefundAddress: string;
  /** Bitcoin address that will receive the BTC amount */
  to: string;
  /**
   * ValueToTransfer
   * @example 10000000000000
   */
  valueToTransfer: bigint;
}

export const PegoutQuoteRequestRequiredFields: string[] = ["to", "valueToTransfer", "rskRefundAddress"];

export interface PegoutQuoteStatusDTO {
  /** Agreed specification of the quote */
  detail: PegoutQuoteDTO;
  /** Current status of the quote */
  status: RetainedPegoutQuoteDTO;
}

export const PegoutQuoteStatusDtoRequiredFields: string[] = ["detail", "status"];

export interface ProviderDetail {
  fee: bigint;
  maxTransactionValue: bigint;
  minTransactionValue: bigint;
  requiredConfirmations: number;
}

export const ProviderDetailRequiredFields: string[] = [
  "fee",
  "minTransactionValue",
  "maxTransactionValue",
  "requiredConfirmations",
];

export interface ProviderDetailResponse {
  liquidityCheckEnabled: boolean;
  pegin: ProviderDetail;
  pegout: ProviderDetail;
  siteKey: string;
}

export const ProviderDetailResponseRequiredFields: string[] = ["siteKey", "liquidityCheckEnabled", "pegin", "pegout"];

export interface RetainedPeginQuoteDTO {
  /** The hash of the RSK transaction to the address requested by the user */
  callForUserTxHash: string;
  /** BTC derivation address where the user should send the BTC */
  depositAddress: string;
  /** 32-byte long hash of the quote that acts as a unique identifier */
  quoteHash: string;
  /** The hash of the RSK transaction where the LP gets his refund and fee */
  registerPeginTxHash: string;
  /** RBTC liquidity that the LP locks to guarantee the service. It is different from the total amount that the user needs to pay. */
  requiredLiquidity: Type;
  /** Signature of the liquidity provider expressing commitment on the quote */
  signature: string;
  /**
   * Current state of the quote. Possible values are:
   *  - WaitingForDeposit
   *  - WaitingForDepositConfirmations
   *  - TimeForDepositElapsed
   *  - CallForUserSucceeded
   *  - CallForUserFailed
   *  - RegisterPegInSucceeded
   *  - RegisterPegInFailed
   */
  state: string;
  /** The hash of the user's BTC transaction to the derivation address */
  userBtcTxHash: string;
}

export const RetainedPeginQuoteDtoRequiredFields: string[] = [
  "quoteHash",
  "signature",
  "depositAddress",
  "requiredLiquidity",
  "state",
  "userBtcTxHash",
  "callForUserTxHash",
  "registerPeginTxHash",
];

export interface RetainedPegoutQuoteDTO {
  /** The hash of the transaction from the LP to the bridge to convert the refunded RBTC into BTC */
  bridgeRefundTxHash: string;
  /** Address of the smart contract where the user should execute depositPegout function */
  depositAddress: string;
  /** The hash of the BTC transaction from the LP to the user */
  lpBtcTxHash: string;
  /** 32-byte long hash of the quote that acts as a unique identifier */
  quoteHash: string;
  /** The hash of the transaction from the LP to the LBC where the LP got the refund in RBTC */
  refundPegoutTxHash: string;
  /** BTC liquidity that the LP locks to guarantee the service. It is different from the total amount that the user needs to pay. */
  requiredLiquidity: Type;
  /** Signature of the liquidity provider expressing commitment on the quote */
  signature: string;
  /**
   * Current state of the quote. Possible values are:
   *  - WaitingForDeposit
   *  - WaitingForDepositConfirmations
   *  - TimeForDepositElapsed
   *  - SendPegoutSucceeded
   *  - SendPegoutFailed
   *  - RefundPegOutSucceeded
   *  - RefundPegOutFailed
   *  - BridgeTxSucceeded
   *  - BridgeTxFailed
   */
  state: string;
  /** The hash of the depositPegout transaction made by the user */
  userRskTxHash: string;
}

export const RetainedPegoutQuoteDtoRequiredFields: string[] = [
  "quoteHash",
  "signature",
  "depositAddress",
  "requiredLiquidity",
  "state",
  "userRskTxHash",
  "lpBtcTxHash",
  "refundPegoutTxHash",
  "bridgeRefundTxHash",
];

export interface Services {
  btc?: string;
  db?: string;
  rsk?: string;
}

export interface PkgAcceptQuoteRequest {
  /**
   * QuoteHash
   * @example "0x0"
   */
  quoteHash: string;
}

export const PkgAcceptQuoteRequestRequiredFields: string[] = ["quoteHash"];

export interface PkgAddCollateralRequest {
  /**
   * Amount to add to the collateral
   * @example 100000000000
   */
  amount: bigint;
}

export const PkgAddCollateralRequestRequiredFields: string[] = ["amount"];

export interface PkgAddCollateralResponse {
  /**
   * New Collateral Balance
   * @example 100000000000
   */
  newCollateralBalance?: number;
}

export interface PkgGetCollateralResponse {
  collateral: number;
}

export const PkgGetCollateralResponseRequiredFields: string[] = ["collateral"];
