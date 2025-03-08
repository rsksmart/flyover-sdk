import { Mempool } from './Mempool'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Create a mock for the mempoolJS module
const mockGetTxHex = jest.fn()
jest.mock('@mempool/mempool.js', () => {
  return jest.fn().mockImplementation(() => ({
    bitcoin: {
      transactions: {
        getTxHex: mockGetTxHex
      }
    }
  }))
})

describe('Mempool', () => {
  const FAKE_TX_ID = 'e9cb9f22297a45ba730528952515bc0760b1bb921e2d5f3e1b8c22a39a4a43c1'
  const FAKE_TX_HEX = '0200000001e9cb9f22297a45ba730528952515bc0760b1bb921e2d5f3e1b8c22a39a4a43c1010000006a47304402203e97e482805fe9de33eb2db011c0a60e27b74d539d44deff8e5a0dde46cb811f02203f64e20d92184f8a10003e11e86753d86069abfd5f7559d3e94fe2a53b1cd61901210232858a5faa413101831afe7a880da9a8ac4de6bd5e25b4358d762ba450b03c22fdffffff0300879303000000001976a9144ee02c481e6484c57f47321cec042f38054d82d688ac0000000000000000226a20f6a349deeee36ab46ed36cbe84d22a014938b6f54f475b4e6afb770bae57f1fdbbc3391a000000001976a914ddb677f36498f7a4901a74e882df68fd00cf473588ac00000000'

  let mempool: Mempool

  beforeEach(() => {
    jest.clearAllMocks()
    mempool = new Mempool('testnet')
  })

  describe('getTransactionAsHex', () => {
    it('should return the transaction hex when successful', async () => {
      mockGetTxHex.mockImplementation(async () => Promise.resolve(FAKE_TX_HEX))

      const result = await mempool.getTransactionAsHex(FAKE_TX_ID)

      expect(result).toBe(FAKE_TX_HEX)
      expect(mockGetTxHex).toHaveBeenCalledTimes(1)
      expect(mockGetTxHex).toHaveBeenCalledWith({ txid: FAKE_TX_ID })
    })

    it('should throw an error when the API call fails', async () => {
      const errorMessage = 'Transaction not found'
      mockGetTxHex.mockImplementation(async () => Promise.reject(new Error(errorMessage)))

      await expect(mempool.getTransactionAsHex(FAKE_TX_ID))
        .rejects
        .toThrow(errorMessage)

      expect(mockGetTxHex).toHaveBeenCalledTimes(1)
    })
  })
})
