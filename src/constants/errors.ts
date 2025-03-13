import { deepFreeze } from '@rsksmart/bridges-core-sdk'

export interface FlyoverSDKError {
  code: string
  description: string
  detail?: string
}

/**
 * Object with errors messages and codes
 */
export const FlyoverErrors = deepFreeze({
  LPS_DID_NOT_RETURN_QUOTE_STATUS: {
    code: 'FLYOVER-SDK-0001',
    description: 'Liquidity Provider did not return quote status'
  },
  QUOTE_STATUS_DOES_NOT_HAVE_A_CALL_FOR_USER_TX_HASH: {
    code: 'FLYOVER-SDK-0002',
    description: 'Quote status does not have a callForUserTxHash'
  },
  QUOTE_STATUS_TRANSACTION_NOT_FOUND: {
    code: 'FLYOVER-SDK-0003',
    description: 'Quote status transaction not found on blockchain'
  },
  QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_CALL_FOR_USER_EVENT: {
    code: 'FLYOVER-SDK-0004',
    description: 'CallForUser event not found in logs'
  },
  QUOTE_STATUS_DOES_NOT_HAVE_A_PEGOUT_TX_HASH: {
    code: 'FLYOVER-SDK-0005',
    description: 'Pegout status does not have a pegOutTxHash'
  },
  LPS_BTC_TRANSACTION_IS_NOT_VALID: {
    code: 'FLYOVER-SDK-0006',
    description: 'The Bitcoin transaction reported by the Liquidity Provider is not valid'
  },
  NETWORK_NOT_SPECIFIED_FOR_PEG_OUT_QUOTE: {
    code: 'FLYOVER-SDK-0007',
    description: 'Network not specified for pegout quote'
  }
} as const)
