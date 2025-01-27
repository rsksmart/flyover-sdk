import { type HttpClient, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PeginQuoteStatus, Routes, providerRequiredFields } from '../api'

export async function getPeginStatus (httpClient: HttpClient, provider: LiquidityProvider, quoteHash: string): Promise<PeginQuoteStatus> {
  validateRequiredFields(quoteHash !== '' ? { quoteHash } : {}, 'quoteHash')
  validateRequiredFields(provider, ...providerRequiredFields)
  const url = new URL(provider.apiBaseUrl + Routes.peginStatus)
  url.searchParams.append('quoteHash', quoteHash)
  const result = await httpClient.get<PeginQuoteStatus>(url.toString())
  return result
}
