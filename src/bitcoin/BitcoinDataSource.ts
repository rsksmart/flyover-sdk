export const MIN_BTC_CONFIRMATIONS = 1

export interface BitcoinTransactionOutput {
  valueInSats: number // in satoshis
  hex: string
}

export interface BitcoinTransaction {
  txid: string
  isConfirmed: boolean
  vout: BitcoinTransactionOutput[]
}

export interface BitcoinDataSource {
  getTransaction: (txHash: string) => Promise<BitcoinTransaction>
}
