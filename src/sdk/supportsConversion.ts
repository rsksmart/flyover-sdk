import { tokens } from '@rsksmart/bridges-core-sdk'

export function supportsConversion (fromToken: string, toToken: string): boolean {
  const { rBTC, BTC } = tokens
  const isPegin = fromToken.toLowerCase() === BTC.toLowerCase() &&
      toToken.toLowerCase() === rBTC.toLowerCase()

  const isPegout = fromToken.toLowerCase() === rBTC.toLowerCase() &&
      toToken.toLowerCase() === BTC.toLowerCase()
  return isPegin || isPegout
}
