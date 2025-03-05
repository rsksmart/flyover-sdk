import { getPeginStatus } from './getPeginStatus'
import { getPegoutStatus } from './getPegoutStatus'
import { type HttpClient, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PeginQuoteStatus, type PegoutQuoteStatus } from '../api'
import { type FlyoverError, FlyoverErrors } from '../constants/errors'
import { parseLBCLogs } from '../blockchain/parsing'
import { type ContractReceipt } from 'ethers'
import { type IBitcoinDataSource } from '../bitcoin/IBitcoinDataSource'
import { LocalBTCDataSource } from '../bitcoin/LocalBTCDataSource'
import { Mempool } from '../bitcoin/Mempool'
export interface IsQuotePaidResponse {
  isPaid: boolean
  error?: FlyoverError
}

export type TypeOfOperation = 'pegin' | 'pegout'

const MAX_RETRIES = 3
const RETRY_DELAY = 3000 // 3 seconds

/**
 * Checks if a quote has been paid by the Liquidity Provider.
 *
 * @param { HttpClient } httpClient - The HTTP client to use for request to the Liquidity Provider.
 * @param { LiquidityProvider } provider - The Liquidity Provider.
 * @param { string } quoteHash - The hash of the quote to check.
 * @param { BlockchainConnection } rskConnection - The RSK connection to use.
 * @param { TypeOfOperation } typeOfOperation - The type of operation to check (pegin or pegout)
 * @param { string } network - The network to use  (mainnet, testnet or regtest)
 *
 * @returns { Promise<IsQuotePaidResponse> } A promise that resolves to the result of the check.
 */
export async function isQuotePaid (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string,
  rskConnection: BlockchainConnection,
  typeOfOperation: TypeOfOperation,
  network?: string
): Promise<IsQuotePaidResponse> {
  if (typeOfOperation === 'pegin') {
    return isPeginQuotePaid(httpClient, provider, quoteHash, rskConnection)
  } else if (typeOfOperation === 'pegout') {
    if (!network) {
      throw new Error('Network is required for pegout quotes')
    }
    return isPegoutQuotePaid(httpClient, provider, quoteHash, network)
  } else {
    throw new Error('Invalid type of operation')
  }
}

export async function isPeginQuotePaid (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string,
  rskConnection: BlockchainConnection
): Promise<IsQuotePaidResponse> {
  let peginStatus: PeginQuoteStatus

  try {
    // Get the pegin status from the Liquidity Provider
    peginStatus = await getPeginStatusWithRetries(httpClient, provider, quoteHash)
  } catch (error) {
    return {
      isPaid: false,
      error: {
        ...FlyoverErrors.LPS_DID_NOT_RETURN_QUOTE_STATUS,
        detail: error instanceof Error ? error.message : 'Unknown error'
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
        detail: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Parse the logs
  const parsedLogs = await parseLBCLogs(receipt)

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
    } catch (error) {
      attempts++
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }

  // Final attempt
  return getPeginStatus(httpClient, provider, quoteHash)
}

async function isPegoutQuotePaid (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string,
  network: string
): Promise<IsQuotePaidResponse> {
  let pegoutStatus: PegoutQuoteStatus

  // Get the pegout status from the Liquidity Provider
  try {
    pegoutStatus = await getPegoutStatusWithRetries(httpClient, provider, quoteHash)
  } catch (error) {
    return {
      isPaid: false,
      error: {
        ...FlyoverErrors.LPS_DID_NOT_RETURN_QUOTE_STATUS,
        detail: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Check if pegout status exists and has a lpBtcTxHash
  if (!pegoutStatus?.status?.lpBtcTxHash) {
    return {
      isPaid: false,
      error: FlyoverErrors.QUOTE_STATUS_DOES_NOT_HAVE_A_PEGOUT_TX_HASH
    }
  }

  // Get the transaction receipt from the Bitcoin blockchain
  const bitcoinDataSource = getBitcoinDataSource(network)

  // Check if the transaction has a valid OP_RETURN output with the quote hash
  if (!await bitcoinDataSource.hasOpReturnOutput(pegoutStatus.status.lpBtcTxHash, quoteHash)) {
    return {
      isPaid: false,
      error: FlyoverErrors.QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_A_VALID_OP_RETURN_OUTPUT
    }
  }

  return {
    isPaid: true
  }
}

async function getPegoutStatusWithRetries (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string
): Promise<PegoutQuoteStatus> {
  let attempts = 0

  while (attempts < MAX_RETRIES) {
    try {
      return await getPegoutStatus(httpClient, provider, quoteHash)
    } catch (error) {
      attempts++
      console.log(`Retrying getPegoutStatus after ${RETRY_DELAY}ms (attempt ${attempts}/${MAX_RETRIES})`)
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }

  // Final attempt
  return getPegoutStatus(httpClient, provider, quoteHash)
}

function getBitcoinDataSource (network: string): IBitcoinDataSource {
  const normalizedNetwork = network.toLowerCase()
  if (normalizedNetwork === 'regtest') {
    return new LocalBTCDataSource({
      rpcport: 5555,
      rpcuser: 'test',
      rpcpassword: 'test',
      rpcconnect: '127.0.0.1'
    })
  } else if (normalizedNetwork === 'mainnet' || normalizedNetwork === 'testnet') {
    return new Mempool(normalizedNetwork)
  } else {
    throw new Error('Invalid Bitcoin network')
  }
}
