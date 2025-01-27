import { type HttpClient, isValidSignature, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type AcceptedPegoutQuote, type PegoutQuote, type LiquidityProvider, providerRequiredFields, Routes, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { FlyoverError } from '../client/httpClient'

export async function acceptPegoutQuote (httpClient: HttpClient, provider: LiquidityProvider, quote: PegoutQuote): Promise<AcceptedPegoutQuote> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(quote.quote, ...pegoutQuoteDetailRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)
  const url = provider.apiBaseUrl + Routes.acceptPegoutQuote
  const acceptedQuote = await httpClient.post<AcceptedPegoutQuote>(
    url,
    { QuoteHash: quote.quoteHash },
    { includeCaptcha: true }
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
