import { type HttpClient, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PegoutQuoteStatus, Routes, providerRequiredFields } from '../api'

export async function getPegoutStatus (httpClient: HttpClient, provider: LiquidityProvider, quoteHash: string): Promise<PegoutQuoteStatus> {
  validateRequiredFields(quoteHash !== '' ? { quoteHash } : {}, 'quoteHash')
  validateRequiredFields(provider, ...providerRequiredFields)
  const url = new URL(provider.apiBaseUrl + Routes.pegoutStatus)
  url.searchParams.append('quoteHash', quoteHash)
  const result = await httpClient.get<PegoutQuoteStatus>(url.toString())
  return result
}
