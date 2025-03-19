import { type BitcoinDataSource, type BitcoinTransaction, MIN_BTC_CONFIRMATIONS } from './BitcoinDataSource'

interface BitcoinClientConfig {
  rpcport: number
  rpcuser: string
  rpcpassword: string
  rpcconnect: string
}

type RpcCaller = (method: string, ...args: any[]) => Promise<any>

function getBitcoinRpcCaller (config: BitcoinClientConfig): RpcCaller {
  const url = `http://${config.rpcconnect}:${config.rpcport}`
  const headers = new Headers()
  headers.append('content-type', 'application/json')
  const token = Buffer.from(`${config.rpcuser}:${config.rpcpassword}`).toString('base64')
  headers.append('Authorization', 'Basic ' + token)

  return async function (method: string, ...args: any[]): Promise<any> {
    const body = JSON.stringify({
      jsonrpc: '1.0',
      method: method.toLowerCase(),
      params: typeof args[0] === 'object' && !Array.isArray(args[0]) ? args[0] : args
    })
    const requestOptions = { method: 'POST', headers, body }
    return fetch(url, requestOptions)
      .then(async response => response.json())
      .then(response => {
        if (response.error) {
          throw response.error
        }
        return response.result
      })
  }
}

export class LocalBTCDataSource implements BitcoinDataSource {
  private readonly config: BitcoinClientConfig
  private readonly rpcCaller: RpcCaller

  constructor (config: BitcoinClientConfig) {
    this.config = config
    this.rpcCaller = getBitcoinRpcCaller(this.config)
  }

  /**
   * Gets detailed information about a Bitcoin transaction, including confirmation status
   * @param txHash The transaction hash to query
   * @returns A promise that resolves to a BitcoinTransaction object
   */
  async getTransaction (txHash: string): Promise<BitcoinTransaction> {
    try {
      // The second parameter 'true' tells Bitcoin Core to return the full decoded transaction
      const transaction = await this.rpcCaller('getrawtransaction', txHash, true)

      return {
        txid: transaction.txid,
        isConfirmed: transaction.confirmations >= MIN_BTC_CONFIRMATIONS,
        vout: transaction.vout.map((output: any) => ({
          valueInSats: output.value * 100_000_000, // Convert BTC to satoshis
          hex: output.scriptPubKey.hex
        }))
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get transaction details: ${errorMessage}`)
    }
  }
}
