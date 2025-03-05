import { type IBitcoinDataSource } from './IBitcoinDataSource'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

interface BitcoinClientConfig {
  rpcport: number
  rpcuser: string
  rpcpassword: string
  rpcconnect: string
}

interface TransactionOutput {
  value: number
  n: number
  scriptPubKey: {
    asm: string
    desc: string
    hex: string
    type: string
    address?: string
  }
}

interface BitcoinTransaction {
  txid: string
  hash: string
  version: number
  size: number
  vsize: number
  weight: number
  locktime: number
  vin: Array<{
    txid: string
    vout: number
    scriptSig: {
      asm: string
      hex: string
    }
    sequence: number
  }>
  vout: TransactionOutput[]
  hex: string
  blockhash?: string
  confirmations?: number
  time?: number
  blocktime?: number
}

export class LocalBTCDataSource implements IBitcoinDataSource {
  private readonly config: BitcoinClientConfig

  constructor (config: BitcoinClientConfig) {
    this.config = config
  }

  private buildCommand (method: string, params: string[] = []): string {
    const baseCommand = 'bitcoin-cli'
    const config = `-rpcport=${this.config.rpcport} -rpcuser=${this.config.rpcuser} -rpcpassword=${this.config.rpcpassword} -rpcconnect=${this.config.rpcconnect}`
    const paramsStr = params.length > 0 ? ` ${params.join(' ')}` : ''
    return `${baseCommand} ${config} ${method}${paramsStr}`
  }

  private async getTransaction (txHash: string): Promise<BitcoinTransaction> {
    try {
      const command = this.buildCommand('getrawtransaction', [txHash, 'true'])
      const { stdout } = await execAsync(command)
      const rawTx = JSON.parse(stdout)
      return rawTx
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get transaction: ${errorMessage}`)
    }
  }

  async hasOpReturnOutput (txHash: string, quoteHash: string): Promise<boolean> {
    try {
      const txData = await this.getTransaction(txHash)

      // Find any output that is an OP_RETURN (value is 0 and script starts with 6a)
      return txData.vout.some((output: TransactionOutput) => {
        const isOpReturn = output.value === 0 &&
                          output.scriptPubKey.hex.startsWith('6a') &&
                          output.scriptPubKey.asm.startsWith('OP_RETURN')

        // Check if the quoteHash is at the end of the entire scriptPubKey
        if (isOpReturn) {
          const normalizedQuoteHash = quoteHash.replace('0x', '')
          return output.scriptPubKey.hex.endsWith(normalizedQuoteHash)
        }
        return false
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to check OP_RETURN output: ${errorMessage}`)
    }
  }
}
