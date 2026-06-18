import { type HttpClient, isValidSignature, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type AcceptedPegoutQuote, type PegoutQuote, type LiquidityProvider, providerRequiredFields, Routes, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { FlyoverError } from '../client/httpClient'
import { LiquidityBridgeContract } from '../blockchain/lbc'

export async function acceptPegoutQuote (
  httpClient: HttpClient,
  lbc: LiquidityBridgeContract,
  provider: LiquidityProvider,
  quote: PegoutQuote,
): Promise<AcceptedPegoutQuote> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(quote.quote, ...pegoutQuoteDetailRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)
  const url = provider.apiBaseUrl + Routes.acceptPegoutQuote
  const acceptedQuote = await httpClient.post<AcceptedPegoutQuote>(
    url,
    { QuoteHash: quote.quoteHash },
    { includeCaptcha: true }
  )
  const eip712Hash = await lbc.pegOutContract.hashPegoutQuoteEIP712(quote)
  if (!isValidSignature(quote.quote.liquidityProviderRskAddress, eip712Hash, acceptedQuote.signature)) {
    throw FlyoverError.invalidSignatureError({
      serverUrl: provider.apiBaseUrl,
      address: quote.quote.liquidityProviderRskAddress,
      signature: acceptedQuote.signature
    })
  }
  return acceptedQuote
}
