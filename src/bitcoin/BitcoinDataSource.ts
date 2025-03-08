
export interface BitcoinDataSource {
  getTransactionAsHex: (txHash: string) => Promise<string>
}
