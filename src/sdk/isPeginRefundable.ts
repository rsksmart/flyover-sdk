import { type BlockchainConnection, type HttpClient, BridgeError } from '@rsksmart/bridges-core-sdk'
import { type IsQuoteRefundableResponse } from '../utils/interfaces'
import { isPeginQuotePaid } from './isPeginQuotePaid'
import { type Quote, type LiquidityProvider } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import { Transaction } from 'bitcoinjs-lib'
import pmtBuilder from '@rsksmart/pmt-builder'
import { FlyoverErrors } from '../constants/errors'

export interface IsPeginRefundableParams {
  httpClient: HttpClient
  liquidityProvider: LiquidityProvider
  btcDataSource: BitcoinDataSource
  rskConnection: BlockchainConnection
  quote: Quote
  providerSignature: string
  btcTransactionHash: string
  liquidityBridgeContract: LiquidityBridgeContract
}

export async function isPeginRefundable (
  params: IsPeginRefundableParams
): Promise<IsQuoteRefundableResponse> {
  const FAILED_TO_VALIDATE_BTC_TRANSACTION_ERROR_CODE = 'LBC031'
  const { httpClient, liquidityProvider, quote, rskConnection, providerSignature, btcTransactionHash, liquidityBridgeContract, btcDataSource } = params

  // Validate the quote is not paid
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const isPaidResponse = await isPeginQuotePaid(httpClient, liquidityProvider, quote.quoteHash, rskConnection!)

  if (isPaidResponse.isPaid) {
    return { isRefundable: false, error: FlyoverErrors.PEG_IN_REFUND_ALREADY_PAID }
  }

  // Execute a static call to registerPegin()
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await executeStaticCallToRegisterPegin(
      btcDataSource,
      quote,
      providerSignature,
      btcTransactionHash,
      liquidityBridgeContract
    )
  } catch (error) {
    if (error instanceof BridgeError) {
      if (error.details.error.message.includes(FAILED_TO_VALIDATE_BTC_TRANSACTION_ERROR_CODE)) {
        return { isRefundable: false, error: FlyoverErrors.PEG_IN_REFUND_DOES_NOT_HAVE_ENOUGH_CONFIRMATIONS }
      }

      return {
        isRefundable: false,
        error: {
          ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
          detail: error.details.error.message
        }
      }
    }

    return {
      isRefundable: false,
      error: {
        ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
        detail: 'Unknown error'
      }
    }
  }

  return { isRefundable: true }
}

async function executeStaticCallToRegisterPegin (
  btcDataSource: BitcoinDataSource,
  quote: Quote,
  providerSignature: string,
  btcTransactionHash: string,
  liquidityBridgeContract: LiquidityBridgeContract
): Promise<void> {
  const btcRawTxWithoutWitnesses = await getRawTxWithoutWitnesses(btcTransactionHash, btcDataSource)

  const block = await btcDataSource.getBlockFromTransaction(btcTransactionHash)
  const partialMarkleTree = pmtBuilder.buildPMT(block.transactionHashes, btcTransactionHash)

  // Make a static call to registerPegin
  await liquidityBridgeContract.registerPegin({
    quote,
    signature: providerSignature,
    btcRawTransaction: btcRawTxWithoutWitnesses,
    partialMerkleTree: partialMarkleTree.hex,
    height: block.height
  }, 'staticCall')
}

async function getRawTxWithoutWitnesses (btcTransactionHash: string, btcDataSource: BitcoinDataSource): Promise<string> {
  const btcHexTransaction = await btcDataSource.getTransactionAsHex(btcTransactionHash)

  const bitcoinJsTx = Transaction.fromHex(btcHexTransaction)
  bitcoinJsTx.ins.forEach(input => {
    input.witness = []
  })

  return bitcoinJsTx.toHex()
}
