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
    description: 'Liquidity Provider did not return quote status.'
  },
  QUOTE_STATUS_DOES_NOT_HAVE_A_CALL_FOR_USER_TX_HASH: {
    code: 'FLYOVER-SDK-0002',
    description: 'Quote status does not have a callForUserTxHash.'
  },
  QUOTE_STATUS_TRANSACTION_NOT_FOUND: {
    code: 'FLYOVER-SDK-0003',
    description: 'Quote status transaction not found on blockchain.'
  },
  QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_CALL_FOR_USER_EVENT: {
    code: 'FLYOVER-SDK-0004',
    description: 'CallForUser event not found in logs.'
  },
  QUOTE_STATUS_DOES_NOT_HAVE_A_PEGOUT_TX_HASH: {
    code: 'FLYOVER-SDK-0005',
    description: 'Pegout status does not have a pegOutTxHash.'
  },
  LPS_BTC_TRANSACTION_IS_NOT_VALID: {
    code: 'FLYOVER-SDK-0006',
    description: 'The Bitcoin transaction reported by the Liquidity Provider is not valid.'
  },
  NETWORK_NOT_SPECIFIED_FOR_PEG_OUT_QUOTE: {
    code: 'FLYOVER-SDK-0007',
    description: 'Network not specified for pegout quote.'
  },
  PEG_OUT_REFUND_NOT_EXPIRED_BY_BLOCKS: {
    code: 'FLYOVER-SDK-0008',
    description: 'Pegout quote not expired by blocks. Not applicable for refund yet.'
  },
  PEG_OUT_REFUND_NOT_EXPIRED_BY_DATE: {
    code: 'FLYOVER-SDK-0009',
    description: 'Pegout quote not expired by date. Not applicable for refund yet.'
  },
  PEG_OUT_REFUND_ALREADY_PAID: {
    code: 'FLYOVER-SDK-0010',
    description: 'Pegout quote was already paid, so is not applicable for refund.'
  },
  PEG_OUT_REFUND_ALREADY_COMPLETED: {
    code: 'FLYOVER-SDK-0011',
    description: 'Pegout quote was already completed, so is not applicable for refund.'
  },
  PEG_OUT_REFUND_FAILED: {
    code: 'FLYOVER-SDK-0012',
    description: 'Simulated refund failed.'
  },
  PEG_IN_REFUND_ALREADY_PAID: {
    code: 'FLYOVER-SDK-0013',
    description: 'Pegin quote was already paid, so is not applicable for refund.'
  },
  PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED: {
    code: 'FLYOVER-SDK-0014',
    description: 'Call to registerPegin failed.'
  },
  PEG_IN_REFUND_DOES_NOT_HAVE_ENOUGH_CONFIRMATIONS: {
    code: 'FLYOVER-SDK-0015',
    description: 'The Bitcoin transaction does not have enough confirmations, so is not applicable for refund yet.'
  }
} as const)
