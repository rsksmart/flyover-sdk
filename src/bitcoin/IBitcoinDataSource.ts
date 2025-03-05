
export interface IBitcoinDataSource {
  hasOpReturnOutput: (txHash: string, quoteHash: string) => Promise<boolean>
}
