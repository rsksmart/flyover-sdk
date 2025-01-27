import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export const FlyoverQuoteStatus = deepFreeze({
  Pegin: {
    WaitingForDeposit: 'WaitingForDeposit',
    WaitingForDepositConfirmations: 'WaitingForDepositConfirmations',
    TimeForDepositElapsed: 'TimeForDepositElapsed',
    CallForUserSucceeded: 'CallForUserSucceeded',
    CallForUserFailed: 'CallForUserFailed',
    RegisterPegInSucceeded: 'RegisterPegInSucceeded',
    RegisterPegInFailed: 'RegisterPegInFailed'
  },
  Pegout: {
    WaitingForDeposit: 'WaitingForDeposit',
    WaitingForDepositConfirmations: 'WaitingForDepositConfirmations',
    TimeForDepositElapsed: 'TimeForDepositElapsed',
    SendPegoutSucceeded: 'SendPegoutSucceeded',
    SendPegoutFailed: 'SendPegoutFailed',
    RefundPegOutSucceeded: 'RefundPegOutSucceeded',
    RefundPegOutFailed: 'RefundPegOutFailed',
    BridgeTxSucceeded: 'BridgeTxSucceeded',
    BridgeTxFailed: 'BridgeTxFailed'
  }
} as const)

export function getSimpleQuoteStatus (status: string): 'EXPIRED' | 'PENDING' | 'SUCCESS' | 'FAILED' {
  const pendingStatuses: string[] = [
    FlyoverQuoteStatus.Pegin.WaitingForDeposit,
    FlyoverQuoteStatus.Pegin.WaitingForDepositConfirmations,
    FlyoverQuoteStatus.Pegout.WaitingForDeposit,
    FlyoverQuoteStatus.Pegout.WaitingForDepositConfirmations
  ]
  const successStatuses: string[] = [
    FlyoverQuoteStatus.Pegin.CallForUserSucceeded,
    FlyoverQuoteStatus.Pegin.RegisterPegInSucceeded,
    FlyoverQuoteStatus.Pegout.SendPegoutSucceeded,
    FlyoverQuoteStatus.Pegout.RefundPegOutSucceeded,
    FlyoverQuoteStatus.Pegout.BridgeTxSucceeded
  ]
  const failedStatuses: string[] = [
    FlyoverQuoteStatus.Pegin.CallForUserFailed,
    FlyoverQuoteStatus.Pegin.RegisterPegInFailed,
    FlyoverQuoteStatus.Pegout.SendPegoutFailed,
    FlyoverQuoteStatus.Pegout.RefundPegOutFailed,
    FlyoverQuoteStatus.Pegout.BridgeTxFailed
  ]
  const expiredStatuses: string[] = [
    FlyoverQuoteStatus.Pegin.TimeForDepositElapsed,
    FlyoverQuoteStatus.Pegout.TimeForDepositElapsed
  ]

  if (pendingStatuses.includes(status)) {
    return 'PENDING'
  } else if (successStatuses.includes(status)) {
    return 'SUCCESS'
  } else if (failedStatuses.includes(status)) {
    return 'FAILED'
  } else if (expiredStatuses.includes(status)) {
    return 'EXPIRED'
  } else {
    throw new Error(`Unknown status: ${status}`)
  }
}
