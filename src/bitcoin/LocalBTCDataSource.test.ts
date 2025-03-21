import { LocalBTCDataSource } from './LocalBTCDataSource'
import { describe, it, expect, beforeEach, jest, afterAll } from '@jest/globals'
import { type BitcoinTransaction } from './BitcoinDataSource'

// Store the original fetch
const originalFetch = global.fetch

// Create a mock fetch function
const mockFetchImplementation = jest.fn().mockImplementation(async () => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return {
    json: async () => ({ result: {} })
  } as Response
})

// Replace global.fetch with our mock
global.fetch = mockFetchImplementation as typeof global.fetch

describe('LocalBTCDataSource', () => {
  const FAKE_TX_ID = '948253172403f42684c53f1e3ade5b54be23d986051139432b6c09a730d7e3bd'
  const FAKE_CONFIG = {
    rpcport: 18332,
    rpcuser: 'testuser',
    rpcpassword: 'testpassword',
    rpcconnect: 'localhost'
  }

  let localBTCdataSource: LocalBTCDataSource

  beforeEach(() => {
    jest.clearAllMocks()
    localBTCdataSource = new LocalBTCDataSource(FAKE_CONFIG)
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

    // Expected BitcoinTransaction object after transformation
    const expectedBitcoinTransaction: BitcoinTransaction = {
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
      mockFetchImplementation.mockImplementationOnce(async () => {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
        return {
          json: async () => ({ result: mockRawTransaction })
        } as Response
      })

      const result = await localBTCdataSource.getTransaction(FAKE_TX_ID)

      expect(result).toEqual(expectedBitcoinTransaction)
      expect(result.vout.length).toBe(2)

      // Verify the RPC call was made correctly
      expect(mockFetchImplementation).toHaveBeenCalledTimes(1)

      // Type guard for the mock call
      const mockCalls = mockFetchImplementation.mock.calls
      expect(mockCalls.length).toBeGreaterThan(0)

      // Extract and verify the request body
      const requestInit = mockCalls[0]?.[1] as RequestInit
      expect(requestInit.body).toBeDefined()

      const bodyString = requestInit.body as string
      const requestBody = JSON.parse(bodyString)
      expect(requestBody.method).toBe('getrawtransaction')
      expect(requestBody.params).toEqual([FAKE_TX_ID, true])
    })

    it('should handle network errors', async () => {
      const networkErrorMessage = 'Network error'
      mockFetchImplementation.mockImplementationOnce(async () => {
        throw new Error(networkErrorMessage)
      })

      await expect(localBTCdataSource.getTransaction(FAKE_TX_ID))
        .rejects
        .toThrow(`Failed to get transaction details: ${networkErrorMessage}`)
    })
  })
})
