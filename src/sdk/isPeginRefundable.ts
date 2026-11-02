import { assertTruthy, BridgeError } from '@rsksmart/bridges-core-sdk'
import { utils } from 'ethers'
import { type FlyoverSDKContext, type IsQuoteRefundableResponse } from '../utils/interfaces'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import pmtBuilder from '@rsksmart/pmt-builder'
import { FlyoverErrors, type FlyoverSDKError } from '../constants/errors'
import { getRawTxWithoutWitnesses } from '../bitcoin/utils'

export interface IsPeginRefundableParams {
  /** The RSK destination address of the peg-in */
  rskAddress: string
  btcTransactionHash: string
}

const ALREADY_PROCESSED_ERROR = 'PegInAlreadyProcessed(bytes32)'
const BRIDGE_VALIDATION_FAILED_ERROR = 'BridgeValidationFailed()'
const BRIDGE_VALIDATIONS_ERROR_CODE = BigInt(-303)

export async function isPeginRefundable (
  params: IsPeginRefundableParams,
  context: FlyoverSDKContext
): Promise<IsQuoteRefundableResponse> {
  const { rskAddress, btcTransactionHash } = params
  const { btcConnection, lbc } = context

  assertTruthy(btcConnection, 'Bitcoin connection is required')
  assertTruthy(lbc, 'Liquidity bridge contract is required')

  let registerResult: bigint
  try {
    if (await lbc.pegInContract.isPeginPaid(rskAddress, btcTransactionHash)) {
      return { isRefundable: false, error: FlyoverErrors.PEG_IN_REFUND_ALREADY_PAID }
    }

    registerResult = await executeStaticCallToResolvePegin(
      btcConnection,
      rskAddress,
      btcTransactionHash,
      lbc
    )
  } catch (error) {
    return { isRefundable: false, error: getRefundErrorFromException(error) }
  }

  if (registerResult === BRIDGE_VALIDATIONS_ERROR_CODE) {
    return { isRefundable: false, error: FlyoverErrors.PEG_IN_REFUND_DOES_NOT_HAVE_ENOUGH_CONFIRMATIONS }
  }

  if (registerResult <= BigInt(0)) {
    return {
      isRefundable: false,
      error: {
        ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
        detail: new Error(`The bridge returned ${registerResult}`)
      }
    }
  }

  return { isRefundable: true }
}

function getRefundErrorFromException (error: unknown): FlyoverSDKError {
  if (!(error instanceof BridgeError)) {
    return {
      ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
      detail: new Error('Unknown error')
    }
  }

  const message: string = error.details?.error?.message ?? error.details?.error ?? error.message
  if (includesContractError(message, ALREADY_PROCESSED_ERROR)) {
    return FlyoverErrors.PEG_IN_REFUND_ALREADY_PAID
  }
  if (includesContractError(message, BRIDGE_VALIDATION_FAILED_ERROR)) {
    return FlyoverErrors.PEG_IN_REFUND_DOES_NOT_HAVE_ENOUGH_CONFIRMATIONS
  }
  return {
    ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
    detail: message as unknown as Error
  }
}

function includesContractError (message: string, errorSignature: string): boolean {
  return message.includes(utils.id(errorSignature).slice(0, 10))
}

async function executeStaticCallToResolvePegin (
  btcDataSource: BitcoinDataSource,
  rskAddress: string,
  btcTransactionHash: string,
  liquidityBridgeContract: LiquidityBridgeContract
): Promise<bigint> {
  const btcRawTxWithoutWitnesses = await getRawTxWithoutWitnesses(btcTransactionHash, btcDataSource)

  const block = await btcDataSource.getBlockFromTransaction(btcTransactionHash)
  const partialMarkleTree = pmtBuilder.buildPMT(block.transactionHashes, btcTransactionHash)

  return liquidityBridgeContract.pegInContract.simulateResolvePegin({
    rskAddress,
    btcRawTransaction: btcRawTxWithoutWitnesses,
    partialMerkleTree: partialMarkleTree.hex,
    height: block.height
  })
}
