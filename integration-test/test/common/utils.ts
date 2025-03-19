import { type BitcoinDataSource, LocalBTCDataSource, Mempool } from '@rsksmart/flyover-sdk'

/**
 * This fake token resolver can be used to mock the captcha token resolver function.
 * This assumes that the keys being used are the google test keys that allow any string
 * to be a valid token.
 *
 * @returns {Promise<string>} - A promise that resolves with a fake captcha token.
 */
export const fakeTokenResolver: () => Promise<string> = async () => Promise.resolve('a-captcha-token')

export interface UTXO {
  txid: string
  vout: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
  value: bigint
}

/**
 * Fetches the UTXOs from the mempool.space API for the given address. Use this function
 * only for tests, not as part of any SDK.
 *
 * @param url the URL of the mempool.space API
 * @param address the address to fetch the UTXOs for
 */
export async function getUtxosFromMempoolSpace (url: string, address: string): Promise<UTXO[]> {
  return fetch(`${url}/api/address/${address}/utxo`)
    .then(async res => res.json())
    .then((utxos: any[]) => utxos.map(utxo => ({
      txid: utxo.txid,
      vout: utxo.vout,
      status: {
        confirmed: utxo.status.confirmed,
        block_height: utxo.status.block_height,
        block_hash: utxo.status.block_hash,
        block_time: utxo.status.block_time
      },
      value: BigInt(utxo.value)
    })))
}

/**
 * Returns a BitcoinDataSource instance based on the network.
 *
 * @param network - The network to use (regtest, mainnet, testnet)
 * @returns A BitcoinDataSource instance.
 */
export function getBitcoinDataSource (network: string): BitcoinDataSource {
  const normalizedNetwork = network.toLowerCase()
  if (normalizedNetwork === 'regtest') {
    return new LocalBTCDataSource({
      rpcport: parseInt(process.env.TEST_BTC_RPC_PORT ?? '5555'),
      rpcuser: process.env.TEST_BTC_RPC_USER ?? 'test',
      rpcpassword: process.env.TEST_BTC_RPC_PASSWORD ?? 'test',
      rpcconnect: process.env.TEST_BTC_RPC_CONNECT ?? '127.0.0.1'
    })
  } else if (normalizedNetwork === 'mainnet' || normalizedNetwork === 'testnet') {
    return new Mempool(normalizedNetwork)
  } else {
    throw new Error('Invalid Bitcoin network')
  }
}
