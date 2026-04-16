import { type FlyoverConfig, isBtcMainnetAddress, isBtcTestnetAddress, type HttpClient, validateRequiredFields, isRskAddress, isBtcAddress } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, type PegoutQuoteRequest, type LiquidityProvider, providerRequiredFields, Routes, pegoutQuoteRequestRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { validateRskChecksum } from '../utils/validation'

export async function getPegoutQuote (
  config: FlyoverConfig,
  httpClient: HttpClient,
  lbc: LiquidityBridgeContract,
  provider: LiquidityProvider,
  quoteRequest: PegoutQuoteRequest
): Promise<PegoutQuote[]> {
  validateRequiredFields(quoteRequest, ...pegoutQuoteRequestRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)
  validateBtcAddresses(config, quoteRequest)
  validateRskAddresses(config, quoteRequest)

  const url = provider.apiBaseUrl + Routes.getPegoutQuote
  const quotes = await httpClient.post<PegoutQuote[]>(url, quoteRequest)
  for (const quote of quotes) {
    if (!validateQuoteResponse(quoteRequest, quote)) {
      throw FlyoverError.manipulatedQuoteResonseError(provider.apiBaseUrl)
    }
    const validHash = await validateQuoteHash(lbc, quote)
    if (!validHash) {
      throw FlyoverError.invalidQuoteHashError(provider.apiBaseUrl)
    }
  }
  return quotes
}

async function validateQuoteHash (lbc: LiquidityBridgeContract, quote: PegoutQuote): Promise<boolean> {
  const hash = await lbc.pegOutContract.hashPegoutQuote(quote)
  return hash === quote.quoteHash
}

function validateQuoteResponse (quoteRequest: PegoutQuoteRequest, quoteResponse: PegoutQuote): boolean {
  const { quote } = quoteResponse
  return quoteRequest.to === quote.btcRefundAddress &&
    quoteRequest.rskRefundAddress === quote.rskRefundAddress &&
    quoteRequest.to === quote.depositAddr &&
    quoteRequest.valueToTransfer === quote.value
}

function isValidNetwork (config: FlyoverConfig, quoteRequest: PegoutQuoteRequest): boolean {
  if (config.network === 'Mainnet') {
    return isBtcMainnetAddress(quoteRequest.to)
  } else {
    return isBtcTestnetAddress(quoteRequest.to)
  }
}

function validateBtcAddresses (config: FlyoverConfig, quoteRequest: PegoutQuoteRequest): void {
  if (!isBtcAddress(quoteRequest.to)) {
    throw FlyoverError.unsupportedBtcAddressError(quoteRequest.to)
  } else if (!isValidNetwork(config, quoteRequest)) {
    throw FlyoverError.wrongNetworkError(config.network === 'Mainnet')
  }
}

function validateRskAddresses (config: FlyoverConfig, quoteRequest: PegoutQuoteRequest): void {
  if (!isRskAddress(quoteRequest.rskRefundAddress)) {
    throw FlyoverError.invalidRskAddress(quoteRequest.rskRefundAddress)
  }
  validateRskChecksum(config, quoteRequest.rskRefundAddress)
}
