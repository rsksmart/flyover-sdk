import type { BitcoinDataSource, BitcoinTransaction, Block } from './BitcoinDataSource'
import { MempoolBaseUrls } from '../constants/mempool'

export class Mempool implements BitcoinDataSource {
  private readonly baseUrl: string

  constructor (network: 'testnet' | 'mainnet') {
    this.baseUrl = network === 'mainnet' ? MempoolBaseUrls.Mainnet : MempoolBaseUrls.Testnet
  }

  async getTransaction (txHash: string): Promise<BitcoinTransaction> {
    const url = `${this.baseUrl}/tx/${txHash}`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const transaction = await response.json()

    return {
      txid: transaction.txid,
      isConfirmed: transaction.status.confirmed, // For Mempool, the transaction is confirmed with just one confirmation
      vout: transaction.vout.map((output: { value: number, scriptpubkey: string }) => ({
        valueInSats: output.value, // Already in satoshis
        hex: output.scriptpubkey
      })),
      blockHash: transaction.status.block_hash,
      blockHeight: transaction.status.block_height
    }
  }

  async getTransactionAsHex (txHash: string): Promise<string> {
    const url = `${this.baseUrl}/tx/${txHash}/hex`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const hexData = await response.text()

    if (hexData) {
      return hexData
    }

    throw new Error('Transaction not found')
  }

  async getBlockFromTransaction (txHash: string): Promise<Block> {
    const transaction = await this.getTransaction(txHash)

    if (!transaction.blockHash || !transaction.blockHeight) {
      throw new Error('Transaction has not been confirmed')
    }

    const url = `${this.baseUrl}/block/${transaction.blockHash}/txids`

    const responseBlockTransactions = await fetch(url)

    if (!responseBlockTransactions.ok) {
      throw new Error(`HTTP error! status: ${responseBlockTransactions.status}`)
    }

    const txids: string[] = await responseBlockTransactions.json()

    if (!Array.isArray(txids)) {
      throw new Error('Response is not an array of transaction IDs')
    }

    return {
      hash: transaction.blockHash,
      height: transaction.blockHeight,
      transactionHashes: txids
    }
  }
}
