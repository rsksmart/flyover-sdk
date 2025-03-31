import { Mempool } from './Mempool'
import { describe, test, expect, jest, beforeEach } from '@jest/globals'
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

  describe('constructor', () => {
    test('should set the baseUrl to the correct value', () => {
      expect((mempool as any).baseUrl).toBe(MempoolBaseUrls.Testnet)

      mempool = new Mempool('mainnet')
      expect((mempool as any).baseUrl).toBe(MempoolBaseUrls.Mainnet)
    })
  })

  describe('getTransaction', () => {
    const mockMempoolTransaction = {
      txid: FAKE_TX_ID,
      status: {
        confirmed: true,
        block_height: 123456,
        block_hash: '50000f00050f00500f0050f00050f00050f0000500f00050f0050050400f000',
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
      ],
      blockHash: '50000f00050f00500f0050f00050f00050f0000500f00050f0050050400f000',
      blockHeight: 123456
    }

    test('should return the BitcoinTransaction when successful', async () => {
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

    test('should throw an error when the API call fails with non-ok response', async () => {
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

    test('should throw an error when fetch rejects', async () => {
      const errorMessage = 'Network error'
      mockFetch.mockRejectedValueOnce(new Error(errorMessage))

      await expect(mempool.getTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(errorMessage)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getTransactionAsHex', () => {
    const FAKE_TX_HEX = '0200000001e9cb9f22297a45ba730528952515bc0760b1bb921e2d5f3e1b8c22a39a4a43c1010000006a47304402203e97e482805fe9de33eb2db011c0a60e27b74d539d44deff8e5a0dde46cb811f02203f64e20d92184f8a10003e11e86753d86069abfd5f7559d3e94fe2a53b1cd61901210232858a5faa413101831afe7a880da9a8ac4de6bd5e25b4358d762ba450b03c22fdffffff0300879303000000001976a9144ee02c481e6484c57f47321cec042f38054d82d688ac0000000000000000226a20f6a349deeee36ab46ed36cbe84d22a014938b6f54f475b4e6afb770bae57f1fdbbc3391a000000001976a914ddb677f36498f7a4901a74e882df68fd00cf473588ac00000000'

    test('should return the transaction hex when successful', async () => {
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          text: async () => Promise.resolve(FAKE_TX_HEX)
        } as Response
      )

      const result = await mempool.getTransactionAsHex(FAKE_TX_ID)

      expect(result).toBe(FAKE_TX_HEX)
      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(`${MempoolBaseUrls.Testnet}/tx/${FAKE_TX_ID}/hex`)
    })

    test('should throw an HTTP error when response is not ok', async () => {
      // Mock non-ok response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: false,
          status: 404
        } as Response
      )

      await expect(mempool.getTransactionAsHex(FAKE_TX_ID))
        .rejects
        .toThrow('HTTP error! status: 404')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(`${MempoolBaseUrls.Testnet}/tx/${FAKE_TX_ID}/hex`)
    })

    test('should throw an error when the API call fails', async () => {
      const errorMessage = 'Transaction not found'
      mockFetch.mockImplementation(async () => Promise.reject(new Error(errorMessage)))

      await expect(mempool.getTransactionAsHex(FAKE_TX_ID))
        .rejects
        .toThrow(errorMessage)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test('should throw "Transaction not found" when transaction hex is empty', async () => {
      // Mock successful response with empty content
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          text: async () => Promise.resolve('')
        } as Response
      )

      await expect(mempool.getTransactionAsHex(FAKE_TX_ID))
        .rejects
        .toThrow('Transaction not found')

      expect(mockFetch).toHaveBeenCalledTimes(1)
      expect(mockFetch).toHaveBeenCalledWith(`${MempoolBaseUrls.Testnet}/tx/${FAKE_TX_ID}/hex`)
    })
  })

  describe('getBlockFromTransaction', () => {
    const FAKE_BLOCK_HASH = '50000f00050f00500f0050f00050f00050f0000500f00050f0050050400f000'
    const FAKE_BLOCK_HEIGHT = 123456
    const FAKE_TXIDS = [
      FAKE_TX_ID,
      'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      '0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba'
    ]

    test('should return the block information when transaction is confirmed', async () => {
      // Mock getTransaction response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          json: async () => Promise.resolve({
            txid: FAKE_TX_ID,
            status: {
              confirmed: true,
              block_height: FAKE_BLOCK_HEIGHT,
              block_hash: FAKE_BLOCK_HASH
            },
            vout: []
          })
        } as Response
      )

      // Mock block txids response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          json: async () => Promise.resolve(FAKE_TXIDS)
        } as Response
      )

      const result = await mempool.getBlockFromTransaction(FAKE_TX_ID)

      expect(result).toEqual({
        hash: FAKE_BLOCK_HASH,
        height: FAKE_BLOCK_HEIGHT,
        transactionHashes: FAKE_TXIDS
      })
      expect(mockFetch).toHaveBeenCalledTimes(2)
      expect(mockFetch).toHaveBeenNthCalledWith(1, `${MempoolBaseUrls.Testnet}/tx/${FAKE_TX_ID}`)
      expect(mockFetch).toHaveBeenNthCalledWith(2, `${MempoolBaseUrls.Testnet}/block/${FAKE_BLOCK_HASH}/txids`)
    })

    test('should throw an error when transaction is not confirmed', async () => {
      // Mock unconfirmed transaction response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          json: async () => Promise.resolve({
            txid: FAKE_TX_ID,
            status: {
              confirmed: false
            },
            vout: []
          })
        } as Response
      )

      await expect(mempool.getBlockFromTransaction(FAKE_TX_ID))
        .rejects
        .toThrow('Transaction has not been confirmed')

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    test('should throw an error when block transaction fetch fails', async () => {
      // Mock successful transaction response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          json: async () => Promise.resolve({
            txid: FAKE_TX_ID,
            status: {
              confirmed: true,
              block_height: FAKE_BLOCK_HEIGHT,
              block_hash: FAKE_BLOCK_HASH
            },
            vout: []
          })
        } as Response
      )

      // Mock failed block txids response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: false,
          status: 404
        } as Response
      )

      await expect(mempool.getBlockFromTransaction(FAKE_TX_ID))
        .rejects
        .toThrow('HTTP error! status: 404')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })

    test('should throw an error when block transaction response is not an array', async () => {
      // Mock successful transaction response
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          json: async () => Promise.resolve({
            txid: FAKE_TX_ID,
            status: {
              confirmed: true,
              block_height: FAKE_BLOCK_HEIGHT,
              block_hash: FAKE_BLOCK_HASH
            },
            vout: []
          })
        } as Response
      )

      // Mock invalid block txids response (not an array)
      mockFetch.mockResolvedValueOnce(
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        {
          ok: true,
          json: async () => Promise.resolve({ error: 'Invalid response' })
        } as Response
      )

      await expect(mempool.getBlockFromTransaction(FAKE_TX_ID))
        .rejects
        .toThrow('Response is not an array of transaction IDs')

      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
