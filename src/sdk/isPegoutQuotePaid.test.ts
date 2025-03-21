import { getPegoutStatus } from './getPegoutStatus'
import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { isPegoutQuotePaid } from './isPegoutQuotePaid'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider } from '../api'
import { type BitcoinDataSource, type BitcoinTransaction, type BitcoinTransactionOutput } from '../bitcoin/BitcoinDataSource'
import { FlyoverErrors } from '../constants/errors'
import { type FlyoverSDKContext } from '../utils/interfaces'

const FAKE_QUOTE_HASH = '733f96c67bc6d4086ed710714c36cf6d31b526b7ceb321d56ac52e721e8e97ff'
const FAKE_LP_BTC_TX_HASH = '81d20ff8f2f961ce88aeceeb2d859287bcd6ebba2ef532e7d083100a52faad87'
const QUOTE_VALUE_IN_SATS = 60_000_000

jest.mock('./getPegoutStatus')
const mockedGetPegoutStatus = getPegoutStatus as jest.Mock

/* eslint-disable @typescript-eslint/consistent-type-assertions */
const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  }
} as unknown as HttpClient

// Create mock provider
const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  apiBaseUrl: 'http://localhost:8080',
  name: 'any name',
  status: true,
  providerType: 'pegout',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    requiredConfirmations: 5
  }
}

// Success case of the getPegoutStatus mock
const mockPegoutStatusWithTxHash = {
  detail: {
    lbcAddress: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
    liquidityProviderRskAddress: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
    btcRefundAddress: 'mni1YpzHTXrrTtP2AVzwzdkTY6ni5uhJ3U',
    rskRefundAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
    lpBtcAddr: 'n1jGDaxCW6jemLZyd9wmDHddseZwEMV9C6',
    callFee: '10000000000000000',
    penaltyFee: '1000000000000000',
    nonce: '208229012703455860',
    depositAddr: 'mni1YpzHTXrrTtP2AVzwzdkTY6ni5uhJ3U',
    value: '600000000000000000',
    agreementTimestamp: 1741349875,
    depositDateLimit: 1741349925,
    depositConfirmations: 20,
    transferConfirmations: 10,
    transferTime: 50,
    expireDate: 1741360675,
    expireBlocks: 11202,
    gasFee: 67250000000000,
    productFeeAmount: 0
  },
  status: {
    quoteHash: FAKE_QUOTE_HASH,
    signature: '56ac8e3685f9b2c6de392243aca5648773fd2504514f446e934768a0ad839a2d0faf272a896dcdb4063fd51807f33bf10cdeb3826ea2081fa8296017c23e490e1c',
    depositAddress: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
    requiredLiquidity: '600067250000000000',
    state: 'SendPegoutSucceeded',
    userRskTxHash: '0xd35725566529453419980a1bd80c412c283a57553ea2c3c512e91dbc93bad5b3',
    lpBtcTxHash: FAKE_LP_BTC_TX_HASH,
    refundPegoutTxHash: '',
    bridgeRefundTxHash: ''
  }
}

const mockBitcoinTransaction: BitcoinTransaction = {
  txid: FAKE_LP_BTC_TX_HASH,
  isConfirmed: true,
  vout: [
    {
      valueInSats: QUOTE_VALUE_IN_SATS,
      hex: '76a9144ee02c481e6484c57f47321cec042f38054d82d688ac'
    },
    {
      valueInSats: 0,
      hex: `6a20${FAKE_QUOTE_HASH}`
    },
    {
      valueInSats: 4039892400,
      hex: '76a914ddb677f36498f7a4901a74e882df68fd00cf473588ac'
    }
  ]
}

const mockBitcoinDataSource: BitcoinDataSource = jest.mocked({
  getTransaction: jest.fn().mockImplementation(async () => Promise.resolve(mockBitcoinTransaction))
} as BitcoinDataSource)

const contextMock: FlyoverSDKContext = {
  btcConnection: mockBitcoinDataSource,
  provider: providerMock,
  httpClient: mockClient
} as FlyoverSDKContext

describe('isPegoutQuotePaid function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetPegoutStatus.mockImplementation(async () => Promise.resolve(mockPegoutStatusWithTxHash))
  })

  test('should return true if the quote is paid', async () => {
    jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () => Promise.resolve(mockBitcoinTransaction))

    const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)
    expect(result.isPaid).toBe(true)
    expect(result.error).not.toBeDefined()
  })

  test('should return isPaid false when LPS does not return quote status', async () => {
    // Mock the implementation of getPegoutStatus to always reject
    const error = new Error('API error')
    mockedGetPegoutStatus.mockImplementation(async () => Promise.reject(error))

    // Mock setTimeout to execute immediately
    const originalSetTimeout = global.setTimeout
    global.setTimeout = function (callback: (...args: any[]) => void, _timeout?: number) {
      callback()
      return 0 as any
    } as typeof global.setTimeout

    const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

    expect(result.isPaid).toBe(false)
    expect(result.error).toStrictEqual({
      ...FlyoverErrors.LPS_DID_NOT_RETURN_QUOTE_STATUS,
      detail: error
    })

    // Restore original function
    global.setTimeout = originalSetTimeout
  })

  test('should return isPaid false when pegout status does not have lpBtcTxHash', async () => {
    // Create a mock status without lpBtcTxHash
    const mockPegoutStatusWithoutTxHash = {
      detail: {
        ...mockPegoutStatusWithTxHash.detail
      },
      status: {
        ...mockPegoutStatusWithTxHash.status,
        state: 'WaitingForDeposit',
        userRskTxHash: '',
        lpBtcTxHash: '',
        refundPegoutTxHash: '',
        bridgeRefundTxHash: ''
      }
    }

    // Mock getPegoutStatus to return a status without lpBtcTxHash
    mockedGetPegoutStatus.mockImplementation(async () => Promise.resolve(mockPegoutStatusWithoutTxHash))

    const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

    expect(result.isPaid).toBe(false)
    expect(result.error).toBe(FlyoverErrors.QUOTE_STATUS_DOES_NOT_HAVE_A_PEGOUT_TX_HASH)
    expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
    expect(mockBitcoinDataSource.getTransaction).not.toHaveBeenCalled()
  })

  describe('isBtcTransactionValid validation cases', () => {
    test('should return isPaid false when bitcoinDataSource is not defined', async () => {
      const context = { ...contextMock }
      context.btcConnection = undefined
      const result = await isPegoutQuotePaid(context, FAKE_QUOTE_HASH)

      expect(result.isPaid).toBe(false)
      expect(result.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error('Flyover is not connected to Bitcoin')
      })
    })

    test('should return isPaid false when transaction is not confirmed', async () => {
      const unconfirmedTransaction = {
        ...mockBitcoinTransaction,
        isConfirmed: false
      }
      jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () =>
        Promise.resolve(unconfirmedTransaction)
      )

      const result2 = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

      expect(result2.isPaid).toBe(false)
      expect(result2.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error('Transaction is not confirmed')
      })
      expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
      expect(mockBitcoinDataSource.getTransaction).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
    })

    test('should return isPaid false when transaction does not have enough outputs', async () => {
      // Create a transaction with insufficient outputs
      const insufficientOutputsTransaction: BitcoinTransaction = {
        ...mockBitcoinTransaction,
        vout: [
          {
            valueInSats: 60000000,
            hex: '76a9144ee02c481e6484c57f47321cec042f38054d82d688ac'
          }
        ]
      }

      jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () =>
        Promise.resolve(insufficientOutputsTransaction)
      )

      const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

      expect(result.isPaid).toBe(false)
      expect(result.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error('Transaction does not have enough outputs')
      })
      expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
      expect(mockBitcoinDataSource.getTransaction).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
    })

    test('should return isPaid false when transaction value is less than quote value', async () => {
      // Create a transaction with insufficient value
      const insufficientValueTransaction: BitcoinTransaction = {
        ...mockBitcoinTransaction,
        vout: [
          {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ...mockBitcoinTransaction.vout[0]!,
            valueInSats: QUOTE_VALUE_IN_SATS - 1 // One satoshi less than required
          },
          mockBitcoinTransaction.vout[1] as BitcoinTransactionOutput,
          mockBitcoinTransaction.vout[2] as BitcoinTransactionOutput
        ]
      }

      jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () =>
        Promise.resolve(insufficientValueTransaction)
      )

      // Execute
      const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

      // Verify
      expect(result.isPaid).toBe(false)
      expect(result.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error('Transaction value is less than the quote value')
      })
      expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
      expect(mockBitcoinDataSource.getTransaction).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
    })

    test('should return isPaid false when second output (OP_RETURN candidate) does not exist', async () => {
      // Create a transaction with enough outputs but missing the second output
      const missingOpReturnTransaction: BitcoinTransaction = {
        ...mockBitcoinTransaction,
        vout: [mockBitcoinTransaction.vout[0] as BitcoinTransactionOutput,
          mockBitcoinTransaction.vout[2] as BitcoinTransactionOutput]
      }

      jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () =>
        Promise.resolve(missingOpReturnTransaction)
      )

      const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

      expect(result.isPaid).toBe(false)
      expect(result.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error('Transaction does not have a valid OP_RETURN output')
      })
      expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
      expect(mockBitcoinDataSource.getTransaction).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
    })

    test('should return isPaid false when second output is not a valid OP_RETURN', async () => {
      // Create a transaction with invalid OP_RETURN
      const invalidOpReturnTransaction: BitcoinTransaction = {
        ...mockBitcoinTransaction,
        vout: [
          mockBitcoinTransaction.vout[0] as BitcoinTransactionOutput,
          {
            ...mockBitcoinTransaction.vout[1] as BitcoinTransactionOutput,
            valueInSats: 1000 // Should be 0
          },
          mockBitcoinTransaction.vout[2] as BitcoinTransactionOutput
        ]
      }

      jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () =>
        Promise.resolve(invalidOpReturnTransaction)
      )

      const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

      expect(result.isPaid).toBe(false)
      expect(result.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error('Transaction does not have a valid OP_RETURN output')
      })
      expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
      expect(mockBitcoinDataSource.getTransaction).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
    })

    test('should return isPaid false when OP_RETURN does not contain the quote hash', async () => {
      // Create a transaction with wrong quote hash in OP_RETURN
      const wrongQuoteHashTransaction: BitcoinTransaction = {
        ...mockBitcoinTransaction,
        vout: [
          mockBitcoinTransaction.vout[0] as BitcoinTransactionOutput,
          {
            ...mockBitcoinTransaction.vout[1] as BitcoinTransactionOutput,
            hex: '6a20ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
          },
          mockBitcoinTransaction.vout[2] as BitcoinTransactionOutput
        ]
      }

      jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () =>
        Promise.resolve(wrongQuoteHashTransaction)
      )

      const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

      expect(result.isPaid).toBe(false)
      expect(result.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error('Transaction does not have a valid OP_RETURN output')
      })
      expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
      expect(mockBitcoinDataSource.getTransaction).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
    })

    test('should return isPaid false when getTransaction throws an error', async () => {
      // Mock getTransaction to throw an error
      const errorMessage = 'Failed to fetch transaction'
      jest.spyOn(mockBitcoinDataSource, 'getTransaction').mockImplementation(async () => {
        throw new Error(errorMessage)
      })

      const result = await isPegoutQuotePaid(contextMock, FAKE_QUOTE_HASH)

      expect(result.isPaid).toBe(false)
      expect(result.error).toStrictEqual({
        ...FlyoverErrors.LPS_BTC_TRANSACTION_IS_NOT_VALID,
        detail: new Error(`Failed to check OP_RETURN output: Error: ${errorMessage}`)
      })
      expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
      expect(mockBitcoinDataSource.getTransaction).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
    })
  })
})
