import { type BridgeMetadata } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type PegoutQuote } from '../api'

export async function getMetadata (
  liquidityProvider: LiquidityProvider,
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

  const serviceFeeDescription = 'Service fee. Pays for the cost of making transactions on behalf of the user'
  if (lastPegoutQuote !== null) {
    pegoutMetadata.fees[1] = {
      amount: lastPegoutQuote.quote.gasFee,
      decimals: 0,
      type: 'Fixed',
      description: serviceFeeDescription,
      unit: 'Wei'
    }
  }

  return [peginMetadata, pegoutMetadata]
}
