import { type HttpClient, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import {
  type DepositEvent, type LiquidityProvider, Routes, providerRequiredFields
} from '../api'

export async function getUserQuotes (httpClient: HttpClient, provider: LiquidityProvider, address: string): Promise<DepositEvent[]> {
  try {
    validateRequiredFields(provider, ...providerRequiredFields)
    const url = new URL(provider.apiBaseUrl + Routes.userQuotes)
    url.searchParams.append('address', address)
    return await httpClient.get<DepositEvent[]>(url.toString())
  } catch (error) {
    console.error(error)
    throw error
  }
}
