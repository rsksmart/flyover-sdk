import {
  type AcceptedPegoutQuote, type LiquidityProvider, pegoutQuoteDetailRequiredFields,
  pegoutQuoteRequiredFields, type PegoutQuote, Routes, providerRequiredFields
} from '../api'
import { FlyoverError } from '../client/httpClient'
import { type HttpClient, isValidSignature, validateRequiredFields } from '@rsksmart/bridges-core-sdk'

export async function acceptAuthenticatedPegoutQuote (httpClient: HttpClient,
  provider: LiquidityProvider, quote: PegoutQuote, signature: string): Promise<AcceptedPegoutQuote> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(quote.quote, ...pegoutQuoteDetailRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)

  const url = provider.apiBaseUrl + Routes.acceptAuthenticatedPegoutQuote
  const acceptedQuote = await httpClient.post<AcceptedPegoutQuote>(
    url,
    { quoteHash: quote.quoteHash, signature: signature },
    { includeCaptcha: false }
  )
  if (!isValidSignature(provider.provider, quote.quoteHash, acceptedQuote.signature)) {
    throw FlyoverError.invalidSignatureError({
      serverUrl: provider.apiBaseUrl,
      address: quote.quote.liquidityProviderRskAddress,
      sinature: acceptedQuote.signature
    })
  }
  return acceptedQuote
}
