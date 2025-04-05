import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import type { BitcoinDataSource } from './BitcoinDataSource'
import { getRawTxWithoutWitnesses } from './utils'

const MOCK_BTC_DATA_SOURCE: BitcoinDataSource = {
  getTransactionAsHex: jest.fn()
} as unknown as BitcoinDataSource

const MOCK_BTC_TX_HASH = '6f32f9a0a59b2d206de4825e0dfcd62466518375297d7f047bf370547e1df799'
const MOCK_BTC_TRANSACTION_HEX = '0200000001c28de5e598a6295c32ca8a66ade34b109cde5da35f3c0a7e961ff24e5946769f000000006a47304402206554949e196e72941841d64e256d657f694d77d35898a8a1f80f31f4f5e4fa7c02202f30c06793900ac9e4d0fa01f961e7549bf18067272d66bd3621f59431c4150801210374116b9b59b002fa1b97001f77f1f14963b0b9a4523d3fd2ddeed9d5d5c5b1b1fdffffff02801d2c040000000017a914f198a0f0c25b7dcf771aaf4a13052debe9e7e9e4871ae40270020000001976a914315a8bc14efd6ce2404c3a9e76875e3d1c0cb17288acfdea0000'
const MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES = '0200000001c28de5e598a6295c32ca8a66ade34b109cde5da35f3c0a7e961ff24e5946769f000000006a47304402206554949e196e72941841d64e256d657f694d77d35898a8a1f80f31f4f5e4fa7c02202f30c06793900ac9e4d0fa01f961e7549bf18067272d66bd3621f59431c4150801210374116b9b59b002fa1b97001f77f1f14963b0b9a4523d3fd2ddeed9d5d5c5b1b1fdffffff02801d2c040000000017a914f198a0f0c25b7dcf771aaf4a13052debe9e7e9e4871ae40270020000001976a914315a8bc14efd6ce2404c3a9e76875e3d1c0cb17288acfdea0000'
const BTC_SEGWIT_TX_HEX = '02000000000101a9e61da524cda1fbcb5bf3d1d56742ba428c78953a819f449308ee46a2c993b50000000000fdffffff02579e6e37000000001976a914dbda47554dfea08a410dd3c8759016c8d6beeb1c88ac801d2c040000000017a914580cefdaba82ab09da80c83f2d1cf113e1794df887024730440220765a3039cc0332e519fc62d6e982ccbef83b6e6416fdf5c3280e99e5d7c78c6a02200f3aa25287d42be3d821f9ccfcbb96ffe24547b16844597ee1af8f746ecfcafc0121025f5d74a69b2be67cc5ccdfcdb0146a61edf1d0e142c1a2381bdbac9026828a13e9f10000'
const BTC_SEGWIT_TX_WITHOUT_WITNESS = '0200000001a9e61da524cda1fbcb5bf3d1d56742ba428c78953a819f449308ee46a2c993b50000000000fdffffff02579e6e37000000001976a914dbda47554dfea08a410dd3c8759016c8d6beeb1c88ac801d2c040000000017a914580cefdaba82ab09da80c83f2d1cf113e1794df887e9f10000'

describe('getRawTxWithoutWitnesses', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    jest.spyOn(MOCK_BTC_DATA_SOURCE, 'getTransactionAsHex').mockResolvedValue(MOCK_BTC_TRANSACTION_HEX)
  })

  test('should return the raw transaction without witnesses', async () => {
    const result = await getRawTxWithoutWitnesses(MOCK_BTC_TX_HASH, MOCK_BTC_DATA_SOURCE)
    expect(result).toBe(MOCK_BTC_TRANSACTION_HEX_WITHOUT_WITNESSES)
    expect(MOCK_BTC_DATA_SOURCE.getTransactionAsHex).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)
  })

  test('should return the raw transaction without witnesses for segwit transactions', async () => {
    jest.spyOn(MOCK_BTC_DATA_SOURCE, 'getTransactionAsHex').mockResolvedValue(BTC_SEGWIT_TX_HEX)
    const result = await getRawTxWithoutWitnesses(MOCK_BTC_TX_HASH, MOCK_BTC_DATA_SOURCE)
    expect(result).toBe(BTC_SEGWIT_TX_WITHOUT_WITNESS)
    expect(MOCK_BTC_DATA_SOURCE.getTransactionAsHex).toHaveBeenCalledWith(MOCK_BTC_TX_HASH)
  })

  test('should propagate errors from getTransactionAsHex', async () => {
    const mockError = new Error('Failed to fetch transaction')
    jest.spyOn(MOCK_BTC_DATA_SOURCE, 'getTransactionAsHex').mockRejectedValue(mockError)

    await expect(getRawTxWithoutWitnesses(MOCK_BTC_TX_HASH, MOCK_BTC_DATA_SOURCE))
      .rejects.toThrow(mockError)
  })
})
