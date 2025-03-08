import mempoolJS from '@mempool/mempool.js'
import type { MempoolReturn } from '@mempool/mempool.js/lib/interfaces'
import type { BitcoinDataSource } from './BitcoinDataSource'

export class Mempool implements BitcoinDataSource {
  private readonly mempool: MempoolReturn

  constructor (network: 'testnet' | 'mainnet') {
    this.mempool = mempoolJS({
      hostname: 'mempool.space',
      network
    })
  }

  async getTransactionAsHex (txHash: string): Promise<string> {
    return this.mempool.bitcoin.transactions.getTxHex({ txid: txHash })
  }
}
