import { getPeginStatus } from './getPeginStatus'
import { assertTruthy, type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PeginQuoteStatus } from '../api'
import { FlyoverErrors } from '../constants/errors'
import { parsePegInContractLogs } from '../blockchain/parsing'
import { type ContractReceipt } from 'ethers'
import { type FlyoverSDKContext, type IsQuotePaidResponse } from '../utils/interfaces'

const MAX_RETRIES = 3
const RETRY_DELAY = 3000 // 3 seconds

export async function isPeginQuotePaid (
  quoteHash: string,
  context: FlyoverSDKContext
): Promise<IsQuotePaidResponse> {
  let peginStatus: PeginQuoteStatus

  const { httpClient, provider, rskConnection } = context
  assertTruthy(httpClient, 'HTTP client is required')
  assertTruthy(provider, 'Provider is required')
  assertTruthy(rskConnection, 'RSK connection is required')

  try {
    // Get the pegin status from the Liquidity Provider
    peginStatus = await getPeginStatusWithRetries(httpClient, provider, quoteHash)
  } catch (error) {
    return {
      isPaid: false,
      error: {
        ...FlyoverErrors.LPS_DID_NOT_RETURN_QUOTE_STATUS,
        detail: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }

  // Check if pegin status exists and has a callForUserTxHash
  if (!peginStatus?.status?.callForUserTxHash) {
    return {
      isPaid: false,
      error: {
        ...FlyoverErrors.QUOTE_STATUS_DOES_NOT_HAVE_A_CALL_FOR_USER_TX_HASH
      }
    }
  }

  // Get the transaction receipt from the RSK blockchain
  let receipt: ContractReceipt | null = null
  try {
    receipt = await rskConnection.getTransactionReceipt(peginStatus.status.callForUserTxHash)
    if (!receipt) {
      return {
        isPaid: false,
        error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND
      }
    }
  } catch (error) {
    return {
      isPaid: false,
      error: {
        ...FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND,
        detail: error instanceof Error ? error : new Error('Unknown error')
      }
    }
  }

  // Parse the logs
  const parsedLogs = await parsePegInContractLogs(receipt)

  // Find CallForUser event and check if quoteHash matches
  const normalizedQuoteHash = quoteHash.toLowerCase().replace('0x', '')

  const callForUserEvent = parsedLogs.find(log => {
    const normalizedEventQuoteHash = log?.args.quoteHash ? log?.args.quoteHash?.toLowerCase().replace('0x', '') : null
    return log?.name === 'CallForUser' &&
            normalizedEventQuoteHash === normalizedQuoteHash
  })

  if (callForUserEvent) {
    return {
      isPaid: true
    }
  }

  return {
    isPaid: false,
    error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_CALL_FOR_USER_EVENT
  }
}

async function getPeginStatusWithRetries (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string
): Promise<PeginQuoteStatus> {
  let attempts = 0

  while (attempts < MAX_RETRIES) {
    try {
      return await getPeginStatus(httpClient, provider, quoteHash)
    } catch (error) {  // eslint-disable-line @typescript-eslint/no-unused-vars
      attempts++
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }

  // Final attempt
  return getPeginStatus(httpClient, provider, quoteHash)
}
