import type { BitcoinDataSource, BitcoinTransaction } from './BitcoinDataSource'
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
      vout: transaction.vout.map((output: any) => ({
        valueInSats: output.value, // Already in satoshis
        hex: output.scriptpubkey
      }))
    }
  }
}
