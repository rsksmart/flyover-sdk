import { assertTruthy, type FlyoverConfig, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { Transaction, networks, address } from 'bitcoinjs-lib'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { satsToWei } from '../utils/quote'

/** Interface that holds the parameters for a PegIn deposit validation */
export interface ValidatePeginTransactionParams {
  /** The RSK destination address of the PegIn */
  rskAddress: string
  /** The amount the PegIn is expected to pay, in wei */
  expectedAmount: bigint
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
  validateRequiredFields(params, 'rskAddress', 'expectedAmount', 'btcTx')

  const { lbc } = context
  assertTruthy(lbc, 'Missing Liquidity Bridge Contract')
  const depositAddress = await lbc.pegInContract.getDepositAddress(params.rskAddress)

  let parsedTx: Transaction
  try {
    const btcRaw = params.btcTx.startsWith('0x') ? params.btcTx.slice(2) : params.btcTx
    parsedTx = Transaction.fromHex(btcRaw)
  } catch (error: unknown) {
    return throwIfEnabled('Invalid transaction: ' + (error as Error).message, options)
  }

  const addressError = validateAddress(context, depositAddress, parsedTx)
  if (addressError !== '') {
    return throwIfEnabled(addressError, options)
  }

  const amountError = validatePaidAmount(context, params, depositAddress, parsedTx)
  if (amountError !== '') {
    return throwIfEnabled(amountError, options)
  }

  const utxoError = await validateUtxos(context, depositAddress, parsedTx)
  if (utxoError !== '') {
    return throwIfEnabled(utxoError, options)
  }
  return ''
}

function validateAddress (
  context: FlyoverSDKContext,
  depositAddress: string,
  parsedTx: Transaction
): string {
  if (getDepositOutputs(context.config, depositAddress, parsedTx).length === 0) {
    return `The transaction doesn't pay the deposit address ${depositAddress}.`
  }
  return ''
}

function validatePaidAmount (
  context: FlyoverSDKContext,
  params: ValidatePeginTransactionParams,
  depositAddress: string,
  parsedTx: Transaction
): string {
  const totalSats = getDepositOutputs(context.config, depositAddress, parsedTx)
    .reduce((sum, value) => sum + BigInt(value), BigInt(0))

  const totalWei = totalSats * BigInt(10 ** 10)
  const expectedValue = params.expectedAmount

  if (totalWei < expectedValue) {
    return `The amount paid ${totalWei} is less than the expected value ${expectedValue}.`
  }
  return ''
}

async function validateUtxos (context: FlyoverSDKContext, depositAddress: string, parsedTx: Transaction): Promise<string> {
  const { config, bridge } = context
  assertTruthy(bridge, 'Missing RskBridge')
  const minBridgeSats = await bridge.getMinimumLockTxValue()
  const minBridgeWei = satsToWei(minBridgeSats)
  const invalidUtxos = getDepositOutputs(config, depositAddress, parsedTx)
    .filter(value => satsToWei(BigInt(value)) < minBridgeWei)
    .length
  if (invalidUtxos > 0) {
    return `The transaction has ${invalidUtxos} outputs with less than the minimum value ${minBridgeWei}.`
  }
  return ''
}

function getDepositOutputs (config: FlyoverConfig, depositAddress: string, parsedTx: Transaction): number[] {
  return parsedTx.outs
    .filter(output => address.fromOutputScript(output.script, getNetworkForConfig(config)) === depositAddress)
    .map(output => output.value)
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
