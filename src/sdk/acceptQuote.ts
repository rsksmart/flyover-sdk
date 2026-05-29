import {
  type AcceptedQuote, type LiquidityProvider, quoteDetailRequiredFields,
  quoteRequiredFields, type Quote, Routes, providerRequiredFields
} from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { type HttpClient, isValidSignature, validateRequiredFields } from '@rsksmart/bridges-core-sdk'

export async function acceptQuote (httpClient: HttpClient, lbc: LiquidityBridgeContract,
  provider: LiquidityProvider, quote: Quote): Promise<AcceptedQuote> {
  validateRequiredFields(quote, ...quoteRequiredFields)
  validateRequiredFields(quote.quote, ...quoteDetailRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)
  const url = provider.apiBaseUrl + Routes.acceptQuote
  const acceptedQuote = await httpClient.post<AcceptedQuote>(
    url,
    { QuoteHash: quote.quoteHash },
    { includeCaptcha: true }
  )
  const eip712Hash = await lbc.pegInContract.hashPeginQuoteEIP712(quote)
  if (!isValidSignature(quote.quote.lpRSKAddr, eip712Hash, acceptedQuote.signature)) {
    throw FlyoverError.invalidSignatureError({
      serverUrl: provider.apiBaseUrl,
      address: quote.quote.lpRSKAddr,
      signature: acceptedQuote.signature
    })
  }
  const isValidAddress = await lbc.pegInContract.validatePeginDepositAddress(quote, acceptedQuote.bitcoinDepositAddressHash)
  if (!isValidAddress) {
    throw FlyoverError.untrustedBtcAddressError({
      serverUrl: provider.apiBaseUrl,
      address: acceptedQuote.bitcoinDepositAddressHash
    })
  }
  return acceptedQuote
}
