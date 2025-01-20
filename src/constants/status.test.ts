
import { describe, test, expect } from '@jest/globals'
import { FlyoverQuoteStatus, getSimpleQuoteStatus } from './status'

describe('getSimpleQuoteStatus function should', () => {
  test('return correct value for each state', () => {
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegin.WaitingForDeposit)).toBe('PENDING')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegin.WaitingForDepositConfirmations)).toBe('PENDING')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.WaitingForDeposit)).toBe('PENDING')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.WaitingForDepositConfirmations)).toBe('PENDING')

    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegin.CallForUserSucceeded)).toBe('SUCCESS')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegin.RegisterPegInSucceeded)).toBe('SUCCESS')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.SendPegoutSucceeded)).toBe('SUCCESS')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.RefundPegOutSucceeded)).toBe('SUCCESS')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.BridgeTxSucceeded)).toBe('SUCCESS')

    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegin.CallForUserFailed)).toBe('FAILED')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegin.RegisterPegInFailed)).toBe('FAILED')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.SendPegoutFailed)).toBe('FAILED')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.RefundPegOutFailed)).toBe('FAILED')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.BridgeTxFailed)).toBe('FAILED')

    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegin.TimeForDepositElapsed)).toBe('EXPIRED')
    expect(getSimpleQuoteStatus(FlyoverQuoteStatus.Pegout.TimeForDepositElapsed)).toBe('EXPIRED')
  })
  test('throw error for unknown input', () => {
    expect(() => getSimpleQuoteStatus('unknown')).toThrow('Unknown status: unknown')
  })
})
