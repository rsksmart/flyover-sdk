import mempoolJS from '@mempool/mempool.js'
import type { MempoolReturn } from '@mempool/mempool.js/lib/interfaces'
import type { IBitcoinDataSource } from './IBitcoinDataSource'

export class Mempool implements IBitcoinDataSource {
  private readonly mempool: MempoolReturn

  constructor (network: 'testnet' | 'mainnet') {
    this.mempool = mempoolJS({
      hostname: 'mempool.space',
      network
    })
  }

  async hasOpReturnOutput (txHash: string, quoteHash: string): Promise<boolean> {
    try {
      const txData = await this.mempool.bitcoin.transactions.getTx({ txid: txHash })

      // Find any output that is an OP_RETURN (value is 0 and script starts with 6a)
      return txData.vout.some(output => {
        const isOpReturn = output.value === 0 &&
                          output.scriptpubkey.startsWith('6a') &&
                          output.scriptpubkey_type === 'op_return' &&
                          output.scriptpubkey_asm.startsWith('OP_RETURN')

        // Check if the quoteHash is at the end of the entire scriptpubkey
        if (isOpReturn) {
          const normalizedQuoteHash = quoteHash.replace('0x', '')
          return output.scriptpubkey.endsWith(normalizedQuoteHash)
        }
        return false
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to check OP_RETURN output: ${errorMessage}`)
    }
  }
}
