import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export interface FlyoverError {
  code: string
  description: string
}

/**
 * Object with errors messages and codes
 */
export const Errors = deepFreeze({
  LPS_DID_NOT_RETURN_STATUS: {
    code: 'Flyover0001',
    description: 'Liquidity Provider did not return a status'
  },
  QUOTE_DOES_NOT_HAVE_A_CALL_FOR_USER_TX_HASH: {
    code: 'Flyover0002',
    description: 'Quote does not have a callForUserTxHash'
  },
  TRANSACTION_NOT_FOUND: {
    code: 'Flyover0003',
    description: 'Transaction not found on blockchain'
  },
  CALL_FOR_USER_EVENT_NOT_FOUND: {
    code: 'Flyover0004',
    description: 'CallForUser event not found in logs'
  }
} as const)

export type FlyoverErrors = keyof typeof Errors
