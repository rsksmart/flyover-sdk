import { Mempool } from './Mempool'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { MempoolBaseUrls } from '../constants/mempool'
import { type BitcoinTransaction } from './BitcoinDataSource'

global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>

describe('Mempool', () => {
  const FAKE_TX_ID = 'e9cb9f22297a45ba730528952515bc0760b1bb921e2d5f3e1b8c22a39a4a43c1'

  let mempool: Mempool
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>

  beforeEach(() => {
    jest.clearAllMocks()
    mempool = new Mempool('testnet')
  })

  describe('getTransaction', () => {
    const mockMempoolTransaction = {
      txid: FAKE_TX_ID,
      status: {
        confirmed: true,
        block_height: 123456,
        block_hash: '000000000000000000000000000000000000000000000000000000000000000',
        block_time: 1600000000
      },
      vout: [
        {
          scriptpubkey: '76a9144ee02c481e6484c57f47321cec042f38054d82d688ac', // gitleaks:allow
          scriptpubkey_asm: 'OP_DUP OP_HASH160 4ee02c481e6484c57f47321cec042f38054d82d6 OP_EQUALVERIFY OP_CHECKSIG',
          scriptpubkey_type: 'p2pkh',
          value: 60000000
        },
        {
          scriptpubkey: '6a20f6a349deeee36ab46ed36cbe84d22a014938b6f54f475b4e6afb770bae57f1fd', // gitleaks:allow
          scriptpubkey_asm: 'OP_RETURN f6a349deeee36ab46ed36cbe84d22a014938b6f54f475b4e6afb770bae57f1fd',
          scriptpubkey_type: 'op_return',
          value: 0
        }
      ]
    }

    const expectedBitcoinTransaction: BitcoinTransaction = {
      txid: FAKE_TX_ID,
      isConfirmed: true,
      vout: [
        {
          valueInSats: 60000000,
          hex: '76a9144ee02c481e6484c57f47321cec042f38054d82d688ac' // gitleaks:allow
        },
        {
          valueInSats: 0,
          hex: '6a20f6a349deeee36ab46ed36cbe84d22a014938b6f54f475b4e6afb770bae57f1fd' // gitleaks:allow
        }
      ]
    }

    it('should return the BitcoinTransaction when successful', async () => {
      // Mock successful fetch response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          json: async () => Promise.resolve(mockMempoolTransaction)
        } as Response
      )

      const result = await mempool.getTransaction(FAKE_TX_ID)

      expect(result).toEqual(expectedBitcoinTransaction)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(`${MempoolBaseUrls.Testnet}/tx/${FAKE_TX_ID}`)
    })

    it('should throw an error when the API call fails with non-ok response', async () => {
      // Mock failed fetch response with non-ok status
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: false,
          status: 404
        } as Response
      )

      await expect(mempool.getTransaction(FAKE_TX_ID))
        .rejects
        .toThrow('HTTP error! status: 404')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should throw an error when fetch rejects', async () => {
      const errorMessage = 'Network error'
      mockFetch.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mempool.getTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(errorMessage)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
