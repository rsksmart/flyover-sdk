import { describe, test, expect } from '@jest/globals'
import { type PegoutQuote, type LiquidityProvider, type Quote } from '../api'
import { getMetadata } from './getMetadata'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import JSONbig from 'json-bigint'

const serializer = JSONbig({ useNativeBigInt: true })

const providerMock: LiquidityProvider = {
  id: 1,
  provider: 'any address',
  apiBaseUrl: 'http://localhost:8081',
  name: 'any name',
  status: true,
  providerType: 'pegin',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    requiredConfirmations: 7,
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1)
  },
  pegout: {
    requiredConfirmations: 5,
    minTransactionValue: BigInt(2),
    maxTransactionValue: BigInt(200),
    fee: BigInt(2)
  }
}

const pegoutQuoteMock: PegoutQuote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddress: 'any address',
    callFee: BigInt(1),
    depositAddr: 'any address',
    depositConfirmations: 1,
    depositDateLimit: 1,
    expireBlocks: 1,
    expireDate: 1,
    gasFee: BigInt(1),
    lbcAddress: 'any address',
    liquidityProviderRskAddress: 'any address',
    lpBtcAddr: 'any address',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddress: 'any address',
    transferConfirmations: 1,
    transferTime: 1,
    value: BigInt(1),
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: 'any hash'
}

const peginQuoteMock: Quote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddr: 'any address',
    callFee: BigInt(1),
    contractAddr: 'any address',
    confirmations: 1,
    gasLimit: 1,
    lbcAddr: 'any address',
    lpRSKAddr: 'any address',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddr: 'any address',
    timeForDeposit: 1,
    value: BigInt(1),
    callOnRegister: true,
    data: '0x',
    fedBTCAddr: 'any address',
    lpBTCAddr: 'any address',
    lpCallTime: 1,
    gasFee: BigInt(1),
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: 'any hash'
}

const lbcMock = {
  getProductFeePercentage: async () => Promise.resolve(2)
} as LiquidityBridgeContract

describe('getMetadata function should', () => {
  test('return pegin and pegout fees', async () => {
    const metadata = await getMetadata(providerMock, lbcMock, null, null)
    expect(metadata.length).toBe(2)
    expect(serializer.stringify(metadata.at(0))).toEqual(serializer.stringify({
      operation: 'PegIn',
      maxAmount: providerMock.pegin.maxTransactionValue,
      minAmount: providerMock.pegin.minTransactionValue,
      blocksToDeliver: providerMock.pegin.requiredConfirmations,
      fees: [
        {
          amount: providerMock.pegin.fee,
          decimals: 0,
          type: 'Fixed',
          description: 'Liquidity provider fee',
          unit: 'Wei'
        },
        {
          amount: 2,
          decimals: 0,
          type: 'Percental',
          description: 'Fee to be paid to the network. Its a percentage of the pegged value'
        }
      ]
    }))

    expect(serializer.stringify(metadata.at(1))).toEqual(serializer.stringify({
      operation: 'PegOut',
      maxAmount: providerMock.pegout.maxTransactionValue,
      minAmount: providerMock.pegout.minTransactionValue,
      blocksToDeliver: providerMock.pegout.requiredConfirmations,
      fees: [
        {
          amount: providerMock.pegout.fee,
          decimals: 0,
          type: 'Fixed',
          description: 'Liquidity provider fee',
          unit: 'Wei'
        },
        {
          amount: 2,
          decimals: 0,
          type: 'Percental',
          description: 'Fee to be paid to the network. Its a percentage of the pegged value'
        }
      ]
    }))
  })

  test('include service fee if pegin quote is provided', async () => {
    const metadata = await getMetadata(providerMock, lbcMock, peginQuoteMock, null)
    expect(serializer.stringify(metadata.at(0)?.fees.at(2))).toEqual(serializer.stringify({
      amount: peginQuoteMock.quote.gasFee,
      decimals: 0,
      type: 'Fixed',
      description: 'Service fee. Pays for the cost of making transactions on behalf of the user',
      unit: 'Wei'
    }))
  })

  test('include service fee if pegout quote is provided', async () => {
    const metadata = await getMetadata(providerMock, lbcMock, null, pegoutQuoteMock)
    expect(serializer.stringify(metadata.at(1)?.fees.at(2))).toEqual(serializer.stringify({
      amount: pegoutQuoteMock.quote.gasFee,
      decimals: 0,
      type: 'Fixed',
      description: 'Service fee. Pays for the cost of making transactions on behalf of the user',
      unit: 'Wei'
    }))
  })
})
