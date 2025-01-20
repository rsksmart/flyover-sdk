import { assertTruthy, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, type Quote } from '../api'

export function getQuoteTotal (quote: Quote | PegoutQuote): bigint {
  assertTruthy(quote, 'empty quote')
  const detail = quote.quote
  assertTruthy(detail, 'empty quote detail')
  return BigInt(detail.callFee ?? 0) + BigInt(detail.gasFee ?? 0) +
        BigInt(detail.productFeeAmount ?? 0) + BigInt(detail.value ?? 0)
}

export function isPeginStillPayable (quote: Quote): boolean {
  assertTruthy(quote, 'empty quote')
  const detail = quote.quote
  validateRequiredFields(detail, 'agreementTimestamp', 'timeForDeposit')
  return (detail.agreementTimestamp + detail.timeForDeposit) * 1000 > Date.now()
}

export function satsToWei (sats: bigint): bigint {
  if (sats < 0) {
    throw new Error('Negative sats value')
  }
  return sats * (BigInt(10) ** BigInt(10))
}
