import { FlyoverError } from '../client/httpClient'
import {
  type HttpClient,
  validateRequiredFields,
  type FlyoverConfig,
  isRskAddress,
  isBtcZeroAddress
} from '@rsksmart/bridges-core-sdk'
import {
  quoteRequestRequiredFields,
  type PeginQuoteRequest, type Quote, type LiquidityProvider, Routes, providerRequiredFields
} from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { isTextEqualNoCase, validateRskChecksum } from '../utils/validation'

export async function getQuote (
  config: FlyoverConfig,
  httpClient: HttpClient,
  lbc: LiquidityBridgeContract,
  provider: LiquidityProvider,
  quoteRequest: PeginQuoteRequest
): Promise<Quote[]> {
  // FLY-2278: deliberate CI break to validate integration workflow — revert before merge
  throw FlyoverError.withReason('[FLY-2278] Deliberate integration test failure for CI validation (PR #198)')
  validateRequiredFields(quoteRequest, ...quoteRequestRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)
  validateRskAddresses(config, quoteRequest)
  quoteRequest.callContractArguments = sanitizeCallContractArguments(quoteRequest.callContractArguments)
  const url = provider.apiBaseUrl + Routes.getQuote
  const quotes = await httpClient.post<Quote[]>(url, quoteRequest)
  for (const quote of quotes) {
    if (!validateQuoteResponse({ config, provider }, quoteRequest, quote)) {
      throw FlyoverError.manipulatedQuoteResonseError(provider.apiBaseUrl)
    }

    const validHash = await validateQuoteHash(lbc, quote)
    if (!validHash) {
      throw FlyoverError.invalidQuoteHashError(provider.apiBaseUrl)
    }
  }
  return quotes
}

async function validateQuoteHash (lbc: LiquidityBridgeContract, quote: Quote): Promise<boolean> {
  const hash = await lbc.pegInContract.hashPeginQuote(quote)
  return hash === quote.quoteHash
}

function validateQuoteResponse (context: {config: FlyoverConfig, provider: LiquidityProvider}, quoteRequest: PeginQuoteRequest, quoteResponse: Quote): boolean {
  const { quote } = quoteResponse
  return quoteRequest.callContractArguments === quote.data &&
    quoteRequest.callEoaOrContractAddress === quote.contractAddr &&
    quoteRequest.rskRefundAddress === quote.rskRefundAddr &&
    quoteRequest.valueToTransfer === quote.value &&
    quote.callOnRegister === false &&
    isTextEqualNoCase(context.provider.provider, quote.lpRSKAddr) &&
    isBtcZeroAddress(context.config, quote.btcRefundAddr)
}

function validateRskAddresses (config: FlyoverConfig, quoteRequest: PeginQuoteRequest): void {
  if (!isRskAddress(quoteRequest.rskRefundAddress)) {
    throw FlyoverError.invalidRskAddress(quoteRequest.rskRefundAddress)
  } else if (!isRskAddress(quoteRequest.callEoaOrContractAddress)) {
    throw FlyoverError.invalidRskAddress(quoteRequest.callEoaOrContractAddress)
  }
  validateRskChecksum(config, quoteRequest.callEoaOrContractAddress, quoteRequest.rskRefundAddress)
}

function sanitizeCallContractArguments (callContractArguments: string): string {
  if (callContractArguments.toLowerCase().startsWith('0x')) {
    return callContractArguments.slice(2)
  }

  return callContractArguments
}
