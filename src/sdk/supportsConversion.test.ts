import { describe, test, expect } from '@jest/globals'
import { supportsConversion } from './supportsConversion'

describe('supportsConversion function should', () => {
  test('ignore case', () => {
    expect(supportsConversion('RBTC', 'BTC')).toBe(true)
    expect(supportsConversion('rbtc', 'btc')).toBe(true)
  })

  test('return true on pegin', () => {
    expect(supportsConversion('BTC', 'rBTC')).toBe(true)
  })

  test('return true on pegout', () => {
    expect(supportsConversion('rBTC', 'BTC')).toBe(true)
  })

  test('return false on anything else', () => {
    expect(supportsConversion('ETH', 'rBTC')).toBe(false)
    expect(supportsConversion('BTC', 'ETH')).toBe(false)
    expect(supportsConversion('SOL', 'ETH')).toBe(false)
    expect(supportsConversion('SOL', 'BTC')).toBe(false)
  })
})
