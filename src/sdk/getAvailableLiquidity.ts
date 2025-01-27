import { type HttpClient, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type AvailableLiquidity, type LiquidityProvider, providerRequiredFields, Routes } from '../api'
import { FlyoverError } from '../client/httpClient'

export async function getAvailableLiquidity (httpClient: HttpClient, provider: LiquidityProvider): Promise<AvailableLiquidity> {
  validateRequiredFields(provider, ...providerRequiredFields)
  if (!provider.liquidityCheckEnabled) {
    throw FlyoverError.withReason('Liquidity check is not enabled for this provider')
  }
  const result = await httpClient.get<AvailableLiquidity>(provider.apiBaseUrl + Routes.availableLiquidity)
  return result
}
