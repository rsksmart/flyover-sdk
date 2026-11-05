import {
  BridgeError, type Connection, decodeBtcAddress, executeContractView, type FlyoverConfig, isRskAddress
} from '@rsksmart/bridges-core-sdk'
import { Contract, type ContractReceipt, type ContractTransaction, type Signer } from 'ethers'
import abi from './pegout-escrow-abi'
import { type Quotes } from './bindings/Pegout'
import { FlyoverNetworks, type FlyoverSupportedNetworks } from '../constants/networks'
import { FlyoverError } from '../client/httpClient'

/** States of a commit-first peg-out in the PegOutEscrow, in the contract's enum order. */
export const PEGOUT_STATES = ['NONE', 'REQUESTED', 'CLAIMED', 'CANCELLED', 'FULFILLED', 'REFUNDED'] as const
export type PegoutState = typeof PEGOUT_STATES[number]

/** Whether the value is a 32-byte peg-out id, with or without the 0x prefix. */
export function isPegoutId (value: string): boolean {
  return /^(0x)?[0-9a-fA-F]{64}$/.test(value)
}

/** A commit-first peg-out request mined on the PegOutEscrow. */
export interface PegoutRequest {
  /** Id of the peg-out until an LP claims it, without the 0x prefix */
  requestHash: string
  /** Hash of the requestPegOut transaction */
  txHash: string
  /**
   * Escrow nonce of the request, which keeps tracking it after an LP claims it. Undefined only when
   * an LP claimed the request in the same block it was mined in.
   */
  nonce?: bigint
}

/** Wrapper around the on-chain PegOutEscrow contract, which holds commit-first peg-out requests. */
export class PegOutEscrowContract {
  private readonly escrowContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = config.customPegOutEscrowAddress ??
      FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegOutEscrowAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid PegOutEscrow address. Provide customPegOutEscrowAddress in the Flyover config for this network')
    }
    this.escrowContract = new Contract(address, abi, rskConnection.getAbstraction())
  }

  async getAddress (): Promise<string> {
    return this.escrowContract.address
  }

  /**
   * Sends PegOutEscrow.requestPegOut with the given value and waits for it to be mined.
   *
   * @param destinationAddress the BTC address that receives the peg-out
   * @param refundAddress the RSK address that can cancel the request and receives every refund
   * @param value the RBTC to escrow, in wei
   *
   * @throws { BridgeError } When the transaction cannot be sent
   * @throws { FlyoverError } When the transaction is mined but reverts; the error carries its hash
   */
  async requestPegOut (destinationAddress: string, refundAddress: string, value: bigint): Promise<PegoutRequest> {
    const receipt = await this.send(
      'requestPegOut', [decodeBtcAddress(destinationAddress), refundAddress, { value }], FlyoverError.pegoutRequestReverted
    )
    const requestHash: string | undefined = receipt.events?.find(e => e.event === 'PegOutRequested')?.args?.requestHash
    if (requestHash === undefined) {
      throw FlyoverError.withReason(`requestPegOut transaction ${receipt.transactionHash} emitted no PegOutRequested event`)
    }
    const id = requestHash.startsWith('0x') ? requestHash.slice(2) : requestHash
    let nonce: bigint | undefined
    try {
      nonce = await this.readNonce(requestHash, receipt.blockNumber)
    } catch (error) {
      throw FlyoverError.withReason(
        `peg-out ${id} was requested in transaction ${receipt.transactionHash}, but its nonce could not be read: ${errorMessage(error)}`
      )
    }
    return { requestHash: id, txHash: receipt.transactionHash, nonce }
  }

  /**
   * Sends PegOutEscrow.cancelPegOut and waits for it to be mined.
   *
   * @param requestHash the id of the peg-out, with or without the 0x prefix
   * @returns the transaction hash
   *
   * @throws { BridgeError } When the transaction cannot be sent
   * @throws { FlyoverError } When the transaction is mined but reverts; the error carries its hash
   */
  async cancelPegOut (requestHash: string): Promise<string> {
    const receipt = await this.send('cancelPegOut', [with0x(requestHash)], FlyoverError.pegoutCancelReverted)
    return receipt.transactionHash
  }

  /**
   * Reads the escrow state of a peg-out id. An id the escrow never issued, or one it re-keyed when an LP
   * claimed it, reads NONE.
   */
  async getPegOutState (requestHash: string, blockTag: number): Promise<PegoutState> {
    const state = await executeContractView<number>(this.escrowContract, 'getPegOutState', with0x(requestHash), { blockTag })
    return PEGOUT_STATES[state] ?? 'NONE'
  }

  /**
   * Reads the current id of the peg-out with the given escrow nonce: its request id until an LP claims
   * it, then the id the claim moved it to. Reads the zero hash for a nonce the escrow never issued.
   */
  async requestIdAt (nonce: bigint, blockTag: number): Promise<string> {
    return executeContractView<string>(this.escrowContract, 'requestIdAt', nonce, { blockTag })
  }

  /**
   * Reads the refund address of a stored peg-out. Reverts for an id that reads NONE, and reads the zero
   * address once the peg-out is CANCELLED, FULFILLED or REFUNDED.
   */
  async getRefundAddress (requestHash: string, blockTag: number): Promise<string> {
    const quote = await executeContractView<Quotes.PegOutQuoteStructOutput>(
      this.escrowContract, 'getPegOutQuote', with0x(requestHash), { blockTag }
    )
    return quote.rskRefundAddress
  }

  /** Address of the account that signs this contract's transactions. */
  async getSenderAddress (): Promise<string> {
    // ethers sets the signer to null when the contract is built on a read-only connection
    const signer: Signer | null = this.escrowContract.signer
    if (signer === null) {
      throw FlyoverError.withReason('a signing RSK connection is required to send PegOutEscrow transactions')
    }
    return signer.getAddress()
  }

  private async send (
    method: string,
    args: unknown[],
    onRevert: (args: { txHash: string, reason: string }) => FlyoverError
  ): Promise<ContractReceipt> {
    let tx: ContractTransaction
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      tx = await this.escrowContract[method]!(...args)
    } catch (error) {
      throw new BridgeError({
        timestamp: Date.now(),
        recoverable: true,
        message: `error executing function ${method}`,
        details: { error: errorMessage(error) }
      })
    }
    try {
      return await tx.wait()
    } catch (error) {
      throw onRevert({ txHash: tx.hash, reason: errorMessage(error) })
    }
  }

  private async readNonce (requestHash: string, blockTag: number): Promise<bigint | undefined> {
    if (await this.getPegOutState(requestHash, blockTag) !== 'REQUESTED') {
      return undefined
    }
    const quote = await executeContractView<Quotes.PegOutQuoteStructOutput>(
      this.escrowContract, 'getPegOutQuote', requestHash, { blockTag }
    )
    return quote.nonce.toBigInt()
  }
}

function errorMessage (error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function with0x (hash: string): string {
  return hash.startsWith('0x') ? hash : '0x' + hash
}
