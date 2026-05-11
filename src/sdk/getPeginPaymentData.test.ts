import { describe, test, expect, jest } from '@jest/globals'
import {
  type Quote, type LiquidityProvider, type AcceptedQuote,
  quoteRequiredFields, quoteDetailRequiredFields, acceptQuoteRequiredFields, providerRequiredFields
} from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { getPeginPaymentData } from './getPeginPaymentData'

const VALID_EIP712_HASH = '0x85702c9a2cf27cda92c407fa8a495d489b4f06ff537bd576d67af802e289b3bb'

const quoteMock: Quote = {
  quote: {
    fedBTCAddr: 'any addres',
    lbcAddr: 'any addres',
    lpRSKAddr: 'any addres',
    btcRefundAddr: 'any addres',
    rskRefundAddr: 'any addres',
    lpBTCAddr: 'any addres',
    callFee: BigInt('100000000000000'),
    penaltyFee: BigInt(1),
    contractAddr: 'any addres',
    data: 'any data',
    gasLimit: 1,
    nonce: BigInt(1),
    gasFee: BigInt('1341211956000'),
    value: BigInt('8000000000000000'),
    agreementTimestamp: 1,
    timeForDeposit: 1,
    lpCallTime: 1,
    confirmations: 1,
    callOnRegister: true,
    chainId: 31,
  },
  quoteHash: 'a1a6210bc03964779067d5acf23e5076639e4621a500f8ef3f87861eaabdb6e7'
}

const acceptedQuoteMock: AcceptedQuote = {
  signature: '1d246d9e91d1b372d266678f9ce915522912d88c5ce918364b442702a0ef591274083f4af0f483a794a965e74cfcf76ace04067c0ffbf14862acbb5ab0a8ad5d1b',
  bitcoinDepositAddressHash: '2MxFSyNsUHreQedBqqk63J8qXwJPaswsjrn'
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35',
  apiBaseUrl: 'http://localhost:8081',
  name: 'any name',
  status: true,
  providerType: 'pegin',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  }
}

const lbcMock = {
  pegInContract: {
    validatePeginDepositAddress: jest.fn<(_q: Quote, _a: string) => Promise<boolean>>().mockResolvedValue(true),
    hashPeginQuoteEIP712: jest.fn<(_q: Quote) => Promise<string>>().mockResolvedValue(VALID_EIP712_HASH)
  }
} as unknown as LiquidityBridgeContract

describe('getPeginPaymentData function should', () => {
  test('return correct address from accepted quote', async () => {
    const result = await getPeginPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    expect(result.address).toBe(acceptedQuoteMock.bitcoinDepositAddressHash)
  })

  test('return amount in SAT by default', async () => {
    const result = await getPeginPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    const expectedWei = BigInt('100000000000000') + BigInt('1341211956000') + BigInt('8000000000000000')
    const expectedSat = expectedWei / (BigInt(10) ** BigInt(10))
    expect(result.amount).toBe(expectedSat.toString())
  })

  test('return amount in SAT when requested', async () => {
    const result = await getPeginPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock, { amountUnit: 'SAT' })
    const expectedWei = BigInt('100000000000000') + BigInt('1341211956000') + BigInt('8000000000000000')
    const expectedSat = expectedWei / (BigInt(10) ** BigInt(10))
    expect(result.amount).toBe(expectedSat.toString())
  })

  test('return amount in WEI when requested', async () => {
    const result = await getPeginPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock, { amountUnit: 'WEI' })
    const expectedWei = BigInt('100000000000000') + BigInt('1341211956000') + BigInt('8000000000000000')
    expect(result.amount).toBe(expectedWei.toString())
  })

  test('return amount in BTC when requested', async () => {
    const result = await getPeginPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock, { amountUnit: 'BTC' })
    expect(result.amount).toBe('0.00810134')
  })

  test('validate signature via EIP712 hash', async () => {
    await getPeginPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    expect(lbcMock.pegInContract.hashPeginQuoteEIP712).toHaveBeenCalledWith(quoteMock)
  })

  test('validate deposit address on chain', async () => {
    await getPeginPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    expect(lbcMock.pegInContract.validatePeginDepositAddress).toHaveBeenCalledWith(quoteMock, acceptedQuoteMock.bitcoinDepositAddressHash)
  })

  test('fail if signature is not valid', async () => {
    const otherProvider: LiquidityProvider = { ...providerMock, provider: '0xd6F117d8194Eba2fCA8bD63B2E259Dbea40E07d9' }
    await expect(getPeginPaymentData(lbcMock, otherProvider, quoteMock, acceptedQuoteMock))
      .rejects.toThrow('Invalid signature')
    await expect(getPeginPaymentData(lbcMock, otherProvider, quoteMock, acceptedQuoteMock))
      .rejects.toBeInstanceOf(FlyoverError)
  })

  test('fail if deposit address is not valid', async () => {
    const invalidLbc = {
      pegInContract: {
        validatePeginDepositAddress: jest.fn<(_q: Quote, _a: string) => Promise<boolean>>().mockResolvedValue(false),
        hashPeginQuoteEIP712: jest.fn<(_q: Quote) => Promise<string>>().mockResolvedValue(VALID_EIP712_HASH)
      }
    } as unknown as LiquidityBridgeContract
    await expect(getPeginPaymentData(invalidLbc, providerMock, quoteMock, acceptedQuoteMock))
      .rejects.toThrow('Invalid BTC address')
    await expect(getPeginPaymentData(invalidLbc, providerMock, quoteMock, acceptedQuoteMock))
      .rejects.toBeInstanceOf(FlyoverError)
  })

  test('fail on Quote missing properties', async () => {
    await expect(getPeginPaymentData(lbcMock, providerMock, {} as any, acceptedQuoteMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${quoteRequiredFields.join(', ')}`)
    await expect(getPeginPaymentData(lbcMock, providerMock, { quoteHash: 'any', quote: {} } as any, acceptedQuoteMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${quoteDetailRequiredFields.join(', ')}`)
  })

  test('fail on AcceptedQuote missing properties', async () => {
    await expect(getPeginPaymentData(lbcMock, providerMock, quoteMock, {} as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${acceptQuoteRequiredFields.join(', ')}`)
  })

  test('fail on Provider missing properties', async () => {
    await expect(getPeginPaymentData(lbcMock, {} as any, quoteMock, acceptedQuoteMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })
})
