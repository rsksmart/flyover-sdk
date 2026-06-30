import { networks, payments, Psbt, Transaction } from 'bitcoinjs-lib'
import { utils } from 'ethers'

/**
 * The standard `OP_RETURN` data budget enforced by Bitcoin Core for relay. A standard
 * `OP_RETURN` output carries roughly 80 bytes of pushed data.
 */
export const OP_RETURN_STANDARD_LIMIT = 80

/** Byte length of the destination contract field in the SC peg-in payload. */
export const DEST_CONTRACT_BYTES = 20
/** Byte length of the max gas fee field in the SC peg-in payload. */
export const MAX_GAS_FEE_BYTES = 32

/** Parameters describing the smart-contract call carried by a peg-in OP_RETURN. */
export interface PeginScCall {
  /** The destination contract address on RSK (20-byte hex). */
  destinationContract: string
  /** The maximum gas fee, encoded as a 32-byte big-endian value. */
  maxGasFee: bigint
  /** The calldata for the smart-contract call (hex string, optional). */
  callData?: string
}

function toBuffer (hex: string, expectedLength?: number): Buffer {
  const bytes = utils.arrayify(hex.startsWith('0x') ? hex : '0x' + hex)
  if (expectedLength !== undefined && bytes.length !== expectedLength) {
    throw new Error(`expected ${expectedLength} bytes but got ${bytes.length}`)
  }
  return Buffer.from(bytes)
}

/**
 * Builds the raw payload bytes for a smart-contract peg-in:
 * `destinationContract(20) || maxGasFee(32) || callData`.
 *
 * Validates the payload fits the standard `OP_RETURN` budget and throws a clear error above
 * the cap, so we never produce a transaction that nodes may refuse to relay.
 *
 * @param scCall the smart-contract call parameters
 * @returns the payload as a Buffer
 * @throws { Error } when the payload exceeds {@link OP_RETURN_STANDARD_LIMIT}
 */
export function buildPeginOpReturnPayload (scCall: PeginScCall): Buffer {
  const destContract = toBuffer(scCall.destinationContract, DEST_CONTRACT_BYTES)

  if (scCall.maxGasFee < BigInt(0)) {
    throw new Error('maxGasFee must be a non-negative value')
  }
  const maxGasFeeHex = scCall.maxGasFee.toString(16).padStart(MAX_GAS_FEE_BYTES * 2, '0')
  if (maxGasFeeHex.length > MAX_GAS_FEE_BYTES * 2) {
    throw new Error(`maxGasFee does not fit in ${MAX_GAS_FEE_BYTES} bytes`)
  }
  const maxGasFee = toBuffer(maxGasFeeHex, MAX_GAS_FEE_BYTES)

  const callData = scCall.callData !== undefined && scCall.callData !== ''
    ? toBuffer(scCall.callData)
    : Buffer.alloc(0)

  const payload = Buffer.concat([destContract, maxGasFee, callData])

  if (payload.length > OP_RETURN_STANDARD_LIMIT) {
    throw new Error(
      `OP_RETURN payload is ${payload.length} bytes, exceeding the standard limit of ${OP_RETURN_STANDARD_LIMIT} bytes. ` +
      `Reduce the calldata: destinationContract(${DEST_CONTRACT_BYTES}) + maxGasFee(${MAX_GAS_FEE_BYTES}) leaves ` +
      `${OP_RETURN_STANDARD_LIMIT - DEST_CONTRACT_BYTES - MAX_GAS_FEE_BYTES} bytes for calldata`
    )
  }

  return payload
}

/**
 * Builds the `OP_RETURN` output script (`OP_RETURN <payload>`) for a smart-contract peg-in.
 *
 * @param scCall the smart-contract call parameters
 * @returns the output script as a Buffer
 * @throws { Error } when the payload exceeds {@link OP_RETURN_STANDARD_LIMIT}
 */
export function buildPeginOpReturnScript (scCall: PeginScCall): Buffer {
  const payload = buildPeginOpReturnPayload(scCall)
  const output = payments.embed({ data: [payload] }).output
  if (output === undefined) {
    throw new Error('failed to build OP_RETURN output script')
  }
  return output
}

/** A spendable UTXO to fund the peg-in transaction. */
export interface PeginUtxo {
  txId: string
  vout: number
  /** The full previous transaction in hex (required for non-witness inputs). */
  rawTxHex: string
}

/** Parameters for {@link buildPeginBtcTransaction}. */
export interface BuildPeginBtcTransactionParams {
  /** The BTC network to build for. */
  network: 'mainnet' | 'testnet' | 'regtest'
  /** The derived peg-in deposit address (output of getPegInDepositAddress). */
  depositAddress: string
  /** The amount to send to the deposit address, in satoshis. */
  amountSat: bigint
  /** UTXOs spent to fund the transaction. */
  inputs: PeginUtxo[]
  /** Change address; change = sum(inputs) - amount - fee. */
  changeAddress: string
  /** The miner fee in satoshis. */
  minerFeeSat: bigint
  /**
   * Optional smart-contract call. When present an `OP_RETURN` output is added; when omitted
   * the transaction is a plain peg-in with no `OP_RETURN`.
   */
  scCall?: PeginScCall
}

function resolveNetwork (network: 'mainnet' | 'testnet' | 'regtest'): networks.Network {
  switch (network) {
    case 'mainnet': return networks.bitcoin
    case 'testnet': return networks.testnet
    case 'regtest': return networks.regtest
    default: throw new Error(`unknown BTC network: ${String(network)}`)
  }
}

/**
 * Builds an unsigned peg-in BTC transaction (as a {@link Psbt}) that pays the derived deposit
 * address. When {@link BuildPeginBtcTransactionParams.scCall} is provided an `OP_RETURN` output
 * carrying `destinationContract + maxGasFee + callData` is added (validated against the standard
 * limit); otherwise it is a plain peg-in with no `OP_RETURN`.
 *
 * The returned Psbt is unsigned — the caller funds/signs it with their own wallet.
 *
 * @param params see {@link BuildPeginBtcTransactionParams}
 * @returns the unsigned Psbt
 * @throws { Error } when the OP_RETURN payload exceeds the standard limit, or the inputs do not
 *   cover the amount plus fee
 */
export function buildPeginBtcTransaction (params: BuildPeginBtcTransactionParams): Psbt {
  const network = resolveNetwork(params.network)
  const psbt = new Psbt({ network })

  // Build the OP_RETURN payload first so we fail early (before touching the Psbt) if it is over cap.
  let opReturnScript: Buffer | undefined
  if (params.scCall !== undefined) {
    opReturnScript = buildPeginOpReturnScript(params.scCall)
  }

  let totalInputSat = BigInt(0)
  for (const input of params.inputs) {
    const rawTxHex = input.rawTxHex.startsWith('0x') ? input.rawTxHex.slice(2) : input.rawTxHex
    const rawTx = Buffer.from(rawTxHex, 'hex')
    psbt.addInput({ hash: input.txId, index: input.vout, nonWitnessUtxo: rawTx })
    const prevOut = Transaction.fromHex(rawTxHex).outs[input.vout]
    if (prevOut === undefined) {
      throw new Error(`input ${input.txId}:${input.vout} does not exist in its referenced transaction`)
    }
    totalInputSat += BigInt(prevOut.value)
  }

  psbt.addOutput({ address: params.depositAddress, value: Number(params.amountSat) })

  if (opReturnScript !== undefined) {
    psbt.addOutput({ script: opReturnScript, value: 0 })
  }

  const changeSat = totalInputSat - params.amountSat - params.minerFeeSat
  if (changeSat < BigInt(0)) {
    throw new Error('inputs do not cover the peg-in amount plus the miner fee')
  }
  if (changeSat > BigInt(0)) {
    psbt.addOutput({ address: params.changeAddress, value: Number(changeSat) })
  }

  return psbt
}
