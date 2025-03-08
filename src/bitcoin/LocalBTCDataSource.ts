import { type BitcoinDataSource } from './BitcoinDataSource'

interface BitcoinClientConfig {
  rpcport: number
  rpcuser: string
  rpcpassword: string
  rpcconnect: string
}

type RpcCaller = (method: string, ...args: any[]) => Promise<any>

function getBitcoinRpcCaller (config: BitcoinClientConfig, debug = false): RpcCaller {
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
    if (debug) {
      console.log(body)
    }
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

  async getTransactionAsHex (txHash: string): Promise<string> {
    try {
      const rawTx = await this.rpcCaller('getrawtransaction', txHash, true)

      return rawTx.hex
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Failed to get transaction: ${errorMessage}`)
    }
  }
}
