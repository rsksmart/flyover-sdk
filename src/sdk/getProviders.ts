import { type LiquidityProvider, type LiquidityProviderDetail, Routes } from '../api'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityBridgeContract } from '../blockchain/lbc'

export async function getProviders (httpClient: HttpClient, lbc: LiquidityBridgeContract): Promise<LiquidityProvider[]> {
  return lbc.discoveryContract.getProviders()
    .then(async providers => {
      const liquidityProviders = providers.map(async provider => {
        return httpClient.get<LiquidityProviderDetail>(provider.apiBaseUrl + Routes.providerDetail)
          .then(detail => { return { ...provider, ...detail } })
      })
      return Promise.allSettled(liquidityProviders)
    })
    .then(promises => {
      return promises.map(promise => promise.status === 'fulfilled' ? promise.value : undefined)
        .filter((provider): provider is LiquidityProvider => provider !== undefined)
    })
}
