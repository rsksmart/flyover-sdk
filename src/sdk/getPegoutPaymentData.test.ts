import { describe, test, expect, jest } from '@jest/globals'
import {
  type PegoutQuote, type LiquidityProvider, type AcceptedPegoutQuote,
  pegoutQuoteRequiredFields, pegoutQuoteDetailRequiredFields, providerRequiredFields
} from '../api'
import { AcceptPegoutResponseRequiredFields } from '../api/bindings/data-contracts'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { getPegoutPaymentData } from './getPegoutPaymentData'

const VALID_EIP712_HASH = '0x85702c9a2cf27cda92c407fa8a495d489b4f06ff537bd576d67af802e289b3bb'

const quoteMock: PegoutQuote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddress: '171gGjg8NeLUonNSrFmgwkgT1jgqzXR6QX',
    callFee: BigInt('100000000000000'),
    depositAddr: '171gGjg8NeLUonNSrFmgwkgT1jgqzXR6QX',
    depositConfirmations: 1,
    depositDateLimit: 1,
    expireBlocks: 1,
    expireDate: 1,
    gasFee: BigInt('1341211956000'),
    lbcAddress: '0xAA9cAf1e3967600578727F975F283446A3Da6612',
    liquidityProviderRskAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
    lpBtcAddr: '17kksixYkbHeLy9okV16kr4eAxVhFkRhP',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
    transferConfirmations: 1,
    transferTime: 1,
    value: BigInt('8000000000000000'),
    chainId: 31,
  },
  quoteHash: '8e7a1f104628f98780cb8ecf438534e9480b43525ede379995ee5838a407ef32'
}

const acceptedQuoteMock: AcceptedPegoutQuote = {
  signature: '1d246d9e91d1b372d266678f9ce915522912d88c5ce918364b442702a0ef591274083f4af0f483a794a965e74cfcf76ace04067c0ffbf14862acbb5ab0a8ad5d1b',
  lbcAddress: '0xAA9cAf1e3967600578727F975F283446A3Da6612'
}

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35',
  apiBaseUrl: 'http://localhost:8081',
  name: 'any name',
  status: true,
  providerType: 'pegout',
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
  pegOutContract: {
    hashPegoutQuoteEIP712: jest.fn<(_q: PegoutQuote) => Promise<string>>().mockResolvedValue(VALID_EIP712_HASH)
  }
} as unknown as LiquidityBridgeContract

describe('getPegoutPaymentData function should', () => {
  test('return correct to address from accepted quote', async () => {
    const result = await getPegoutPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    expect(result.to).toBe(acceptedQuoteMock.lbcAddress)
  })

  test('return correct value as total quote amount in wei', async () => {
    const result = await getPegoutPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    const expectedValue = BigInt('100000000000000') + BigInt('1341211956000') + BigInt('8000000000000000')
    expect(result.value).toBe(expectedValue)
  })

  test('return hex-encoded data with depositPegOut function selector', async () => {
    const result = await getPegoutPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    expect(result.data).toMatch(/^0x083bc4b2/)
  })

  test('validate signature via EIP712 hash', async () => {
    await getPegoutPaymentData(lbcMock, providerMock, quoteMock, acceptedQuoteMock)
    expect(lbcMock.pegOutContract.hashPegoutQuoteEIP712).toHaveBeenCalledWith(quoteMock)
  })

  test('fail if signature is not valid', async () => {
    const otherProvider: LiquidityProvider = { ...providerMock, provider: '0xd6F117d8194Eba2fCA8bD63B2E259Dbea40E07d9' }
    await expect(getPegoutPaymentData(lbcMock, otherProvider, quoteMock, acceptedQuoteMock))
      .rejects.toThrow('Invalid signature')
    await expect(getPegoutPaymentData(lbcMock, otherProvider, quoteMock, acceptedQuoteMock))
      .rejects.toBeInstanceOf(FlyoverError)
  })

  test('fail on PegoutQuote missing properties', async () => {
    await expect(getPegoutPaymentData(lbcMock, providerMock, {} as any, acceptedQuoteMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
    await expect(getPegoutPaymentData(lbcMock, providerMock, { quoteHash: 'any', quote: {} } as any, acceptedQuoteMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteDetailRequiredFields.join(', ')}`)
  })

  test('fail on AcceptedPegoutQuote missing properties', async () => {
    await expect(getPegoutPaymentData(lbcMock, providerMock, quoteMock, {} as any)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${AcceptPegoutResponseRequiredFields.join(', ')}`)
  })

  test('fail on Provider missing properties', async () => {
    await expect(getPegoutPaymentData(lbcMock, {} as any, quoteMock, acceptedQuoteMock))
      .rejects.toThrow(`Validation failed for object with following missing properties: ${providerRequiredFields.join(', ')}`)
  })
})
