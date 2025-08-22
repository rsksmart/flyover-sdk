import { describe, test, expect } from '@jest/globals'
import { ensureHexPrefix } from './format'

describe('ensureHexPrefix function should', () => {
  test('return the same string if it already has 0x prefix', () => {
    expect(ensureHexPrefix('0x1234')).toBe('0x1234')
    expect(ensureHexPrefix('0xabcd')).toBe('0xabcd')
    expect(ensureHexPrefix('0x0')).toBe('0x0')
  })

  test('add 0x prefix if string does not have it', () => {
    expect(ensureHexPrefix('1234')).toBe('0x1234')
    expect(ensureHexPrefix('abcd')).toBe('0xabcd')
    expect(ensureHexPrefix('0')).toBe('0x0')
  })

  test('handle uppercase hex strings correctly', () => {
    expect(ensureHexPrefix('ABCD')).toBe('0xABCD')
    expect(ensureHexPrefix('0xABCD')).toBe('0xABCD')
  })

  test('handle empty string', () => {
    expect(ensureHexPrefix('')).toBe('0x')
  })

  test('work with mixed case hex prefix', () => {
    expect(ensureHexPrefix('0X1234')).toBe('0X1234')
    expect(ensureHexPrefix('0xABCD')).toBe('0xABCD')
  })

  test('preserve case of the hex string after prefix', () => {
    expect(ensureHexPrefix('aBcD')).toBe('0xaBcD')
    expect(ensureHexPrefix('0xaBcD')).toBe('0xaBcD')
  })
})
