import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { isPeginQuotePaid } from './isPeginQuotePaid'
import { getPeginStatus } from './getPeginStatus'
import { type HttpClient, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { FlyoverErrors } from '../constants/errors'
import type { PeginQuoteStatus, LiquidityProvider, QuoteDetail, PeginQuoteStatusDetail, PeginCreationData } from '../api'
import { type FlyoverSDKContext } from '../utils/interfaces'

jest.mock('./getPeginStatus')
const mockedGetPeginStatus = getPeginStatus as jest.Mock<typeof getPeginStatus>

jest.mock('ethers', () => {
  return {
    __esModule: true,
    utils: {
      Interface: jest.fn().mockImplementation(() => ({
        parseLog: jest.fn().mockImplementation((log: any) => {
          // Check the log position and return a parsed log to make it more realistic
          if (log.logIndex === 0) {
            return parsedFirstLog
          } else if (log.logIndex === 1) {
            return parsedSecondLog
          } else if (log.logIndex === 2) {
            return parsedThirdLog
          }
          return null
        })
      }))
    }
  }
})

const FAKE_QUOTE_HASH = '8ea2608fbeac552d2a5ea9254f2abe6bac37d845c41af7c27041d3117fd5b530'
const FAKE_CALL_FOR_USER_TX_HASH = '0x3ba2b1337bda32785d38c53274ddeac570911c69aed5ee7ed74e7b14fd5d87a6'

const parsedFirstLog =
{
  name: 'BalanceIncrease',
  signature: 'BalanceIncrease(address,uint256)',
  topic: '0x42cfb81a915ac5a674852db250bf722637bee705a267633b68cab3a2dde06f53',
  args: {
    dest: '0x9D93929A9099be4355fC2389FbF253982F9dF47c'
  }
}

const parsedSecondLog = {
  name: 'BalanceDecrease',
  signature: 'BalanceDecrease(address,uint256)',
  topic: '0x8e51a4493a6f66c76e13fd9e3b754eafbfe21343c04508deb61be8ccc0064587',
  args: {
    dest: '0x9D93929A9099be4355fC2389FbF253982F9dF47c'
  }
}

const parsedThirdLog = {
  name: 'CallForUser',
  signature: 'CallForUser(address,address,uint256,uint256,bytes,bool,bytes32)',
  topic: '0xbfc7404e6fe464f0646fe2c6ab942b92d56be722bb39f8c6bc4830d2d32fb80d',
  args: {
    from: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    dest: '0x79568c2989232dCa1840087D73d403602364c0D4',
    gasLimit: '21000',
    value: '600000000000000000',
    data: '',
    success: true,
    quoteHash: FAKE_QUOTE_HASH
  }
}

/* eslint-disable @typescript-eslint/consistent-type-assertions */
const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  }
} as HttpClient
/* eslint-enable @typescript-eslint/consistent-type-assertions */

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  apiBaseUrl: 'http://localhost:8080',
  name: 'any name',
  status: true,
  providerType: 'pegin',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(1),
    feePercentage: 0.01,
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(1),
    feePercentage: 0.01,
    requiredConfirmations: 5
  }
}

const mockPeginQuoteDTO: QuoteDetail = {
  agreementTimestamp: 1234567890,
  btcRefundAddr: 'btcAddress',
  callFee: BigInt(1000),
  callOnRegister: false,
  confirmations: 10,
  contractAddr: '0xcontract',
  data: '',
  fedBTCAddr: 'fedAddress',
  gasFee: BigInt(0),
  gasLimit: 21000,
  lbcAddr: '0xlbc',
  lpBTCAddr: 'lpBtcAddress',
  lpCallTime: 7200,
  lpRSKAddr: '0xlpRsk',
  nonce: BigInt(12345),
  penaltyFee: BigInt(1000),
  productFeeAmount: BigInt(0),
  rskRefundAddr: '0xrefund',
  timeForDeposit: 3600,
  value: BigInt(600000000000000000)
}

const mockPeginQuoteStatusWithCallForUserTxHash: PeginQuoteStatusDetail = {
  callForUserTxHash: FAKE_CALL_FOR_USER_TX_HASH,
  depositAddress: 'depositAddress',
  quoteHash: FAKE_QUOTE_HASH,
  registerPeginTxHash: '',
  requiredLiquidity: '600000000000000000',
  signature: 'signature',
  state: 'CallForUserSucceeded',
  userBtcTxHash: ''
}

const mockPeginQuoteStatusWithoutCallForUserTxHash: PeginQuoteStatusDetail = {
  callForUserTxHash: '',
  depositAddress: 'depositAddress',
  quoteHash: FAKE_QUOTE_HASH,
  registerPeginTxHash: '',
  requiredLiquidity: '600000000000000000',
  signature: 'signature',
  state: 'WaitingForDeposit',
  userBtcTxHash: ''
}

const peginCreationDataMock: PeginCreationData = {
  fixedFee: BigInt(3),
  feePercentage: 1.25,
  gasPrice: BigInt(1)
}

const mockPeginStatusWithTxHash: PeginQuoteStatus = {
  detail: mockPeginQuoteDTO,
  status: mockPeginQuoteStatusWithCallForUserTxHash,
  creationData: peginCreationDataMock
}

const mockPeginStatusWithoutTxHash: PeginQuoteStatus = {
  detail: mockPeginQuoteDTO,
  status: mockPeginQuoteStatusWithoutCallForUserTxHash,
  creationData: peginCreationDataMock
}

const mockTxCallForUserReceipt = {
  to: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
  from: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  logs: [
    {
      transactionIndex: 0,
      blockNumber: 106,
      transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
      address: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
      topics: [
        '0x42cfb81a915ac5a674852db250bf722637bee705a267633b68cab3a2dde06f53'
      ],
      data: '0x0000000000000000000000009d93929a9099be4355fc2389fbf253982f9df47c0000000000000000000000000000000000000000000000000000000000000000',
      logIndex: 0,
      blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02'
    },
    {
      transactionIndex: 0,
      blockNumber: 106,
      transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
      address: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
      topics: [
        '0x8e51a4493a6f66c76e13fd9e3b754eafbfe21343c04508deb61be8ccc0064587'
      ],
      data: '0x0000000000000000000000009d93929a9099be4355fc2389fbf253982f9df47c0000000000000000000000000000000000000000000000000853a0d2313c0000',
      logIndex: 1,
      blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02'
    },
    {
      transactionIndex: 0,
      blockNumber: 106,
      transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
      address: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
      topics: [
        '0xbfc7404e6fe464f0646fe2c6ab942b92d56be722bb39f8c6bc4830d2d32fb80d',
        '0x0000000000000000000000009d93929a9099be4355fc2389fbf253982f9df47c',
        '0x00000000000000000000000079568c2989232dca1840087d73d403602364c0d4'
      ],
      data: '0x00000000000000000000000000000000000000000000000000000000000052080000000000000000000000000000000000000000000000000853a0d2313c000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001618fef93a5054540f96de994b9d255ae1b2a79ca9fb45d629727c74807986bdc0000000000000000000000000000000000000000000000000000000000000000',
      logIndex: 2,
      blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02'
    }
  ]
}

const mockConnectionWithReceipt = {
  getTransactionReceipt: jest.fn().mockImplementation(async () => Promise.resolve(mockTxCallForUserReceipt)),
  signer: {} as any
} as unknown as BlockchainConnection

const mockConnectionWithoutReceipt = {
  getTransactionReceipt: jest.fn().mockImplementation(async () => Promise.resolve(null)),
  signer: {} as any
} as unknown as BlockchainConnection

let mockFlyoverContext: FlyoverSDKContext

describe('isQuotePaid function should', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockFlyoverContext = {
      httpClient: mockClient,
      provider: providerMock,
      rskConnection: mockConnectionWithReceipt
    } as unknown as FlyoverSDKContext
  })

  test('return isPaid true when quote is paid', async () => {
    mockedGetPeginStatus.mockResolvedValue(mockPeginStatusWithTxHash)

    const result = await isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      mockFlyoverContext
    )

    expect(result.isPaid).toBe(true)
    expect(result.error).toBeUndefined()
    expect(getPeginStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
    expect(mockConnectionWithReceipt.getTransactionReceipt).toHaveBeenCalledWith(FAKE_CALL_FOR_USER_TX_HASH)
  })

  test('return isPaid false when LPS does not return quote status', async () => {
    // Mock the implementation of getPeginStatus to always reject
    const error = new Error('API error')
    mockedGetPeginStatus.mockImplementation(async () => Promise.reject(error))

    // Mock setTimeout to execute immediately
    const originalSetTimeout = global.setTimeout
    global.setTimeout = function (callback: (...args: any[]) => void, _timeout?: number) {
      callback()
      return 0 as any
    } as typeof global.setTimeout

    const result = await isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      mockFlyoverContext
    )

    // Restore original function
    global.setTimeout = originalSetTimeout

    expect(result.isPaid).toBe(false)
    expect(result.error).toStrictEqual({ ...FlyoverErrors.LPS_DID_NOT_RETURN_QUOTE_STATUS, detail: error })
  })

  test('return isPaid false when pegin status does not have callForUserTxHash', async () => {
    mockedGetPeginStatus.mockResolvedValue(mockPeginStatusWithoutTxHash)

    const result = await isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      mockFlyoverContext
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toStrictEqual(FlyoverErrors.QUOTE_STATUS_DOES_NOT_HAVE_A_CALL_FOR_USER_TX_HASH)
  })

  test('return isPaid false when transaction receipt is not found', async () => {
    mockedGetPeginStatus.mockResolvedValue(mockPeginStatusWithTxHash)

    const contextWithoutReceipt = {
      ...mockFlyoverContext,
      rskConnection: mockConnectionWithoutReceipt
    } as unknown as FlyoverSDKContext

    const result = await isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      contextWithoutReceipt
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toBe(FlyoverErrors.QUOTE_STATUS_TRANSACTION_NOT_FOUND)
  })

  test('return isPaid false when recipt does not have a callForUser event', async () => {
    mockedGetPeginStatus.mockResolvedValue(mockPeginStatusWithTxHash)
    parsedThirdLog.name = undefined as unknown as string

    const result = await isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      mockFlyoverContext
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toBe(FlyoverErrors.QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_CALL_FOR_USER_EVENT)

    parsedThirdLog.name = 'CallForUser'
  })

  test('return isPaid false when recipt has a callForUser event but the quote hash does not match', async () => {
    mockedGetPeginStatus.mockResolvedValue(mockPeginStatusWithTxHash)
    parsedThirdLog.args.quoteHash = 'different-hash'

    const result = await isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      mockFlyoverContext
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toBe(FlyoverErrors.QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_CALL_FOR_USER_EVENT)

    parsedThirdLog.args.quoteHash = FAKE_QUOTE_HASH
  })

  test('handle 0x prefix in quote hash correctly', async () => {
    mockedGetPeginStatus.mockResolvedValue(mockPeginStatusWithTxHash)

    const result = await isPeginQuotePaid(
      '0x' + FAKE_QUOTE_HASH,
      mockFlyoverContext
    )

    expect(result.isPaid).toBe(true)
    expect(result.error).toBeUndefined()

    parsedThirdLog.args.quoteHash = '0x' + FAKE_QUOTE_HASH

    const result2 = await isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      mockFlyoverContext
    )

    expect(result2.isPaid).toBe(true)
    expect(result2.error).toBeUndefined()

    parsedThirdLog.args.quoteHash = FAKE_QUOTE_HASH
  })

  test('throw error when httpClient in context is not defined', async () => {
    // Test with undefined httpClient
    const contextWithUndefinedClient = {
      ...mockFlyoverContext,
      httpClient: undefined
    } as unknown as FlyoverSDKContext

    await expect(isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      contextWithUndefinedClient
    )).rejects.toThrow('HTTP client is required')

    // Test with null httpClient
    const contextWithNullClient = {
      ...mockFlyoverContext,
      httpClient: null
    } as unknown as FlyoverSDKContext

    await expect(isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      contextWithNullClient
    )).rejects.toThrow('HTTP client is required')
  })

  test('throw error when provider in context is not defined', async () => {
    // Test with undefined provider
    const contextWithUndefinedProvider = {
      ...mockFlyoverContext,
      provider: undefined
    } as unknown as FlyoverSDKContext

    await expect(isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      contextWithUndefinedProvider
    )).rejects.toThrow('Provider is required')

    // Test with null provider
    const contextWithNullProvider = {
      ...mockFlyoverContext,
      provider: null
    } as unknown as FlyoverSDKContext

    await expect(isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      contextWithNullProvider
    )).rejects.toThrow('Provider is required')
  })

  test('throw error when rskConnection in context is not defined', async () => {
    // Test with undefined rskConnection
    const contextWithUndefinedConnection = {
      ...mockFlyoverContext,
      rskConnection: undefined
    } as unknown as FlyoverSDKContext

    await expect(isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      contextWithUndefinedConnection
    )).rejects.toThrow('RSK connection is required')

    // Test with null rskConnection
    const contextWithNullConnection = {
      ...mockFlyoverContext,
      rskConnection: null
    } as unknown as FlyoverSDKContext

    await expect(isPeginQuotePaid(
      FAKE_QUOTE_HASH,
      contextWithNullConnection
    )).rejects.toThrow('RSK connection is required')
  })
})
