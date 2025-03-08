import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { isPegoutQuotePaid } from './isPegoutQuotePaid'
import { getPegoutStatus } from './getPegoutStatus'
import { type HttpClient } from '@rsksmart/bridges-core-sdk'
import { type LiquidityProvider } from '../api'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import { FlyoverErrors } from '../constants/errors'
import { type Transaction } from 'bitcoinjs-lib'
import { type Output } from 'bitcoinjs-lib/src/transaction'

jest.mock('./getPegoutStatus')
const mockedGetPegoutStatus = getPegoutStatus as jest.Mock

jest.mock('bitcoinjs-lib', () => ({
  Transaction: {
    fromHex: jest.fn().mockImplementation(() => {
      console.log('mockTxJsLib', mockTxJsLib)
      return mockTxJsLib
    })
  }
}))

// Success case of the Transaction.fromHex() mock for the FAKE_QUOTE_HASH
const mockTxJsLib = {
  version: 2,
  locktime: 0,
  outs: [
    { value: 60000000, script: Buffer.from([118, 169, 20, 78, 224, 44, 72, 30, 100, 132, 197, 127, 71, 50, 28, 236, 4, 47, 56, 5, 77, 130, 214, 136, 172]) },
    { value: 0, script: Buffer.from([106, 32, 115, 63, 150, 198, 123, 198, 212, 8, 110, 215, 16, 113, 76, 54, 207, 109, 49, 181, 38, 183, 206, 179, 33, 213, 106, 197, 46, 114, 30, 142, 151, 255]) },
    { value: 459939475, script: Buffer.from([118, 169, 20, 221, 182, 119, 243, 100, 152, 247, 164, 144, 26, 116, 232, 130, 223, 104, 253, 0, 207, 71, 53, 136, 172]) },
    {
      value: 459939475,
      script: Buffer.from([118, 169, 20, 221, 182, 119, 243, 100, 152, 247, 164, 144, 26, 116, 232, 130, 223, 104, 253, 0, 207, 71, 53, 136, 172])
    }
  ]
} as unknown as Transaction

const FAKE_QUOTE_HASH = '733f96c67bc6d4086ed710714c36cf6d31b526b7ceb321d56ac52e721e8e97ff'
const FAKE_LP_BTC_TX_HASH = '81d20ff8f2f961ce88aeceeb2d859287bcd6ebba2ef532e7d083100a52faad87'
const FAKE_TX_HEX = '0200000001480669043873ea93dfeb4817799bfb92088d344c77c1324fc84db65d0832f7da020000006a47304402205805cba42242416e3ba8ccda109dd2ca7b54fdfd9a493478b98212d66a778f6402204a8e4b34185fc1eabfec2507c2d0c1844a50269ee4d415e7db7e341f0a554fdd01210232858a5faa413101831afe7a880da9a8ac4de6bd5e25b4358d762ba450b03c22fdffffff0300879303000000001976a9144ee02c481e6484c57f47321cec042f38054d82d688ac0000000000000000226a20733f96c67bc6d4086ed710714c36cf6d31b526b7ceb321d56ac52e721e8e97ff931e6a1b000000001976a914ddb677f36498f7a4901a74e882df68fd00cf473588ac00000000'

/* eslint-disable @typescript-eslint/consistent-type-assertions */
const mockClient: HttpClient = {
  async get<M>(_url: string) {
    return Promise.resolve({} as M)
  }
} as unknown as HttpClient

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

const mockBitcoinDataSource: BitcoinDataSource = {
  getTransactionAsHex: jest.fn().mockImplementation(async () => Promise.resolve(FAKE_TX_HEX))
} as unknown as BitcoinDataSource

describe('isPegoutQuotePaid function', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should return isPaid true when quote is paid', async () => {
    mockedGetPegoutStatus.mockImplementation(async () => Promise.resolve(mockPegoutStatusWithTxHash))

    const result = await isPegoutQuotePaid(
      mockClient,
      providerMock,
      FAKE_QUOTE_HASH,
      mockBitcoinDataSource
    )

    expect(result.isPaid).toBe(true)
    expect(result.error).toBeUndefined()

    expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
    expect(mockBitcoinDataSource.getTransactionAsHex).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
  })

  test('should return isPaid false when LPS does not return quote status', async () => {
    // Mock the implementation of getPegoutStatus to always reject
    const ERROR_DETAIL = 'API error'
    const error = new Error(ERROR_DETAIL)
    mockedGetPegoutStatus.mockImplementation(async () => Promise.reject(error))

    // Mock setTimeout to execute immediately
    const originalSetTimeout = global.setTimeout
    global.setTimeout = function (callback: (...args: any[]) => void, _timeout?: number) {
      callback()
      return 0 as any
    } as typeof global.setTimeout

    const result = await isPegoutQuotePaid(
      mockClient,
      providerMock,
      FAKE_QUOTE_HASH,
      mockBitcoinDataSource
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toStrictEqual({
      ...FlyoverErrors.LPS_DID_NOT_RETURN_QUOTE_STATUS,
      detail: ERROR_DETAIL
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

    const result = await isPegoutQuotePaid(
      mockClient,
      providerMock,
      FAKE_QUOTE_HASH,
      mockBitcoinDataSource
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toBe(FlyoverErrors.QUOTE_STATUS_DOES_NOT_HAVE_A_PEGOUT_TX_HASH)
    expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
    expect(mockBitcoinDataSource.getTransactionAsHex).not.toHaveBeenCalled()
  })

  test('should return isPaid false when transaction does not have a valid OP_RETURN output', async () => {
    // Save a reference to the original outs array
    const originalOuts = [...mockTxJsLib.outs]

    // Remove the OP_RETURN output (the one with value 0, which is at index 1)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    mockTxJsLib.outs = [mockTxJsLib.outs[0]!, mockTxJsLib.outs[2]!]

    mockedGetPegoutStatus.mockImplementation(async () => Promise.resolve(mockPegoutStatusWithTxHash))

    const result = await isPegoutQuotePaid(
      mockClient,
      providerMock,
      FAKE_QUOTE_HASH,
      mockBitcoinDataSource
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toBe(FlyoverErrors.QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_A_VALID_OP_RETURN_OUTPUT)

    expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
    expect(mockBitcoinDataSource.getTransactionAsHex).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)

    // Restore the original outs array
    mockTxJsLib.outs = originalOuts
  })

  test('should return isPaid false when transaction has OP_RETURN but with wrong hash', async () => {
    // Save a reference to the original outs array
    const originalOuts = [...mockTxJsLib.outs]

    // Create a modified version with a different hash in the OP_RETURN output
    const differentHashOutput = {
      value: 0,
      script: Buffer.from([
        106, 32, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100,
        100, 100, 100, 100, 100, 100, 100, 100, 100, 100
      ])
    } as Output

    // Replace the OP_RETURN output with our modified one
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    mockTxJsLib.outs = [mockTxJsLib.outs[0]!, differentHashOutput, mockTxJsLib.outs[2]!]

    mockedGetPegoutStatus.mockImplementation(async () => Promise.resolve(mockPegoutStatusWithTxHash))

    const result = await isPegoutQuotePaid(
      mockClient,
      providerMock,
      FAKE_QUOTE_HASH,
      mockBitcoinDataSource
    )

    expect(result.isPaid).toBe(false)
    expect(result.error).toBe(FlyoverErrors.QUOTE_STATUS_TRANSACTION_DOES_NOT_HAVE_A_VALID_OP_RETURN_OUTPUT)
    expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
    expect(mockBitcoinDataSource.getTransactionAsHex).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)

    // Restore the original outs array
    mockTxJsLib.outs = originalOuts
  })

  test('should throw error when getTransactionAsHex fails', async () => {
    mockedGetPegoutStatus.mockImplementation(async () => Promise.resolve(mockPegoutStatusWithTxHash))

    // Create a mock for bitcoinDataSource that fails with an error
    const errorMessage = 'Failed to get transaction hex'
    const mockBitcoinDataSourceWithError = {
      getTransactionAsHex: jest.fn().mockImplementation(async () => Promise.reject(new Error(errorMessage)))
    }

    await expect(isPegoutQuotePaid(
      mockClient,
      providerMock,
      FAKE_QUOTE_HASH,
      mockBitcoinDataSourceWithError as BitcoinDataSource
    )).rejects.toThrow(`Failed to check OP_RETURN output: ${errorMessage}`)

    expect(getPegoutStatus).toHaveBeenCalledWith(mockClient, providerMock, FAKE_QUOTE_HASH)
    expect(mockBitcoinDataSourceWithError.getTransactionAsHex).toHaveBeenCalledWith(FAKE_LP_BTC_TX_HASH)
  })
})
