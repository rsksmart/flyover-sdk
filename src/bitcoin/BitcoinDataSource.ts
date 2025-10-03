export const MIN_BTC_CONFIRMATIONS = 1

export interface BitcoinTransactionOutput {
  valueInSats: number // in satoshis
  hex: string
}

export interface BitcoinTransaction {
  txid: string
  isConfirmed: boolean
  vout: BitcoinTransactionOutput[]
  blockHash?: string
  blockHeight?: number
}

export interface Block {
  hash: string
  height: number
  transactionHashes: string[]
}

export interface BitcoinDataSource {
  getTransaction: (txHash: string) => Promise<BitcoinTransaction>
  getTransactionAsHex: (txHash: string) => Promise<string>
  getBlockFromTransaction: (txHash: string) => Promise<Block>
}
