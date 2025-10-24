import { describe, test, jest, expect, beforeEach, beforeAll } from '@jest/globals'
import { BlockchainConnection, BridgeError, ethers, FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { PegOutContract } from './pegout'
import { PegoutQuote } from '../api'
import JSONbig from 'json-bigint'
import { Quotes } from './bindings/Pegout'

jest.mock('ethers')

const signerMock = jest.mocked({})
const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () {
    return signerMock
  }
} as BlockchainConnection)

const serializer = JSONbig({ useNativeBigInt: true })

const pegoutQuoteMock: PegoutQuote = {
  quote: {
    lbcAddress: '0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4',
    liquidityProviderRskAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    btcRefundAddress: 'mxqk28jvEtvjxRN8k7W9hFEJfWz5VcUgHW',
    rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
    lpBtcAddr: 'mnYcQxCZBbmLzNfE9BhV7E8E2u7amdz5y6',
    callFee: BigInt(1000),
    penaltyFee: BigInt(1000000),
    nonce: BigInt(5),
    depositAddr: 'miMRxGvjQCqWZtdyJCEZ6h8GsTXBtJjNo6',
    gasFee: BigInt(44000),
    value: BigInt('500000000000000'),
    agreementTimestamp: 1683115298,
    depositDateLimit: 3600,
    depositConfirmations: 10,
    transferConfirmations: 1,
    transferTime: 3600,
    expireDate: 1683118898,
    expireBlocks: 5023,
    productFeeAmount: BigInt(600000000000000000)
  },
  quoteHash: 'c73b616363ef74017a085c60acb96de88b57268708d06ed6a5d21fbf5f08b69b'
}

const parsedPegoutQuoteMock: Quotes.PegOutQuoteStruct = {
  lbcAddress: '0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4',
  lpRskAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  btcRefundAddress: new Uint8Array([
    111, 190, 7, 203, 157, 253,
    199, 223, 168, 132, 54, 250,
    65, 40, 65, 14, 33, 38,
    214, 151, 150
  ]),
  rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
  lpBtcAddress: new Uint8Array([
    111, 77, 25, 29, 213, 89,
    98, 105, 251, 153, 254, 72,
    87, 69, 181, 236, 217, 126,
    72, 185, 152
  ]),
  callFee: 1000,
  penaltyFee: 1000000,
  nonce: BigInt(5),
  depositAddress: new Uint8Array([
    111, 31, 27, 78, 105, 91, 54,
    222, 82, 124, 30, 93, 183, 113,
    159, 75, 38, 86, 7, 222, 133
  ]),
  value: BigInt(500000000000000),
  agreementTimestamp: 1683115298,
  depositDateLimit: 3600,
  depositConfirmations: 10,
  transferConfirmations: 1,
  transferTime: 3600,
  expireDate: 1683118898,
  expireBlock: 5023,
  productFeeAmount: BigInt(600000000000000000),
  gasFee: BigInt(44000)
}

describe('PegOutContract class should', () => {

  beforeAll(() => {
    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })
  })

  test('initialize correctly', () => {
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegOutContract(connectionMock, config)
    expect(ethers.Contract).toBeCalled()
    expect(lbc).toHaveProperty('pegoutContract', expect.anything())
  })

  test('execute depositPegout correctly', async () => {
    const receiptMock = { status: 1, hash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }
    const contractMock = {
      depositPegOut: jest.fn().mockImplementation(async () => {
        return Promise.resolve(
          {
            wait: async () => Promise.resolve(receiptMock)
          }
        )
      })
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const amount = BigInt(500)

    const signature = '8cf4893bc89a84486e6f5c57d3d3881796f6eda5d217dfa2a6c49f4c5781d9c6'
    const encodedSignature = [
      140, 244, 137, 59, 200, 154, 132, 72, 110,
      111, 92, 87, 211, 211, 136, 23, 150,
      246, 237, 165, 210, 23, 223, 162, 166,
      196, 159, 76, 87, 129, 217, 198
    ]

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegOutContract(connectionMock, config)

    await lbc.depositPegout(pegoutQuoteMock, signature, amount)

    const normalArrayBytes = Array.from(contractMock.depositPegOut.mock.calls.at(0)?.at(1) as any)
    const normalizedQuote = parsedPegoutQuoteMock
    normalizedQuote.lbcAddress = (normalizedQuote.lbcAddress as string).toLowerCase()
    normalizedQuote.rskRefundAddress = (normalizedQuote.rskRefundAddress as string).toLowerCase()
    normalizedQuote.lpRskAddress = (normalizedQuote.lpRskAddress as string).toLowerCase()
    expect(normalArrayBytes).toEqual(encodedSignature)
    expect(contractMock.depositPegOut).toBeCalledTimes(1)
    expect(serializer.stringify(contractMock.depositPegOut.mock.calls.at(0)?.at(0)))
      .toEqual(serializer.stringify(normalizedQuote))
    expect(contractMock.depositPegOut.mock.calls.at(0)?.at(2)).toEqual({ value: amount })
  })

  test('throw FlyoverError on depositPegout error', async () => {
    const contractMock = {
      depositPegOut: jest.fn().mockImplementation(async () => {
        throw new Error('some error')
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const amount = BigInt(500)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegOutContract(connectionMock, config)

    const signature = '8cf4893bc89a84486e6f5c57d3d3881796f6eda5d217dfa2a6c49f4c5781d9c6'

    expect.assertions(2)
    await lbc.depositPegout(pegoutQuoteMock, signature, amount).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing function depositPegOut')
    })
  })

  test('execute isPegOutQuoteCompleted correctly', async () => {
    const contractMock = {
      isQuoteCompleted: jest.fn().mockReturnValue(Promise.resolve(true))
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegOutContract(connectionMock, config)

    const result = await lbc.isPegOutQuoteCompleted('87a797a48cba94ee585ee2c0d7d6f4cce4dd12f77192a4d0bc562938d6fb62b1')

    expect(contractMock.isQuoteCompleted).toBeCalledTimes(1)
    expect(contractMock.isQuoteCompleted).toBeCalledWith(new Uint8Array([0x87, 0xa7, 0x97, 0xa4, 0x8c, 0xba, 0x94, 0xee, 0x58, 0x5e, 0xe2, 0xc0, 0xd7, 0xd6, 0xf4, 0xcc, 0xe4, 0xdd, 0x12, 0xf7, 0x71, 0x92, 0xa4, 0xd0, 0xbc, 0x56, 0x29, 0x38, 0xd6, 0xfb, 0x62, 0xb1]))
    expect(result).toBe(true)
  })

  describe('execute refundPegout', () => {
    const receiptMock = { status: 1, transactionHash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }
    const contractMock = {
      refundUserPegOut: jest.fn().mockImplementation(async () => {
        return Promise.resolve(
          {
            wait: async () => Promise.resolve(receiptMock)
          }
        )
      }),
      callStatic: {
        refundUserPegOut: jest.fn()
      }
    }

    const encodeQuoteHash = new Uint8Array([
      199, 59, 97, 99, 99, 239, 116, 1,
      122, 8, 92, 96, 172, 185, 109, 232,
      139, 87, 38, 135, 8, 208, 110, 214,
      165, 210, 31, 191, 95, 8, 182, 155
    ])

    beforeEach(() => {
      contractMock.refundUserPegOut.mockClear()
      contractMock.callStatic.refundUserPegOut.mockClear()
    })

    test('generate a transaction by default', async () => {
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegOutContract(connectionMock, config)
      const result = await lbc.refundPegout(pegoutQuoteMock)

      expect(result?.txHash).toEqual(receiptMock.transactionHash)
      expect(result?.successful).toBe(true)
      expect(contractMock.refundUserPegOut).toBeCalledTimes(1)
      expect(contractMock.refundUserPegOut).toHaveBeenCalledWith(encodeQuoteHash)
      expect(contractMock.callStatic.refundUserPegOut).not.toBeCalled()
    })

    test('generate transaction if operation type is execution', async () => {
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegOutContract(connectionMock, config)
      const result = await lbc.refundPegout(pegoutQuoteMock, 'execution')

      expect(result?.txHash).toEqual(receiptMock.transactionHash)
      expect(result?.successful).toBe(true)
      expect(contractMock.refundUserPegOut).toBeCalledTimes(1)
      expect(contractMock.refundUserPegOut).toHaveBeenCalledWith(encodeQuoteHash)
      expect(contractMock.callStatic.refundUserPegOut).not.toBeCalled()
    })

    test("don't generate a transaction if operation type if callStatic", async () => {
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegOutContract(connectionMock, config)
      const result = await lbc.refundPegout(pegoutQuoteMock, 'staticCall')

      expect(result).toBeNull()
      expect(contractMock.callStatic.refundUserPegOut).toBeCalledTimes(1)
      expect(contractMock.callStatic.refundUserPegOut).toHaveBeenCalledWith(encodeQuoteHash)
      expect(contractMock.refundUserPegOut).not.toBeCalled()
    })

    test('fail if operation type is not supported', async () => {
      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegOutContract(connectionMock, config)
      await expect(lbc.refundPegout(pegoutQuoteMock, 'otherOperation' as any)).rejects.toThrow('Unsupported operation type')
    })
  })

  test('throw FlyoverError on refundUserPegOut error', async () => {
    const contractMock = {
      refundUserPegOut: jest.fn().mockImplementation(async () => {
        throw new Error('some error')
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegOutContract(connectionMock, config)

    expect.assertions(2)
    await lbc.refundPegout(pegoutQuoteMock).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing function refundUserPegOut')
    })
  })

  test('get productFeePercentage correctly', async () => {
    const contractMock = {
      getFeePercentage: jest.fn().mockImplementation(async () => Promise.resolve(2))
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegOutContract(connectionMock, config)

    const result = await lbc.getProductFeePercentage()

    expect(contractMock.getFeePercentage).toBeCalledTimes(1)
    expect(result).toEqual(2)
  })
})
