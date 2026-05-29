import { isValidSignature, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import {
  type AcceptedQuote, type LiquidityProvider, type Quote,
  quoteRequiredFields, quoteDetailRequiredFields, acceptQuoteRequiredFields, providerRequiredFields
} from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { getQuoteTotal, weiToSats, weiToBtc } from '../utils/quote'

export type PeginAmountUnit = 'BTC' | 'SAT' | 'WEI'

export interface PeginPaymentData {
  address: string
  amount: string
}

function convertWeiToUnit (wei: bigint, unit: PeginAmountUnit): string {
  switch (unit) {
    case 'WEI':
      return wei.toString()
    case 'SAT':
      return weiToSats(wei).toString()
    case 'BTC':
      return weiToBtc(wei)
  }
}

export async function getPeginPaymentData (
  lbc: LiquidityBridgeContract,
  provider: LiquidityProvider,
  quote: Quote,
  acceptedQuote: AcceptedQuote,
  options?: { amountUnit?: PeginAmountUnit }
): Promise<PeginPaymentData> {
  validateRequiredFields(quote, ...quoteRequiredFields)
  validateRequiredFields(quote.quote, ...quoteDetailRequiredFields)
  validateRequiredFields(acceptedQuote, ...acceptQuoteRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)

  const eip712Hash = await lbc.pegInContract.hashPeginQuoteEIP712(quote)
  if (!isValidSignature(provider.provider, eip712Hash, acceptedQuote.signature)) {
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

  const totalWei = getQuoteTotal(quote)
  const unit = options?.amountUnit ?? 'SAT'

  return {
    address: acceptedQuote.bitcoinDepositAddressHash,
    amount: convertWeiToUnit(totalWei, unit)
  }
}
