import { BitcoindRpcDataSource } from './BitcoinRpcDataSource'
import { describe, it, expect, beforeEach, jest, afterAll } from '@jest/globals'
import { type BitcoinTransaction } from './BitcoinDataSource'

// Store the original fetch
const originalFetch = global.fetch

// Create a mock fetch function
const mockFetch = jest.fn().mockImplementation(async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    json: async () => ({ result: {} })
  } as Response
})

// Replace global.fetch with our mock
global.fetch = mockFetch as typeof global.fetch

describe('LocalBTCDataSource', () => {
  const FAKE_ERROR_MESSAGE = 'Some error message'
  const FAKE_TX_ID = '948253172403f42684c53f1e3ade5b54be23d986051139432b6c09a730d7e3bd'
  const FAKE_CONFIG = {
    rpcport: 18332,
    rpcuser: 'testuser',
    rpcpassword: 'testpassword',
    rpcconnect: 'localhost'
  }

  let bitcoinRpcDataSource: BitcoindRpcDataSource

  beforeEach(() => {
    jest.clearAllMocks()
    bitcoinRpcDataSource = new BitcoindRpcDataSource(FAKE_CONFIG)
  })

  // Restore the original fetch after tests
  afterAll(() => {
    global.fetch = originalFetch
  })

  describe('getTransaction', () => {
    const mockRawTransaction = {
      txid: FAKE_TX_ID,
      hash: FAKE_TX_ID,
      version: 2,
      size: 268,
      vsize: 268,
      weight: 1072,
      locktime: 0,
      vin: [
        {
          txid: 'd35c98aa64e41602f0fa3793dab9fd5bea74c3f01141605ff7cdadbb079188f8',
          vout: 2,
          scriptSig: {
            asm: '304402204fdbae2492fca88aaa6ebe1cbe9f19714face5ff7cca4af0a77c244519f7e4d70220599286132d662d1587b71c7cc8be7a529685b359720678658e0d555b492c2ba3[ALL] 0232858a5faa413101831afe7a880da9a8ac4de6bd5e25b4358d762ba450b03c22',
            hex: '47304402204fdbae2492fca88aaa6ebe1cbe9f19714face5ff7cca4af0a77c244519f7e4d70220599286132d662d1587b71c7cc8be7a529685b359720678658e0d555b492c2ba301210232858a5faa413101831afe7a880da9a8ac4de6bd5e25b4358d762ba450b03c22'
          },
          sequence: 4294967293
        }
      ],
      vout: [
        {
          value: 0.6,
          n: 0,
          scriptPubKey: {
            asm: 'OP_DUP OP_HASH160 4ee02c481e6484c57f47321cec042f38054d82d6 OP_EQUALVERIFY OP_CHECKSIG',
            hex: '76a9144ee02c481e6484c57f47321cec042f38054d82d688ac',
            type: 'pubkeyhash'
          }
        },
        {
          value: 0,
          n: 1,
          scriptPubKey: {
            asm: 'OP_RETURN 2213c0a4ae634bacb5a64639d86a01068ae52a5b2028687cb8822b866c4ac9fd',
            hex: '6a202213c0a4ae634bacb5a64639d86a01068ae52a5b2028687cb8822b866c4ac9fd',
            type: 'nulldata'
          }
        }
      ],
      hex: '0200000001f8889107bbadcdf75f604111f0c374ea5bfdb9da9337faf00216e464aa985cd3020000006a47304402204fdbae2492fca88aaa6ebe1cbe9f19714face5ff7cca4af0a77c244519f7e4d70220599286132d662d1587b71c7cc8be7a529685b359720678658e0d555b492c2ba301210232858a5faa413101831afe7a880da9a8ac4de6bd5e25b4358d762ba450b03c22fdffffff0300879303000000001976a9144ee02c481e6484c57f47321cec042f38054d82d688ac0000000000000000226a202213c0a4ae634bacb5a64639d86a01068ae52a5b2028687cb8822b866c4ac9fd7622a616000000001976a914ddb677f36498f7a4901a74e882df68fd00cf473588ac00000000',
      blockhash: '3d8c0465ec685600b410c5b37c95cc6cb2ddcc622cd038735ca80add69ee8046',
      confirmations: 4,
      time: 1741265497,
      blocktime: 1741265497
    }

    const mockBlock = {
      height: 123456
    }

    // Expected BitcoinTransaction object after transformation
    const expectedBitcoinTransaction: BitcoinTransaction = {
      blockHash: '3d8c0465ec685600b410c5b37c95cc6cb2ddcc622cd038735ca80add69ee8046',
      blockHeight: 123456,
      txid: mockRawTransaction.txid,
      isConfirmed: true,
      vout: [
        {
          valueInSats: 60000000, // 0.6 BTC converted to satoshis
          hex: '76a9144ee02c481e6484c57f47321cec042f38054d82d688ac'
        },
        {
          valueInSats: 0,
          hex: '6a202213c0a4ae634bacb5a64639d86a01068ae52a5b2028687cb8822b866c4ac9fd'
        }
      ]
    }

    it('should successfully retrieve and transform a transaction', async () => {
      // For getting the transaction details
      mockFetch.mockImplementationOnce(async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          json: async () => ({ result: mockRawTransaction })
        } as Response
      })

      // For getting the height of the block where the transaction was included
      mockFetch.mockImplementationOnce(async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          json: async () => ({ result: mockBlock })
        } as Response
      })

      const result = await bitcoinRpcDataSource.getTransaction(FAKE_TX_ID)

      expect(result).toEqual(expectedBitcoinTransaction)
      expect(result.vout.length).toBe(2)

      // Verify the RPC calls were made correctly
      expect(mockFetch).toHaveBeenCalledTimes(2)

      // Check first call parameters (getrawtransaction)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const firstCallUrl = mockFetch.mock.calls[0]![0]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const firstCallOptions = mockFetch.mock.calls[0]![1] as any
      expect(firstCallUrl).toBe(`http://${FAKE_CONFIG.rpcconnect}:${FAKE_CONFIG.rpcport}`)

      // Check the body of the first call
      const firstCallBody = JSON.parse(firstCallOptions.body)
      expect(firstCallBody.method).toBe('getrawtransaction')
      expect(firstCallBody.params).toEqual([FAKE_TX_ID, true])
      expect(firstCallBody.jsonrpc).toBe('1.0')

      // Check auth headers
      const expectedToken = Buffer.from(`${FAKE_CONFIG.rpcuser}:${FAKE_CONFIG.rpcpassword}`).toString('base64')
      expect(firstCallOptions.headers.get('Authorization')).toBe('Basic ' + expectedToken)
      expect(firstCallOptions.headers.get('content-type')).toBe('application/json')

      // Check second call parameters (getblock)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const secondCallUrl = mockFetch.mock.calls[1]![0]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const secondCallOptions = mockFetch.mock.calls[1]![1] as any
      expect(secondCallUrl).toBe(`http://${FAKE_CONFIG.rpcconnect}:${FAKE_CONFIG.rpcport}`)

      // Check the body of the second call
      const secondCallBody = JSON.parse(secondCallOptions.body)
      expect(secondCallBody.method).toBe('getblock')
      expect(secondCallBody.params).toEqual([mockRawTransaction.blockhash])
    })

    it('should handle network errors', async () => {
      mockFetch.mockImplementationOnce(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })

      await expect(bitcoinRpcDataSource.getTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(`Failed to get transaction details: ${FAKE_ERROR_MESSAGE}`)
    })

    it('should handle RPC errors', async () => {
      mockFetch.mockImplementationOnce(async () => {
        return {
          json: async () => ({
            error: {
              code: -8,
              message: FAKE_ERROR_MESSAGE
            },
            result: null
          })
        } as unknown as Response
      })

      await expect(bitcoinRpcDataSource.getTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(`Failed to get transaction details: ${FAKE_ERROR_MESSAGE}`)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getTransactionAsHex', () => {
    const mockRawTransaction = {
      txid: FAKE_TX_ID,
      hash: FAKE_TX_ID,
      hex: '0200000001f8889107bbadcdf75f604111f0c374ea5bfdb9da9337faf00216e464aa985cd3020000006a47304402204fdbae2492fca88aaa6ebe1cbe9f19714face5ff7cca4af0a77c244519f7e4d70220599286132d662d1587b71c7cc8be7a529685b359720678658e0d555b492c2ba301210232858a5faa413101831afe7a880da9a8ac4de6bd5e25b4358d762ba450b03c22fdffffff0300879303000000001976a9144ee02c481e6484c57f47321cec042f38054d82d688ac0000000000000000226a202213c0a4ae634bacb5a64639d86a01068ae52a5b2028687cb8822b866c4ac9fd7622a616000000001976a914ddb677f36498f7a4901a74e882df68fd00cf473588ac00000000',
      blockhash: '3d8c0465ec685600b410c5b37c95cc6cb2ddcc622cd038735ca80add69ee8046',
      confirmations: 4
    }

    it('should successfully retrieve transaction hex', async () => {
      mockFetch.mockImplementationOnce(async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          json: async () => ({ result: mockRawTransaction })
        } as Response
      })

      const result = await bitcoinRpcDataSource.getTransactionAsHex(FAKE_TX_ID)

      expect(result).toBe(mockRawTransaction.hex)

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const callUrl = mockFetch.mock.calls[0]![0]
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const callOptions = mockFetch.mock.calls[0]![1] as any

      expect(callUrl).toBe(`http://${FAKE_CONFIG.rpcconnect}:${FAKE_CONFIG.rpcport}`)

      // Check the body of the call
      const callBody = JSON.parse(callOptions.body)
      expect(callBody.method).toBe('getrawtransaction')
      expect(callBody.params).toEqual([FAKE_TX_ID, true])
      expect(callBody.jsonrpc).toBe('1.0')

      // Check auth headers
      const expectedToken = Buffer.from(`${FAKE_CONFIG.rpcuser}:${FAKE_CONFIG.rpcpassword}`).toString('base64')
      expect(callOptions.headers.get('Authorization')).toBe('Basic ' + expectedToken)
    })

    it('should handle network errors', async () => {
      mockFetch.mockImplementationOnce(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })

      await expect(bitcoinRpcDataSource.getTransactionAsHex(FAKE_TX_ID))
        .rejects
        .toThrow(`Failed to get transaction: ${FAKE_ERROR_MESSAGE}`)
    })

    it('should handle RPC errors', async () => {
      mockFetch.mockImplementationOnce(async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          json: async () => ({
            error: {
              code: -8,
              message: FAKE_ERROR_MESSAGE
            },
            result: null
          })
        } as Response
      })

      await expect(bitcoinRpcDataSource.getTransactionAsHex(FAKE_TX_ID))
        .rejects
        .toThrow(`Failed to get transaction: ${FAKE_ERROR_MESSAGE}`)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })

  describe('getBlockFromTransaction', () => {
    const mockRawTransaction = {
      txid: FAKE_TX_ID,
      hash: FAKE_TX_ID,
      blockhash: '3d8c0465ec685600b410c5b37c95cc6cb2ddcc622cd038735ca80add69ee8046',
      confirmations: 4
    }

    const mockBlock = {
      hash: '3d8c0465ec685600b410c5b37c95cc6cb2ddcc622cd038735ca80add69ee8046',
      height: 123456,
      tx: [
        FAKE_TX_ID,
        'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        '0987654321fedcba0987654321fedcba0987654321fedcba0987654321fedcba'
      ]
    }

    // Transaction result that would be returned by getTransaction()
    const confirmedTransaction: BitcoinTransaction = {
      txid: FAKE_TX_ID,
      isConfirmed: true,
      vout: [],
      blockHash: mockRawTransaction.blockhash,
      blockHeight: mockBlock.height
    }

    it('should successfully retrieve block information from a transaction', async () => {
      const getTransactionSpy = jest.spyOn(bitcoinRpcDataSource, 'getTransaction')
        .mockResolvedValueOnce(confirmedTransaction)

      mockFetch.mockImplementationOnce(async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          json: async () => ({ result: mockBlock })
        } as Response
      })

      const result = await bitcoinRpcDataSource.getBlockFromTransaction(FAKE_TX_ID)

      expect(result).toEqual({
        hash: mockBlock.hash,
        height: mockBlock.height,
        transactionHashes: mockBlock.tx
      })

      // Verify that getTransaction was called once with the right parameters
      expect(getTransactionSpy).toHaveBeenCalledTimes(1)
      expect(getTransactionSpy).toHaveBeenCalledWith(FAKE_TX_ID)

      // Verify that fetch was called once for getblock
      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Check the RPC call parameters for getblock
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const callOptions = mockFetch.mock.calls[0]![1] as Record<string, any>
      const callBody = JSON.parse(callOptions.body as string)
      expect(callBody.method).toBe('getblock')
      expect(callBody.params).toEqual([mockRawTransaction.blockhash])
    })

    it('should throw an error when transaction is not confirmed', async () => {
      const unconfirmedTransaction = {
        txid: FAKE_TX_ID,
        isConfirmed: false,
        vout: []
        // No blockHash or blockHeight for unconfirmed transaction
      }

      // Mock getTransaction to return an unconfirmed transaction
      jest.spyOn(bitcoinRpcDataSource, 'getTransaction')
        .mockResolvedValueOnce(unconfirmedTransaction)

      await expect(bitcoinRpcDataSource.getBlockFromTransaction(FAKE_TX_ID))
        .rejects
        .toThrow('Transaction has not been confirmed')

      // Verify that no RPC call was made (since the error is thrown before)
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle network errors during block retrieval', async () => {
      jest.spyOn(bitcoinRpcDataSource, 'getTransaction')
        .mockResolvedValueOnce(confirmedTransaction)

      mockFetch.mockImplementationOnce(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })

      await expect(bitcoinRpcDataSource.getBlockFromTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(FAKE_ERROR_MESSAGE)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle errors from getTransaction', async () => {
      jest.spyOn(bitcoinRpcDataSource, 'getTransaction')
        .mockRejectedValueOnce(new Error(FAKE_ERROR_MESSAGE))

      await expect(bitcoinRpcDataSource.getBlockFromTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(FAKE_ERROR_MESSAGE)

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('should handle RPC errors during block retrieval', async () => {
      jest.spyOn(bitcoinRpcDataSource, 'getTransaction')
        .mockResolvedValueOnce(confirmedTransaction)

      mockFetch.mockImplementationOnce(async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          json: async () => ({
            error: {
              code: -5,
              message: FAKE_ERROR_MESSAGE
            },
            result: null
          })
        } as Response
      })

      await expect(bitcoinRpcDataSource.getBlockFromTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(FAKE_ERROR_MESSAGE)

      expect(mockFetch).toHaveBeenCalledTimes(1)
    })
  })
})
