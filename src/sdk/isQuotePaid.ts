import { getPeginStatus } from './getPeginStatus'
import { type HttpClient, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider } from '../api'
import lbcAbi from '../blockchain/lbc-abi'
import { Contract, type ContractReceipt } from 'ethers'
import { Errors, type FlyoverError } from '../constants/errors'
import { type PeginQuoteStatusDTO } from '../api/bindings/data-contracts'
import { type LogDescription } from 'ethers/lib/utils'

export interface IsQuotePaidResponse {
  isPaid: boolean
  error?: FlyoverError
}

const MAX_RETRIES = 3
const RETRY_DELAY = 3000 // 3 seconds

export async function isQuotePaid (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string,
  rskConnection: BlockchainConnection
): Promise<IsQuotePaidResponse> {
  let peginStatus: PeginQuoteStatusDTO

  try {
    // Get the pegin status from the Liquidity Provider
    peginStatus = await getPeginStatusWithRetries(httpClient, provider, quoteHash)
    console.log('Pegin status: ', peginStatus)
  } catch (error) {
    console.error('Error getting pegin status:', error)
    return {
      isPaid: false,
      error: Errors.LPS_DID_NOT_RETURN_STATUS
    }
  }

  // Check if pegin status exists and has a callForUserTxHash
  if (!peginStatus?.status?.callForUserTxHash) {
    return {
      isPaid: false,
      error: Errors.QUOTE_DOES_NOT_HAVE_A_CALL_FOR_USER_TX_HASH
    }
  }

  // Get the transaction receipt from the blockchain
  const receipt = await rskConnection.getTransactionReceipt(peginStatus.status.callForUserTxHash)
  if (!receipt) {
    return {
      isPaid: false,
      error: Errors.TRANSACTION_NOT_FOUND
    }
  }
  console.log('Receipt: ', receipt)

  // Parse the logs
  const parsedLogs = await parseLogs(receipt, rskConnection)

  console.log('Quote hash: ', quoteHash)
  console.log('Parsed logs: ', parsedLogs)

  // Find CallForUser event and check if quoteHash matches
  const normalizedQuoteHash = quoteHash.toLowerCase().replace('0x', '')

  const callForUserEvent = parsedLogs.find(log => {
    const normalizedEventQuoteHash = log?.args.quoteHash?.toLowerCase().replace('0x', '')
    return log?.name === 'CallForUser' &&
      normalizedEventQuoteHash === normalizedQuoteHash
  })

  console.log('callForUserEvent: ', callForUserEvent)

  if (callForUserEvent) {
    return {
      isPaid: true
    }
  } else {
    return {
      isPaid: false,
      error: Errors.CALL_FOR_USER_EVENT_NOT_FOUND
    }
  }
}

async function getPeginStatusWithRetries (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string
): Promise<PeginQuoteStatusDTO> {
  let attempts = 0

  while (attempts < MAX_RETRIES) {
    try {
      return await getPeginStatus(httpClient, provider, quoteHash)
    } catch (error) {
      attempts++
      console.log(`Retrying getPeginStatus after ${RETRY_DELAY}ms (attempt ${attempts}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }

  // Final attempt
  return getPeginStatus(httpClient, provider, quoteHash)
}

async function parseLogs (receipt: ContractReceipt,
  rskConnection: BlockchainConnection):
  Promise<Array<LogDescription | null>> {
  const contract = new Contract(receipt.to, lbcAbi, rskConnection.signer)

  // Parse the logs
  const parsedLogs = receipt.logs.map(log => {
    try {
      return contract.interface.parseLog(log)
    } catch (e) {
      return null
    }
  }).filter(Boolean)

  return parsedLogs
}
