import { getPegoutStatus } from './getPegoutStatus'
import { assertTruthy, type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PegoutQuoteStatus } from '../api'
import { FlyoverErrors } from '../constants/errors'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import { type FlyoverSDKContext, type IsQuotePaidResponse } from '../utils/interfaces'

const MAX_RETRIES = 3
const RETRY_DELAY = 3000 // 3 seconds

export async function isPegoutQuotePaid (
  quoteHash: string,
  context: FlyoverSDKContext
): Promise<IsQuotePaidResponse> {
  const { httpClient, provider, btcConnection } = context

  assertTruthy(httpClient, 'Missing HTTP Client')
  assertTruthy(provider, 'Missing Liquidity Provider')
  assertTruthy(btcConnection, 'Missing Bitcoin Connection')

  let pegoutStatus: PegoutQuoteStatus

  // Get the pegout status from the Liquidity Provider
  try {
    pegoutStatus = await getPegoutStatusWithRetries(httpClient, provider, quoteHash)
  } catch (error) {
    return {
      isPaid: false,
      error: {
        ...FlyoverErrors.LPS_DID_NOT_RETURN_QUOTE_STATUS,
        detail: error instanceof Error ? error : new Error('Unknown error')
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

  // Check if the transaction reported in the pegout status is valid
  const isValid = await isBtcTransactionValid(pegoutStatus, quoteHash, btcConnection)

  if (!isValid.isValid) {
    return {
      isPaid: false,
      error: {
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error(isValid.errorMessage)
      }
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
    } catch (error) {  // eslint-disable-line @typescript-eslint/no-unused-vars
      attempts++
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
    }
  }

  // Final attempt
  return getPegoutStatus(httpClient, provider, quoteHash)
}

async function isBtcTransactionValid (
  pegoutStatus: PegoutQuoteStatus,
  quoteHash: string,
  bitcoinDataSource: BitcoinDataSource
): Promise<{ isValid: boolean, errorMessage?: string }> {
  try {
    const bitcoinTx = await bitcoinDataSource.getTransaction(pegoutStatus.status.lpBtcTxHash)

    if (!bitcoinTx.isConfirmed) {
      return { isValid: false, errorMessage: 'Transaction is not confirmed' }
    }

    if (bitcoinTx.vout.length < 2) {
      return { isValid: false, errorMessage: 'Transaction does not have enough outputs' }
    }

    // Validate that the amount is correct
    // The first output is the payment of the quote value
    const btcValueInSats = bitcoinTx.vout[0]?.valueInSats ?? 0

    // Then convert satoshis to wei (multiply by 10^10)
    const satoshisToWeiConversionFactor = BigInt(10) ** BigInt(10)
    const btcValueInWei = BigInt(btcValueInSats) * satoshisToWeiConversionFactor

    if (btcValueInWei < pegoutStatus.detail.value) {
      return { isValid: false, errorMessage: 'Transaction value is less than the quote value' }
    }

    // Validate that the OP_RETURN output is correct
    // The second output is the OP_RETURN output with the quote hash
    const opReturnCandidate = bitcoinTx.vout[1]

    if (!opReturnCandidate) {
      return { isValid: false, errorMessage: 'Transaction does not have a valid OP_RETURN output' }
    }

    const isValid = opReturnCandidate.valueInSats === 0 && opReturnCandidate.hex === `6a20${quoteHash}`

    if (!isValid) {
      return { isValid: false, errorMessage: 'Transaction does not have a valid OP_RETURN output' }
    }

    return { isValid }
  } catch (error) {
    return { isValid: false, errorMessage: `Failed to check OP_RETURN output: ${error}` }
  }
}
