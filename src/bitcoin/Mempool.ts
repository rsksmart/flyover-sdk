import type { BitcoinDataSource } from './BitcoinDataSource'
import { MempoolBaseUrls } from '../constants/mempool'

export class Mempool implements BitcoinDataSource {
  private readonly baseUrl: string

  constructor (network: 'testnet' | 'mainnet') {
    this.baseUrl = network === 'mainnet' ? MempoolBaseUrls.Mainnet : MempoolBaseUrls.Testnet
  }

  async getTransactionAsHex (txHash: string): Promise<string> {
    const url = `${this.baseUrl}/tx/${txHash}/hex`

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const hexData = await response.text()
    console.log('hexData', hexData)

    if (hexData) {
      return hexData
    }

    throw new Error('Transaction not found')
  }
}
