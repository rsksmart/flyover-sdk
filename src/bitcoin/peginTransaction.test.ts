import { describe, test, expect } from '@jest/globals'
import { script as bitcoinScript, Transaction, payments, networks } from 'bitcoinjs-lib'
import {
  buildPeginOpReturnPayload,
  buildPeginOpReturnScript,
  buildPeginBtcTransaction,
  OP_RETURN_STANDARD_LIMIT,
  DEST_CONTRACT_BYTES,
  MAX_GAS_FEE_BYTES,
  type PeginScCall
} from './peginTransaction'

const DEST_CONTRACT = '0xF5ad1A6F6BA49C507Bb24676bbF80b8ed19B694c'

describe('buildPeginOpReturnPayload should', () => {
  test('lay out destinationContract(20) + maxGasFee(32) + callData in order', () => {
    const callData = '0xabcdef'
    const scCall: PeginScCall = { destinationContract: DEST_CONTRACT, maxGasFee: BigInt(1000), callData }
    const payload = buildPeginOpReturnPayload(scCall)

    expect(payload.length).toBe(DEST_CONTRACT_BYTES + MAX_GAS_FEE_BYTES + 3)
    // destination contract is the first 20 bytes
    expect('0x' + payload.subarray(0, DEST_CONTRACT_BYTES).toString('hex')).toBe(DEST_CONTRACT.toLowerCase())
    // maxGasFee is the next 32 bytes, big-endian
    expect(BigInt('0x' + payload.subarray(DEST_CONTRACT_BYTES, DEST_CONTRACT_BYTES + MAX_GAS_FEE_BYTES).toString('hex'))).toBe(BigInt(1000))
    // callData is the remainder
    expect('0x' + payload.subarray(DEST_CONTRACT_BYTES + MAX_GAS_FEE_BYTES).toString('hex')).toBe(callData)
  })

  test('allow an empty callData (plain SC payload of 52 bytes)', () => {
    const payload = buildPeginOpReturnPayload({ destinationContract: DEST_CONTRACT, maxGasFee: BigInt(0) })
    expect(payload.length).toBe(DEST_CONTRACT_BYTES + MAX_GAS_FEE_BYTES)
  })

  test('accept calldata exactly at the 80-byte cap (28 bytes of calldata)', () => {
    const maxCallDataBytes = OP_RETURN_STANDARD_LIMIT - DEST_CONTRACT_BYTES - MAX_GAS_FEE_BYTES // 28
    const callData = '0x' + 'aa'.repeat(maxCallDataBytes)
    const payload = buildPeginOpReturnPayload({ destinationContract: DEST_CONTRACT, maxGasFee: BigInt(1), callData })
    expect(payload.length).toBe(OP_RETURN_STANDARD_LIMIT)
  })

  test('throw a clear error when the payload exceeds the standard 80-byte cap', () => {
    const tooMuch = '0x' + 'aa'.repeat(29) // 52 + 29 = 81 bytes
    expect(() => buildPeginOpReturnPayload({ destinationContract: DEST_CONTRACT, maxGasFee: BigInt(1), callData: tooMuch }))
      .toThrow(/exceeding the standard limit of 80 bytes/)
  })

  test('reject a destination contract that is not 20 bytes', () => {
    expect(() => buildPeginOpReturnPayload({ destinationContract: '0x1234', maxGasFee: BigInt(0) }))
      .toThrow(/expected 20 bytes/)
  })

  test('reject a negative maxGasFee', () => {
    expect(() => buildPeginOpReturnPayload({ destinationContract: DEST_CONTRACT, maxGasFee: BigInt(-1) }))
      .toThrow(/non-negative/)
  })
})

describe('buildPeginOpReturnScript should', () => {
  test('produce a script that starts with OP_RETURN and decompiles to a single data push', () => {
    const scriptBuf = buildPeginOpReturnScript({ destinationContract: DEST_CONTRACT, maxGasFee: BigInt(42), callData: '0xdead' })
    const decompiled = bitcoinScript.decompile(scriptBuf)
    expect(decompiled).not.toBeNull()
    const ops: (number | Buffer)[] = decompiled ?? []
    // OP_RETURN opcode is 0x6a (106)
    expect(ops[0]).toBe(0x6a)
    const data = ops[1] as Buffer
    expect(data.length).toBe(DEST_CONTRACT_BYTES + MAX_GAS_FEE_BYTES + 2)
  })

  test('propagate the over-cap error', () => {
    const tooMuch = '0x' + 'aa'.repeat(40)
    expect(() => buildPeginOpReturnScript({ destinationContract: DEST_CONTRACT, maxGasFee: BigInt(1), callData: tooMuch }))
      .toThrow(/exceeding the standard limit/)
  })
})

describe('buildPeginBtcTransaction should', () => {
  // A funded regtest tx with one P2PKH output, built programmatically so the prev-out value is
  // deterministic for the change computation.
  function makeFundingTx (valueSat: number): { hex: string, txId: string } {
    const tx = new Transaction()
    tx.version = 2
    // dummy input
    tx.addInput(Buffer.alloc(32, 1), 0)
    const p2pkh = payments.p2pkh({ hash: Buffer.alloc(20, 2), network: networks.regtest })
    if (p2pkh.output === undefined) {
      throw new Error('failed to build funding output')
    }
    tx.addOutput(p2pkh.output, valueSat)
    return { hex: tx.toHex(), txId: tx.getId() }
  }

  const DEPOSIT_ADDRESS = '2Mu99L6NMXKfMH8HxHTgoTArCyDSrwA3dPr'
  const CHANGE_ADDRESS = '2Mu99L6NMXKfMH8HxHTgoTArCyDSrwA3dPr'

  test('build a plain peg-in with no OP_RETURN output', () => {
    const funding = makeFundingTx(100000)
    const psbt = buildPeginBtcTransaction({
      network: 'regtest',
      depositAddress: DEPOSIT_ADDRESS,
      amountSat: BigInt(50000),
      inputs: [{ txId: funding.txId, vout: 0, rawTxHex: funding.hex }],
      changeAddress: CHANGE_ADDRESS,
      minerFeeSat: BigInt(1000)
    })
    // outputs: deposit + change, no OP_RETURN
    expect(psbt.txOutputs).toHaveLength(2)
    const hasOpReturn = psbt.txOutputs.some(o => o.script[0] === 0x6a)
    expect(hasOpReturn).toBe(false)
    // change = 100000 - 50000 - 1000
    expect(psbt.txOutputs[1]?.value).toBe(49000)
  })

  test('add an OP_RETURN output for a smart-contract peg-in', () => {
    const funding = makeFundingTx(100000)
    const psbt = buildPeginBtcTransaction({
      network: 'regtest',
      depositAddress: DEPOSIT_ADDRESS,
      amountSat: BigInt(50000),
      inputs: [{ txId: funding.txId, vout: 0, rawTxHex: funding.hex }],
      changeAddress: CHANGE_ADDRESS,
      minerFeeSat: BigInt(1000),
      scCall: { destinationContract: DEST_CONTRACT, maxGasFee: BigInt(1000), callData: '0xdead' }
    })
    const opReturnOut = psbt.txOutputs.find(o => o.script[0] === 0x6a)
    expect(opReturnOut).toBeDefined()
    expect(opReturnOut?.value).toBe(0)
  })

  test('throw when inputs do not cover amount plus fee', () => {
    const funding = makeFundingTx(10000)
    expect(() => buildPeginBtcTransaction({
      network: 'regtest',
      depositAddress: DEPOSIT_ADDRESS,
      amountSat: BigInt(50000),
      inputs: [{ txId: funding.txId, vout: 0, rawTxHex: funding.hex }],
      changeAddress: CHANGE_ADDRESS,
      minerFeeSat: BigInt(1000)
    })).toThrow(/do not cover/)
  })

  test('fail early on an over-cap OP_RETURN before producing a transaction', () => {
    const funding = makeFundingTx(100000)
    expect(() => buildPeginBtcTransaction({
      network: 'regtest',
      depositAddress: DEPOSIT_ADDRESS,
      amountSat: BigInt(50000),
      inputs: [{ txId: funding.txId, vout: 0, rawTxHex: funding.hex }],
      changeAddress: CHANGE_ADDRESS,
      minerFeeSat: BigInt(1000),
      scCall: { destinationContract: DEST_CONTRACT, maxGasFee: BigInt(1), callData: '0x' + 'aa'.repeat(40) }
    })).toThrow(/exceeding the standard limit/)
  })
})
