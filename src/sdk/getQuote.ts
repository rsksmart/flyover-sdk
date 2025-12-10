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
import { validateRskChecksum } from '../utils/validation'

export async function getQuote (
  config: FlyoverConfig,
  httpClient: HttpClient,
  lbc: LiquidityBridgeContract,
  provider: LiquidityProvider,
  quoteRequest: PeginQuoteRequest
): Promise<Quote[]> {
  validateRequiredFields(quoteRequest, ...quoteRequestRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)
  validateRskAddresses(config, quoteRequest)
  quoteRequest.callContractArguments = sanitizeCallContractArguments(quoteRequest.callContractArguments)
  const url = provider.apiBaseUrl + Routes.getQuote
  const quotes = await httpClient.post<Quote[]>(url, quoteRequest)
  for (const quote of quotes) {
    if (!validateQuoteResponse(config, quoteRequest, quote)) {
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

function validateQuoteResponse (config: FlyoverConfig, quoteRequest: PeginQuoteRequest, quoteResponse: Quote): boolean {
  const { quote } = quoteResponse
  return quoteRequest.callContractArguments === quote.data &&
    quoteRequest.callEoaOrContractAddress === quote.contractAddr &&
    quoteRequest.rskRefundAddress === quote.rskRefundAddr &&
    quoteRequest.valueToTransfer === quote.value &&
    isBtcZeroAddress(config, quote.btcRefundAddr)
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
