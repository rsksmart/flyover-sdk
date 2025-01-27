import { type FlyoverConfig, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type Quote, type AcceptedQuote } from '../api'
import { Transaction, networks, address } from 'bitcoinjs-lib'
import { quoteDetailRequiredFields, quoteRequiredFields, acceptQuoteRequiredFields } from '../api'
import { FlyoverUtils } from './flyoverUtils'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { satsToWei } from '../utils/quote'

/** Interface that holds the parameters for a PegIn deposit validation */
export interface ValidatePeginTransactionParams {
  /** The detail of the quote of the PegIn */
  quoteInfo: Quote
  /** The signature and derivation address for the PegIn quote */
  acceptInfo: AcceptedQuote
  /** The serialized Bitcoin transaction to validate */
  btcTx: string
}

/** Options for the validation over a specific PegIn deposit transaction */
export interface ValidatePeginTransactionOptions {
  /** Wether the {@link Flyover.validatePeginTransaction} method should throw an error or just return the error message */
  throwError: boolean
}

export async function validatePeginTransaction (
  context: FlyoverSDKContext,
  params: ValidatePeginTransactionParams,
  options: ValidatePeginTransactionOptions = { throwError: true }
): Promise<string> {
  validateRequiredFields(params, 'quoteInfo', 'acceptInfo', 'btcTx')
  validateRequiredFields(params.quoteInfo, ...quoteRequiredFields)
  validateRequiredFields(params.quoteInfo.quote, ...quoteDetailRequiredFields)
  validateRequiredFields(params.acceptInfo, ...acceptQuoteRequiredFields)

  const expirationError = validateExpiration(params.quoteInfo)
  if (expirationError !== '') {
    return throwIfEnabled(expirationError, options)
  }

  const addressError = await validateAddress(context, params)
  if (addressError !== '') {
    return throwIfEnabled(addressError, options)
  }

  let parsedTx: Transaction
  try {
    const btcRaw = params.btcTx.startsWith('0x') ? params.btcTx.slice(2) : params.btcTx
    parsedTx = Transaction.fromHex(btcRaw)
  } catch (error: any) {
    return throwIfEnabled('Invalid transaction: ' + error.message, options)
  }

  const amountError = await validatePaidAmount(context, params, parsedTx)
  if (amountError !== '') {
    return throwIfEnabled(amountError, options)
  }

  const utxoError = await validateUtxos(context, params, parsedTx)
  if (utxoError !== '') {
    return throwIfEnabled(utxoError, options)
  }
  return ''
}

function validateExpiration (quote: Quote): string {
  if (!FlyoverUtils.isPeginStillPayable(quote)) {
    const detail = quote.quote
    return `The quote ${quote.quoteHash} was expired at ${detail.agreementTimestamp + detail.timeForDeposit}.`
  }
  return ''
}

async function validateAddress (
  context: FlyoverSDKContext,
  params: ValidatePeginTransactionParams
): Promise<string> {
  const { lbc, provider } = context
  const isValidAddress = await lbc.validatePeginDepositAddress(params.quoteInfo, params.acceptInfo.bitcoinDepositAddressHash)
  if (!isValidAddress) {
    return FlyoverError.untrustedBtcAddressError({
      serverUrl: provider.apiBaseUrl,
      address: params.acceptInfo.bitcoinDepositAddressHash
    }).details
  }
  return ''
}

async function validatePaidAmount (
  context: FlyoverSDKContext,
  params: ValidatePeginTransactionParams,
  parsedTx: Transaction
): Promise<string> {
  const { config } = context
  const totalSats = parsedTx.outs.map<[string, number]>(output => [
    address.fromOutputScript(output.script, getNetworkForConfig(config)),
    output.value
  ])
    .filter(([address, _value]) => address === params.acceptInfo.bitcoinDepositAddressHash)
    .reduce((sum, [_payment, value]) => sum + BigInt(value), BigInt(0))

  const totalWei = totalSats * BigInt(10 ** 10)
  const expectedValue = FlyoverUtils.getQuoteTotal(params.quoteInfo)

  if (totalWei < expectedValue) {
    return `The amount paid ${totalWei} is less than the expected value ${expectedValue}.`
  }
  return ''
}

async function validateUtxos (context: FlyoverSDKContext, params: ValidatePeginTransactionParams, parsedTx: Transaction): Promise<string> {
  const { config, bridge } = context
  const minBridgeSats = await bridge.getMinimumLockTxValue()
  const minBridgeWei = satsToWei(minBridgeSats)
  const invalidUtxos = parsedTx.outs.map<[string, number]>(output => [
    address.fromOutputScript(output.script, getNetworkForConfig(config)),
    output.value
  ])
    .filter(([address, value]) => address === params.acceptInfo.bitcoinDepositAddressHash && satsToWei(BigInt(value)) < minBridgeWei)
    .length
  if (invalidUtxos > 0) {
    return `The transaction has ${invalidUtxos} outputs with less than the minimum value ${minBridgeWei}.`
  }
  return ''
}

function throwIfEnabled (errorMessage: string, options: ValidatePeginTransactionOptions): string {
  if (options.throwError && errorMessage !== '') {
    throw FlyoverError.withReason(errorMessage)
  }
  return errorMessage
}

function getNetworkForConfig (config: FlyoverConfig): networks.Network {
  switch (config.network) {
    case 'Mainnet':
      return networks.bitcoin
    case 'Testnet':
      return networks.testnet
    case 'Development':
      return networks.testnet
    case 'Regtest':
      return networks.regtest
    default:
      throw new Error('Invalid network')
  }
}
