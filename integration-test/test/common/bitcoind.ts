const {
  TEST_BTC_RPC_PORT: port = '5555',
  TEST_BTC_RPC_USER: user = 'test',
  TEST_BTC_RPC_PASSWORD: password = 'test',
  TEST_BTC_RPC_CONNECT: host = '127.0.0.1'
} = process.env

export interface BtcOutput {
  valueInSats: bigint
  address?: string
  scriptHex: string
}

export interface BtcTransaction {
  txid: string
  confirmations: number
  outputs: BtcOutput[]
}

interface RawOutput {
  value: number
  scriptPubKey: { hex: string, address?: string }
}

interface RawTransaction {
  confirmations?: number
  vout: RawOutput[]
}

async function btcRpc<T> (method: string, ...params: unknown[]): Promise<T> {
  const response = await fetch(`http://${host}:${port}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      Authorization: 'Basic ' + Buffer.from(`${user}:${password}`).toString('base64')
    },
    body: JSON.stringify({ jsonrpc: '1.0', id: method, method, params })
  })
  const { result, error } = await response.json() as { result: T, error: { message: string } | null }
  if (error !== null) {
    throw new Error(`bitcoind ${method} failed: ${error.message}`)
  }
  return result
}

export async function mineBtcBlocks (count: number): Promise<void> {
  const { descriptor } = await btcRpc<{ descriptor: string }>('getdescriptorinfo', 'raw(51)')
  await btcRpc('generatetodescriptor', count, descriptor)
}

export async function getBtcTransaction (txid: string): Promise<BtcTransaction> {
  const { confirmations, vout } = await btcRpc<RawTransaction>('getrawtransaction', txid, true)
  return {
    txid,
    confirmations: confirmations ?? 0,
    outputs: vout.map(({ value, scriptPubKey }) => ({
      valueInSats: BigInt(Math.round(value * 100_000_000)),
      address: scriptPubKey.address,
      scriptHex: scriptPubKey.hex
    }))
  }
}

export async function findMempoolTransaction (scriptHex: string): Promise<BtcTransaction | undefined> {
  for (const txid of await btcRpc<string[]>('getrawmempool')) {
    const transaction = await getBtcTransaction(txid)
    if (transaction.outputs.some(output => output.scriptHex === scriptHex)) {
      return transaction
    }
  }
  return undefined
}
