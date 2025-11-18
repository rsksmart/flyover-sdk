import { type Fee, type BridgeMetadata } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PegoutQuote, type Quote } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'

export async function getMetadata (
  liquidityProvider: LiquidityProvider,
  lbc: LiquidityBridgeContract,
  lastPeginQuote: Quote | null,
  lastPegoutQuote: PegoutQuote | null
): Promise<BridgeMetadata[]> {
  const peginMetadata: BridgeMetadata = {
    operation: 'PegIn',
    maxAmount: liquidityProvider.pegin.maxTransactionValue,
    minAmount: liquidityProvider.pegin.minTransactionValue,
    blocksToDeliver: liquidityProvider.pegin.requiredConfirmations,
    fees: [
      {
        amount: liquidityProvider.pegin.fixedFee,
        decimals: 0,
        type: 'Fixed',
        description: 'Liquidity provider fixed fee',
        unit: 'Wei'
      },
      {
        amount: liquidityProvider.pegin.feePercentage,
        decimals: 0,
        type: 'Percental',
        description: 'Liquidity provider percentage fee. It is a percentage of the pegged value.'
      }
    ]
  }
  const pegoutMetadata: BridgeMetadata = {
    operation: 'PegOut',
    maxAmount: liquidityProvider.pegout.maxTransactionValue,
    minAmount: liquidityProvider.pegout.minTransactionValue,
    blocksToDeliver: liquidityProvider.pegout.requiredConfirmations,
    fees: [
      {
        amount: liquidityProvider.pegout.fixedFee,
        decimals: 0,
        type: 'Fixed',
        description: 'Liquidity provider fixed fee',
        unit: 'Wei'
      },
      {
        amount: liquidityProvider.pegout.feePercentage,
        decimals: 0,
        type: 'Percental',
        description: 'Liquidity provider percentage fee. It is a percentage of the pegged value.'
      }
    ]
  }

  const peginProductFee = await lbc.pegInContract.getProductFeePercentage()
  const pegoutProductFee = await lbc.pegOutContract.getProductFeePercentage()
  const peginProductFeeMetadata: Fee = {
    amount: BigInt(peginProductFee),
    decimals: 0,
    type: 'Percental',
    description: 'Fee to be paid to the network. Its a percentage of the pegged value'
  }
  const pegoutProductFeeMetadata: Fee = structuredClone(peginProductFeeMetadata)
  pegoutProductFeeMetadata.amount = BigInt(pegoutProductFee)
  peginMetadata.fees.push(peginProductFeeMetadata)
  pegoutMetadata.fees.push(pegoutProductFeeMetadata)

  const serviceFeeDescription = 'Service fee. Pays for the cost of making transactions on behalf of the user'
  if (lastPeginQuote !== null) {
    peginMetadata.fees[2] = {
      amount: lastPeginQuote.quote.gasFee,
      decimals: 0,
      type: 'Fixed',
      description: serviceFeeDescription,
      unit: 'Wei'
    }
  }

  if (lastPegoutQuote !== null) {
    pegoutMetadata.fees[2] = {
      amount: lastPegoutQuote.quote.gasFee,
      decimals: 0,
      type: 'Fixed',
      description: serviceFeeDescription,
      unit: 'Wei'
    }
  }

  return [peginMetadata, pegoutMetadata]
}
