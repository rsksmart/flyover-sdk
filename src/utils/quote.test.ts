import { describe, test, expect } from '@jest/globals'
import { getQuoteTotal, isPeginStillPayable, satsToWei } from './quote'
import { type QuoteDetail, type PegoutQuote, type Quote } from '../api'

describe('getQuoteTotal function should', () => {
  test('fail if quote is empty', () => {
    expect(() => { getQuoteTotal(null as any) }).toThrow('empty quote')
    expect(() => { getQuoteTotal(undefined as any) }).toThrow('empty quote')
  })
  test('fail if quote detail is empty', () => {
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    expect(() => { getQuoteTotal({} as Quote) }).toThrow('empty quote detail')
    expect(() => { getQuoteTotal({} as PegoutQuote) }).toThrow('empty quote detail')
    /* eslint-enable @typescript-eslint/consistent-type-assertions */
  })
  test('sum properly quote value', () => {
    const peginQuote: Quote = {
      quote: {
        fedBTCAddr: 'any addres',
        lbcAddr: 'any addres',
        lpRSKAddr: 'any addres',
        btcRefundAddr: 'any addres',
        rskRefundAddr: 'any addres',
        lpBTCAddr: 'any addres',
        callFee: BigInt('1234567890'),
        penaltyFee: BigInt(25),
        contractAddr: 'any addres',
        data: 'any data',
        gasLimit: 3,
        nonce: BigInt(4),
        gasFee: BigInt('2000000000000000000'),
        value: BigInt('4000000000000000000'),
        agreementTimestamp: 6,
        timeForDeposit: 7,
        lpCallTime: 8,
        confirmations: 9,
        callOnRegister: true,
        productFeeAmount: BigInt('3000000000000000000')
      },
      quoteHash: 'a hash'
    }
    const pegoutQuote = {
      quote: {
        lbcAddress: 'an address',
        liquidityProviderRskAddress: 'an address',
        btcRefundAddress: 'an address',
        rskRefundAddress: 'an address',
        lpBtcAddr: 'an address',
        callFee: BigInt('8000000000000000000'),
        penaltyFee: BigInt(10),
        nonce: BigInt(9),
        depositAddr: 'an address',
        gasFee: BigInt('1500000000000000000'),
        value: BigInt('3000000000000000000'),
        agreementTimestamp: 7,
        depositDateLimit: 6,
        depositConfirmations: 5,
        transferConfirmations: 4,
        transferTime: 3,
        expireDate: 2,
        expireBlocks: 1,
        productFeeAmount: BigInt('1000000000000000000')
      },
      quoteHash: 'a hash'
    }
    expect(getQuoteTotal(peginQuote)).toBe(BigInt('9000000001234567890'))
    expect(getQuoteTotal(pegoutQuote)).toBe(BigInt('13500000000000000000'))
  })
  test('replace missing values with 0', () => {
    const quotes: any[] = [
      { quote: { callFee: 5 } },
      { quote: { value: 5 } },
      { quote: { gasFee: 5 } },
      { quote: { productFeeAmount: 5 } }
    ]
    quotes.forEach(quote => { expect(getQuoteTotal(quote)).toBe(BigInt(5)) })
  })
})

describe('isPeginStillPayable function should', () => {
  test('fail if quote is empty', () => {
    expect(() => { isPeginStillPayable(null as any) }).toThrow('empty quote')
    expect(() => { isPeginStillPayable(undefined as any) }).toThrow('empty quote')
  })
  test('fail if quote detail is empty', () => {
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    expect(() => { isPeginStillPayable({ quote: {}, quoteHash: 'hash 1' } as Quote) }).toThrow('Validation failed for object with following missing properties: agreementTimestamp, timeForDeposit')
    expect(() => { isPeginStillPayable({ quote: { timeForDeposit: 10 }, quoteHash: 'hash 1' } as Quote) }).toThrow('Validation failed for object with following missing properties: agreementTimestamp')
    expect(() => { isPeginStillPayable({ quote: { agreementTimestamp: 50 }, quoteHash: 'hash 1' } as Quote) }).toThrow('Validation failed for object with following missing properties: timeForDeposit')
    /* eslint-enable @typescript-eslint/consistent-type-assertions */
  })
  test('return true if quote is still payable', () => {
    const now = Date.now() / 1000
    const testCases: Array<{ result: boolean, quote: Partial<QuoteDetail> }> = [
      {
        result: false,
        quote: {
          agreementTimestamp: now - 3600,
          timeForDeposit: 3600
        }
      },
      {
        result: true,
        quote: {
          agreementTimestamp: now,
          timeForDeposit: 3600
        }
      },
      {
        result: true,
        quote: {
          agreementTimestamp: now - 10,
          timeForDeposit: 20
        }
      },
      {
        result: false,
        quote: {
          agreementTimestamp: now - 10,
          timeForDeposit: 5
        }
      }
    ]
    for (const testCase of testCases) {
      const quote: Quote = { quote: testCase.quote as QuoteDetail, quoteHash: 'hash' }
      expect(isPeginStillPayable(quote)).toBe(testCase.result)
    }
  })
})

describe('satsToWei function should', () => {
  test('convert sats to wei', () => {
    const cases: Array<[string, string]> = [
      ['0', '0'],
      ['1', '10000000000'],
      ['100000000', '1000000000000000000'],
      ['10000000', '100000000000000000'],
      ['1000000', '10000000000000000'],
      ['2100000000000000', '21000000000000000000000000'],
      ['9223372036854775807', '92233720368547758070000000000']
    ]
    for (const [sats, wei] of cases) {
      expect(satsToWei(BigInt(sats))).toBe(BigInt(wei))
    }
  })
  test('fail if sats is negative', () => {
    expect(() => { satsToWei(BigInt(-1)) }).toThrow('Negative sats value')
  })
})
