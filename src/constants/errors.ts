import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export interface FlyoverError {
  code: string
  description: string
}

/**
 * Object with errors messages and codes
 */
export const Errors = deepFreeze({
  LPS_DID_NOT_RETURN_QUOTE_STATUS: {
    code: 'Flyover0001',
    description: 'Liquidity Provider did not return quote status'
  },
  QUOTE_STATUS_DOES_NOT_HAVE_A_CALL_FOR_USER_TX_HASH: {
    code: 'Flyover0002',
    description: 'Quote status does not have a callForUserTxHash'
  },
  QUOTE_STATUS_TRANSACTION_NOT_FOUND: {
    code: 'Flyover0003',
    description: 'Quote status transaction not found on blockchain'
  },
  QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_CALL_FOR_USER_EVENT: {
    code: 'Flyover0004',
    description: 'CallForUser event not found in logs'
  }
} as const)

export type FlyoverErrors = keyof typeof Errors
