import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { registerPegin, type RegisterPeginParams } from './registerPegin'
import { isPeginRefundable } from './isPeginRefundable'
import { type BlockchainConnection, type TxResult } from '@rsksmart/bridges-core-sdk'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { FlyoverErrors } from '../constants/errors'
import { getRawTxWithoutWitnesses } from '../bitcoin/utils'

jest.mock('./isPeginRefundable')
const mockedIsPeginRefundable = isPeginRefundable as jest.Mock<typeof isPeginRefundable>

jest.mock('../bitcoin/utils')
const mockedGetRawTxWithoutWitnesses = getRawTxWithoutWitnesses as jest.Mock<typeof getRawTxWithoutWitnesses>

describe('registerPegin function should', () => {
  const MOCK_RSK_ADDRESS = '0x79568c2989232dCa1840087D73d403602364c0D4'
  const MOCK_BTC_TX_HASH = '6f32f9a0a59b2d206de4825e0dfcd62466518375297d7f047bf370547e1df799'
  const MOCK_TX_HASH = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
  const MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES = '0200000001c28de5e598a6295c32ca8a66ade34b109cde5da35f3c0a7e961ff24e5946769f000000006a47304402206554949e196e72941841d64e256d657f694d77d35898a8a1f80f31f4f5e4fa7c02202f30c06793900ac9e4d0fa01f961e7549bf18067272d66bd3621f59431c4150801210374116b9b59b002fa1b97001f77f1f14963b0b9a4523d3fd2ddeed9d5d5c5b1b1fdffffff02801d2c040000000017a914f198a0f0c25b7dcf771aaf4a13052debe9e7e9e4871ae40270020000001976a914315a8bc14efd6ce2404c3a9e76875e3d1c0cb17288acfdea0000'

  const MOCK_BLOCK_HEIGHT = 750000
  const MOCK_TRANSACTION_HASHES = [
    'da3ec47d86e09c18c298beb42306dcbb3ed5353ac9d09e2fdce5df6958f68ce2',
    MOCK_BTC_TX_HASH,
    'a0d98152130105fd0bb9442d2f13d2e46c33bcf64dd9917c3c88a343aea1389e'
  ]

  const MOCK_PARTIAL_MARKLE_TREE = {
    totalTX: 3,
    hashes: MOCK_TRANSACTION_HASHES,
    flags: 11,
    hex: '0300000003e28cf65869dfe5dc2f9ed0c93a35d53ebbdc0623b4be98c2189ce0867dc43eda99f71d7e5470f37b047f7d297583516624d6fc0d5e82e46d202d9ba5a0f9326f1746c3fe9334ffe54d4106f6637eae2476db38b8bc8174c803c0840862e524bf010b'
  }

  const MOCK_RSK_CONNECTION = {} as BlockchainConnection

  const MOCK_BTC_DATA_SOURCE: BitcoinDataSource = {
    getBlockFromTransaction: jest.fn()
  } as unknown as BitcoinDataSource

  const MOCK_LIQUIDITY_BRIDGE_CONTRACT: LiquidityBridgeContract = {
    pegInContract: { resolvePegin: jest.fn() }
  } as unknown as LiquidityBridgeContract

  const MOCK_FLYOVER_CONTEXT: FlyoverSDKContext = {
    btcConnection: MOCK_BTC_DATA_SOURCE,
    rskConnection: MOCK_RSK_CONNECTION,
    lbc: MOCK_LIQUIDITY_BRIDGE_CONTRACT
  } as unknown as FlyoverSDKContext

  const registerPeginParams: RegisterPeginParams = {
    rskAddress: MOCK_RSK_ADDRESS,
    userBtcTransactionHash: MOCK_BTC_TX_HASH
  }

  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(MOCK_BTC_DATA_SOURCE, 'getBlockFromTransaction').mockImplementation(async () => Promise.resolve({
      hash: '070974fee1c3c07920a92185d5749fd85cb35f8460d03554312ec4425367e6ae',
      height: MOCK_BLOCK_HEIGHT,
      transactionHashes: MOCK_TRANSACTION_HASHES
    }))
    mockedIsPeginRefundable.mockResolvedValue({ isRefundable: true })
    mockedGetRawTxWithoutWitnesses.mockResolvedValue(MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES)
    jest.spyOn(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegInContract, 'resolvePegin').mockImplementation(async () => Promise.resolve({ txHash: MOCK_TX_HASH } as unknown as TxResult))
  })

  test('successfully register a pegin and return transaction hash', async () => {
    const result = await registerPegin(registerPeginParams, MOCK_FLYOVER_CONTEXT)

    expect(result).toBe(MOCK_TX_HASH)

    expect(mockedIsPeginRefundable).toHaveBeenCalledWith({
      rskAddress: MOCK_RSK_ADDRESS,
      btcTransactionHash: MOCK_BTC_TX_HASH
    },
    MOCK_FLYOVER_CONTEXT
    )

    expect(mockedGetRawTxWithoutWitnesses).toHaveBeenCalledWith(MOCK_BTC_TX_HASH, MOCK_BTC_DATA_SOURCE)

    expect(MOCK_BTC_DATA_SOURCE.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)

    expect(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegInContract.resolvePegin).toHaveBeenCalledWith({
      rskAddress: MOCK_RSK_ADDRESS,
      btcRawTransaction: MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES,
      partialMerkleTree: MOCK_PARTIAL_MARKLE_TREE.hex,
      height: MOCK_BLOCK_HEIGHT
    })
  })

  test('throw error when pegin is not refundable', async () => {
    const MOCK_ERROR = FlyoverErrors.PEG_IN_REFUND_ALREADY_PAID

    mockedIsPeginRefundable.mockResolvedValue({
      isRefundable: false,
      error: MOCK_ERROR
    })

    await expect(
      registerPegin(registerPeginParams, MOCK_FLYOVER_CONTEXT)
    ).rejects.toMatchObject({
      recoverable: false,
      message: 'Peg-in is not refundable',
      details: MOCK_ERROR
    })

    expect(mockedIsPeginRefundable).toHaveBeenCalledWith({
      rskAddress: MOCK_RSK_ADDRESS,
      btcTransactionHash: MOCK_BTC_TX_HASH
    },
    MOCK_FLYOVER_CONTEXT
    )

    expect(mockedGetRawTxWithoutWitnesses).not.toHaveBeenCalled()
    expect(MOCK_BTC_DATA_SOURCE.getBlockFromTransaction).not.toHaveBeenCalled()
    expect(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegInContract.resolvePegin).not.toHaveBeenCalled()
  })

  test('throw error when resolvePegin fails', async () => {
    const MOCK_ERROR = new Error('Registration failed')

    jest.spyOn(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegInContract, 'resolvePegin').mockImplementation(async () => {
      throw MOCK_ERROR
    })

    await expect(
      registerPegin(registerPeginParams, MOCK_FLYOVER_CONTEXT)
    ).rejects.toEqual(MOCK_ERROR)

    expect(mockedIsPeginRefundable).toHaveBeenCalledWith({
      rskAddress: MOCK_RSK_ADDRESS,
      btcTransactionHash: MOCK_BTC_TX_HASH
    },
    MOCK_FLYOVER_CONTEXT
    )

    expect(mockedGetRawTxWithoutWitnesses).toHaveBeenCalledWith(MOCK_BTC_TX_HASH, MOCK_BTC_DATA_SOURCE)
    expect(MOCK_BTC_DATA_SOURCE.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)
    expect(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegInContract.resolvePegin).toHaveBeenCalledWith({
      rskAddress: MOCK_RSK_ADDRESS,
      btcRawTransaction: MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES,
      partialMerkleTree: MOCK_PARTIAL_MARKLE_TREE.hex,
      height: MOCK_BLOCK_HEIGHT
    })
  })

  test('throw error when getBlockFromTransaction fails', async () => {
    const MOCK_ERROR = new Error('Block retrieval failed')

    jest.spyOn(MOCK_BTC_DATA_SOURCE, 'getBlockFromTransaction').mockImplementation(async () => {
      throw MOCK_ERROR
    })

    await expect(
      registerPegin(registerPeginParams, MOCK_FLYOVER_CONTEXT)
    ).rejects.toEqual(MOCK_ERROR)

    expect(mockedIsPeginRefundable).toHaveBeenCalledWith({
      rskAddress: MOCK_RSK_ADDRESS,
      btcTransactionHash: MOCK_BTC_TX_HASH
    },
    MOCK_FLYOVER_CONTEXT
    )

    expect(mockedGetRawTxWithoutWitnesses).toHaveBeenCalledWith(MOCK_BTC_TX_HASH, MOCK_BTC_DATA_SOURCE)
    expect(MOCK_BTC_DATA_SOURCE.getBlockFromTransaction).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)
    expect(MOCK_LIQUIDITY_BRIDGE_CONTRACT.pegInContract.resolvePegin).not.toHaveBeenCalled()
  })

  test('throw error when btcConnection in context is missing', async () => {
    // Test with undefined btcConnection
    const contextWithUndefinedBtcConnection = {
      ...MOCK_FLYOVER_CONTEXT,
      btcConnection: undefined
    } as unknown as FlyoverSDKContext

    await expect(
      registerPegin(registerPeginParams, contextWithUndefinedBtcConnection)
    ).rejects.toThrow('Bitcoin connection is required')

    // Test with null btcConnection
    const contextWithNullBtcConnection = {
      ...MOCK_FLYOVER_CONTEXT,
      btcConnection: null
    } as unknown as FlyoverSDKContext

    await expect(
      registerPegin(registerPeginParams, contextWithNullBtcConnection)
    ).rejects.toThrow('Bitcoin connection is required')
  })

  test('throw error when lbc in context is missing', async () => {
    // Test with undefined lbc
    const contextWithUndefinedLbc = {
      ...MOCK_FLYOVER_CONTEXT,
      lbc: undefined
    } as unknown as FlyoverSDKContext

    await expect(
      registerPegin(registerPeginParams, contextWithUndefinedLbc)
    ).rejects.toThrow('Liquidity Bridge Contract is required')

    // Test with null lbc
    const contextWithNullLbc = {
      ...MOCK_FLYOVER_CONTEXT,
      lbc: null
    } as unknown as FlyoverSDKContext

    await expect(
      registerPegin(registerPeginParams, contextWithNullLbc)
    ).rejects.toThrow('Liquidity Bridge Contract is required')
  })
})
