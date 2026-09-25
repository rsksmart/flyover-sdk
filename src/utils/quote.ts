import { assertTruthy, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, type Quote } from '../api'

export function getQuoteTotal (quote: Quote | PegoutQuote): bigint {
  assertTruthy(quote, 'empty quote')
  const detail = quote.quote
  assertTruthy(detail, 'empty quote detail')
  return BigInt(detail.callFee ?? 0) + BigInt(detail.gasFee ?? 0) + BigInt(detail.value ?? 0)
}

export function isPeginStillPayable (quote: Quote): boolean {
  assertTruthy(quote, 'empty quote')
  const detail = quote.quote
  validateRequiredFields(detail, 'agreementTimestamp', 'timeForDeposit')
  return (detail.agreementTimestamp + detail.timeForDeposit) * 1000 > Date.now()
}

export const SAT_TO_WEI = BigInt(10) ** BigInt(10)
const SATS_PER_BTC = BigInt(100_000_000)
const BTC_DECIMALS = 8

export function satsToWei (sats: bigint): bigint {
  if (sats < 0) {
    throw new Error('Negative sats value')
  }
  return sats * SAT_TO_WEI
}

export function weiToSatsCeil (wei: bigint): bigint {
  if (wei < 0) {
    throw new Error('Negative wei value')
  }

  const remainder = wei % SAT_TO_WEI
  if (remainder === BigInt(0)) {
    return wei / SAT_TO_WEI
  }
  return (wei + SAT_TO_WEI - remainder) / SAT_TO_WEI
}

export function weiToBtcCeil (wei: bigint): string {
  const sats = weiToSatsCeil(wei)
  const whole = sats / SATS_PER_BTC
  const fraction = sats % SATS_PER_BTC
  return `${whole}.${fraction.toString().padStart(BTC_DECIMALS, '0')}`
}

export function isPeginQuote (quote: Quote | PegoutQuote): quote is Quote {
  return "fedBTCAddr" in quote.quote && quote.quote.fedBTCAddr !== undefined
}
