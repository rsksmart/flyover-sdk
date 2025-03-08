import { getPegoutStatus } from './getPegoutStatus'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PegoutQuoteStatus } from '../api'
import { FlyoverErrors } from '../constants/errors'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import { type IsQuotePaidResponse } from '../utils/interfaces'
import { Transaction } from 'bitcoinjs-lib'

const MAX_RETRIES = 3
const RETRY_DELAY = 3000 // 3 seconds

export async function isPegoutQuotePaid (
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quoteHash: string,
  bitcoinDataSource: BitcoinDataSource
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

  // Check if the transaction has a valid OP_RETURN output with the quote hash
  if (!await hasOpReturnOutput(pegoutStatus.status.lpBtcTxHash, quoteHash, bitcoinDataSource)) {
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
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }

  // Final attempt
  return getPegoutStatus(httpClient, provider, quoteHash)
}

async function hasOpReturnOutput (txHash: string, quoteHash: string, bitcoinDataSource: BitcoinDataSource): Promise<boolean> {
  try {
    const bitcoinTxHex = await bitcoinDataSource.getTransactionAsHex(txHash)
    const bitcoinTx = Transaction.fromHex(bitcoinTxHex)

    // Find any output that is an OP_RETURN (value is 0 and script starts with 6a)
    return bitcoinTx.outs.some(output => {
      const isOpReturn = output.value === 0 && output.script.length > 0 && output.script[0] === 0x6a

      // Check if it has the quote hash in the OP_RETURN output
      if (isOpReturn) {
        const scriptHex = output.script.toString('hex')
        const normalizedQuoteHash = quoteHash.replace('0x', '')
        // Check if the script ends with the quote hash
        // The OP_RETURN script format is: 6a + length byte + data
        // We need to check if the data part ends with the quote hash
        return scriptHex.endsWith(normalizedQuoteHash)
      }

      return false
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    throw new Error(`Failed to check OP_RETURN output: ${errorMessage}`)
  }
}
