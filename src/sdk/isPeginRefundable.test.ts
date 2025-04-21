import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { isPeginRefundable, type IsPeginRefundableParams } from './isPeginRefundable'
import { isPeginQuotePaid } from './isPeginQuotePaid'
import { type HttpClient, type BlockchainConnection, type TxResult, BridgeError } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider, type Quote } from '../api'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverErrors } from '../constants/errors'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { getRawTxWithoutWitnesses } from '../bitcoin/utils'

jest.mock('./isPeginQuotePaid')
const mockedIsPeginQuotePaid = isPeginQuotePaid as jest.Mock<typeof isPeginQuotePaid>

jest.mock('../bitcoin/utils')
const mockedGetRawTxWithoutWitnesses = getRawTxWithoutWitnesses as jest.Mock<typeof getRawTxWithoutWitnesses>

describe('isPeginRefundable function should', () => {
  const MOCK_QUOTE_HASH = '6967171f47cfc1dc6e165e09daae7ecb593bbf8b03ed4463214c1fd92ab985a3'
  const MOCK_BTC_TX_HASH = '6f32f9a0a59b2d206de4825e0dfcd62466518375297d7f047bf370547e1df799'
  const MOCK_PROVIDER_SIGNATURE = '2cedf2bc10bcb3f8bf76805a38fd7ea4449a78d77e9ebc4670cd259e6936cf96499567c329c7eb8ee9e4d6f6fb0037bf601cc7a775237421e18726f4bea2d4c41c'

  const MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES = '0200000001c28de5e598a6295c32ca8a66ade34b109cde5da35f3c0a7e961ff24e5946769f000000006a47304402206554949e196e72941841d64e256d657f694d77d35898a8a1f80f31f4f5e4fa7c02202f30c06793900ac9e4d0fa01f961e7549bf18067272d66bd3621f59431c4150801210374116b9b59b002fa1b97001f77f1f14963b0b9a4523d3fd2ddeed9d5d5c5b1b1fdffffff02801d2c040000000017a914f198a0f0c25b7dcf771aaf4a13052debe9e7e9e4871ae40270020000001976a914315a8bc14efd6ce2404c3a9e76875e3d1c0cb17288acfdea0000'

  const MOCK_BLOCK_HEIGHT = 750000
  const MOCK_TRANSACTION_HASHES = [
    'da3ec47d86e09c18c298beb42306dcbb3ed5353ac9d09e2fdce5df6958f68ce2',
    MOCK_BTC_TX_HASH,
    'a0d98152130105fd0bb9442d2f13d2e46c33bcf64dd9917c3c88a343aea1389e'
  ]

  const mockPartialMarkleTree = {
    totalTX: 3,
    hashes: MOCK_TRANSACTION_HASHES,
    flags: 11,
    hex: '0300000003e28cf65869dfe5dc2f9ed0c93a35d53ebbdc0623b4be98c2189ce0867dc43eda99f71d7e5470f37b047f7d297583516624d6fc0d5e82e46d202d9ba5a0f9326f1746c3fe9334ffe54d4106f6637eae2476db38b8bc8174c803c0840862e524bf010b'
  }

  /* eslint-disable @typescript-eslint/consistent-type-assertions */
  const mockHttpClient: HttpClient = {
    async get<M>(_url: string) {
      return Promise.resolve({} as M)
    }
  } as HttpClient

  const mockLiquidityProvider: LiquidityProvider = {
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
      requiredConfirmations: 5,
      feePercentage: 1,
      fixedFee: BigInt(1)
    },
    pegout: {
      minTransactionValue: BigInt(1),
      maxTransactionValue: BigInt(100),
      fee: BigInt(1),
      requiredConfirmations: 5,
      feePercentage: 1,
      fixedFee: BigInt(1)
    }
  }

  const mockQuote: Quote = {
    quote: {
      fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
      lbcAddr: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
      lpRSKAddr: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      btcRefundAddr: 'mfWxJ45yp2SFn7UciZyNpvDKrzbhyfKrY8',
      rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      lpBTCAddr: 'n1jGDaxCW6jemLZyd9wmDHddseZwEMV9C6',
      callFee: BigInt('10000000000000000'),
      penaltyFee: BigInt('1000000000000000'),
      contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      data: '0x',
      gasLimit: 21000,
      nonce: BigInt('6620113352080757670'),
      value: BigInt('600000000000000000'),
      agreementTimestamp: 1742728134,
      timeForDeposit: 20,
      lpCallTime: 7200,
      confirmations: 10,
      callOnRegister: false,
      gasFee: BigInt(0),
      productFeeAmount: BigInt(0)
    },
    quoteHash: MOCK_QUOTE_HASH
  }

  const mockRskConnection = {} as BlockchainConnection

  const mockBtcDataSource: BitcoinDataSource = {
    getBlockFromTransaction: jest.fn()
  } as unknown as BitcoinDataSource

  const mockLiquidityBridgeContract: LiquidityBridgeContract = {
    registerPegin: jest.fn()
  } as unknown as LiquidityBridgeContract & { registerPegin: jest.Mock }

  const mockFlyoverContext: FlyoverSDKContext = {
    httpClient: mockHttpClient,
    provider: mockLiquidityProvider,
    btcConnection: mockBtcDataSource,
    rskConnection: mockRskConnection,
    lbc: mockLiquidityBridgeContract
  } as unknown as FlyoverSDKContext

  const params: IsPeginRefundableParams = {
    quote: mockQuote,
    providerSignature: MOCK_PROVIDER_SIGNATURE,
    btcTransactionHash: MOCK_BTC_TX_HASH
  }

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(mockBtcDataSource, 'getBlockFromTransaction').mockImplementation(async () => Promise.resolve({
      hash: '070974fee1c3c07920a92185d5749fd85cb35f8460d03554312ec4425367e6ae',
      height: MOCK_BLOCK_HEIGHT,
      transactionHashes: MOCK_TRANSACTION_HASHES
    }))
    mockedIsPeginQuotePaid.mockResolvedValue({ isPaid: false })
    jest.spyOn(mockLiquidityBridgeContract, 'registerPegin').mockImplementation(async () => Promise.resolve({} as unknown as TxResult))
    mockedGetRawTxWithoutWitnesses.mockImplementation(async () => Promise.resolve(MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES))
  })

  test('return isRefundable true when all conditions are met', async () => {
    const result = await isPeginRefundable(params, mockFlyoverContext)

    expect(result.isRefundable).toBe(true)
    expect(result.error).toBeUndefined()

    expect(mockedIsPeginQuotePaid).toHaveBeenCalledWith(
      MOCK_QUOTE_HASH,
      expect.objectContaining({
        httpClient: mockHttpClient,
        provider: mockLiquidityProvider,
        rskConnection: mockRskConnection
      })
    )

    expect(mockBtcDataSource.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)

    expect(mockLiquidityBridgeContract.registerPegin).toHaveBeenCalledWith(
      {
        quote: mockQuote,
        signature: MOCK_PROVIDER_SIGNATURE,
        btcRawTransaction: MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES,
        partialMerkleTree: mockPartialMarkleTree.hex,
        height: MOCK_BLOCK_HEIGHT
      },
      'staticCall'
    )
  })

  test('return isRefundable true when all conditions are met and transaction is segwit', async () => {
    const BTC_SEGWIT_TX_WITHOUT_WITNESS = '0200000001a9e61da524cda1fbcb5bf3d1d56742ba428c78953a819f449308ee46a2c993b50000000000fdffffff02579e6e37000000001976a914dbda47554dfea08a410dd3c8759016c8d6beeb1c88ac801d2c040000000017a914580cefdaba82ab09da80c83f2d1cf113e1794df887e9f10000'

    mockedGetRawTxWithoutWitnesses.mockImplementation(async () => Promise.resolve(BTC_SEGWIT_TX_WITHOUT_WITNESS))

    const result = await isPeginRefundable(params, mockFlyoverContext)

    expect(result.isRefundable).toBe(true)
    expect(result.error).toBeUndefined()

    expect(mockedIsPeginQuotePaid).toHaveBeenCalledWith(
      MOCK_QUOTE_HASH,
      expect.objectContaining({
        httpClient: mockHttpClient,
        provider: mockLiquidityProvider,
        rskConnection: mockRskConnection
      })
    )

    expect(mockBtcDataSource.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)

    expect(mockLiquidityBridgeContract.registerPegin).toHaveBeenCalledWith(
      {
        quote: mockQuote,
        signature: MOCK_PROVIDER_SIGNATURE,
        btcRawTransaction: BTC_SEGWIT_TX_WITHOUT_WITNESS,
        partialMerkleTree: mockPartialMarkleTree.hex,
        height: MOCK_BLOCK_HEIGHT
      },
      'staticCall'
    )
  })

  test('return isRefundable false when quote is already paid', async () => {
    mockedIsPeginQuotePaid.mockResolvedValue({ isPaid: true })

    const result = await isPeginRefundable(params, mockFlyoverContext)

    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_IN_REFUND_ALREADY_PAID)

    expect(mockedIsPeginQuotePaid).toHaveBeenCalledWith(
      MOCK_QUOTE_HASH,
      expect.objectContaining({
        httpClient: mockHttpClient,
        provider: mockLiquidityProvider,
        rskConnection: mockRskConnection
      })
    )

    expect(mockBtcDataSource.getBlockFromTransaction).not.toHaveBeenCalled()
    expect(mockLiquidityBridgeContract.registerPegin).not.toHaveBeenCalled()
  })

  test('return isRefundable false when transaction does not have enough confirmations', async () => {
    const mockError = {
      timestamp: 1742728134,
      recoverable: true,
      message: 'VM Exception while processing transaction: revert LBC031',
      serverUrl: 'http://localhost:8080',
      details: {
        error: {
          message: 'VM Exception while processing transaction: revert LBC031'
        }
      }
    }

    jest.spyOn(mockLiquidityBridgeContract, 'registerPegin').mockImplementation(async () => { throw new BridgeError(mockError) })

    const result = await isPeginRefundable(params, mockFlyoverContext)

    expect(result.isRefundable).toBe(false)
    expect(result.error).toBe(FlyoverErrors.PEG_IN_REFUND_DOES_NOT_HAVE_ENOUGH_CONFIRMATIONS)

    expect(mockedIsPeginQuotePaid).toHaveBeenCalledWith(
      MOCK_QUOTE_HASH,
      expect.objectContaining({
        httpClient: mockHttpClient,
        provider: mockLiquidityProvider,
        rskConnection: mockRskConnection
      })
    )

    expect(mockBtcDataSource.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)

    expect(mockLiquidityBridgeContract.registerPegin).toHaveBeenCalledWith(
      {
        quote: mockQuote,
        signature: MOCK_PROVIDER_SIGNATURE,
        btcRawTransaction: MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES,
        partialMerkleTree: mockPartialMarkleTree.hex,
        height: MOCK_BLOCK_HEIGHT
      },
      'staticCall'
    )
  })

  test('return isRefundable false when registerPegin fails with non-LBC031 error', async () => {
    const mockError = {
      timestamp: 1742728134,
      recoverable: true,
      message: 'VM Exception while processing transaction: revert Some other error',
      serverUrl: 'http://localhost:8080',
      details: {
        error: {
          message: 'VM Exception while processing transaction: revert Some other error'
        }
      }
    }

    jest.spyOn(mockLiquidityBridgeContract, 'registerPegin').mockImplementation(async () => { throw new BridgeError(mockError) })

    const result = await isPeginRefundable(params, mockFlyoverContext)

    expect(result.isRefundable).toBe(false)
    expect(result.error).toEqual({
      ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
      detail: mockError.details.error.message
    })

    expect(mockedIsPeginQuotePaid).toHaveBeenCalledWith(
      MOCK_QUOTE_HASH,
      expect.objectContaining({
        httpClient: mockHttpClient,
        provider: mockLiquidityProvider,
        rskConnection: mockRskConnection
      })
    )

    expect(mockBtcDataSource.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)

    expect(mockLiquidityBridgeContract.registerPegin).toHaveBeenCalledWith(
      {
        quote: mockQuote,
        signature: MOCK_PROVIDER_SIGNATURE,
        btcRawTransaction: MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES,
        partialMerkleTree: mockPartialMarkleTree.hex,
        height: MOCK_BLOCK_HEIGHT
      },
      'staticCall'
    )
  })

  test('return isRefundable false when registerPegin fails with unknown error structure', async () => {
    const MOCK_ERROR_MESSAGE = 'Unknown error'
    jest.spyOn(mockLiquidityBridgeContract, 'registerPegin').mockImplementation(async () => { throw new Error(MOCK_ERROR_MESSAGE) })

    const result = await isPeginRefundable(params, mockFlyoverContext)

    expect(result.isRefundable).toBe(false)
    expect(result.error).toEqual({
      ...FlyoverErrors.PEG_IN_REFUND_CALL_TO_REGISTER_PEGIN_FAILED,
      detail: new Error(MOCK_ERROR_MESSAGE)
    })

    expect(mockedIsPeginQuotePaid).toHaveBeenCalledWith(
      MOCK_QUOTE_HASH,
      expect.objectContaining({
        httpClient: mockHttpClient,
        provider: mockLiquidityProvider,
        rskConnection: mockRskConnection
      })
    )

    expect(mockBtcDataSource.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)

    expect(mockLiquidityBridgeContract.registerPegin).toHaveBeenCalledWith(
      {
        quote: mockQuote,
        signature: MOCK_PROVIDER_SIGNATURE,
        btcRawTransaction: MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES,
        partialMerkleTree: mockPartialMarkleTree.hex,
        height: MOCK_BLOCK_HEIGHT
      },
      'staticCall'
    )
  })

  test('throw error when btcConnection in context is undefined or null', async () => {
    // Test with undefined btcConnection
    const contextWithUndefinedBtcConnection = {
      ...mockFlyoverContext,
      btcConnection: undefined
    } as unknown as FlyoverSDKContext

    await expect(isPeginRefundable(
      params,
      contextWithUndefinedBtcConnection
    )).rejects.toThrow('Bitcoin connection is required')

    // Test with null btcConnection
    const contextWithNullBtcConnection = {
      ...mockFlyoverContext,
      btcConnection: null
    } as unknown as FlyoverSDKContext

    await expect(isPeginRefundable(
      params,
      contextWithNullBtcConnection
    )).rejects.toThrow('Bitcoin connection is required')
  })

  test('throw error when lbc in context is undefined or null', async () => {
    // Test with undefined lbc
    const contextWithUndefinedLbc = {
      ...mockFlyoverContext,
      lbc: undefined
    } as unknown as FlyoverSDKContext

    await expect(isPeginRefundable(
      params,
      contextWithUndefinedLbc
    )).rejects.toThrow('Liquidity bridge contract is required')

    // Test with null lbc
    const contextWithNullLbc = {
      ...mockFlyoverContext,
      lbc: null
    } as unknown as FlyoverSDKContext

    await expect(isPeginRefundable(
      params,
      contextWithNullLbc
    )).rejects.toThrow('Liquidity bridge contract is required')
  })
})
