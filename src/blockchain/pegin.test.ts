import { describe, test, jest, expect, beforeAll } from '@jest/globals'
import { BlockchainConnection, BridgeError, ethers, FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { PegInContract } from './pegin'
import { Quotes } from './bindings/Pegin'
import { Quote as PeginQuote } from '../api'
import JSONbig from 'json-bigint'
import { RegisterPeginLbcParams } from '../sdk/registerPegin'
import { readFile } from 'fs/promises'
import { FlyoverError } from '../client/httpClient'

jest.mock('ethers')

const FAKE_ERROR_MESSAGE = 'some error'
const serializer = JSONbig({ useNativeBigInt: true })
const signerMock = jest.mocked({})
const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () {
    return signerMock
  }
} as BlockchainConnection)

const peginQuoteMock: PeginQuote = {
  quote: {
    fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
    lbcAddr: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
    lpRSKAddr: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    btcRefundAddr: 'mg1A4mgNu5DDovXGtwMBkf9AcZFLBxvhzq',
    rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
    lpBTCAddr: 'mnYcQxCZBbmLzNfE9BhV7E8E2u7amdz5y6',
    callFee: BigInt(1000000000000000),
    penaltyFee: BigInt(1000000),
    contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
    data: '0x1a1b1c',
    gasLimit: 46000,
    nonce: BigInt('7591081102472764799'),
    value: BigInt(600000000000000000),
    agreementTimestamp: 1690985578,
    timeForDeposit: 3600,
    lpCallTime: 7200,
    confirmations: 10,
    callOnRegister: false,
    gasFee: BigInt(600000000000000),
    productFeeAmount: BigInt(600000000000000000)
  },
  quoteHash: '20be065f497b9b7250a13641f829f1f5466a9c1036d5843e46cb90e278b45f9b'
}

const parsedPeginQuoteMock: Quotes.PegInQuoteStruct = {
  fedBtcAddress: new Uint8Array([
    137, 110, 217, 243, 68, 109, 81,
    181, 81, 15, 127, 11, 110, 248,
    27, 43, 222, 85, 20, 14
  ]),
  lbcAddress: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
  liquidityProviderRskAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  btcRefundAddress: new Uint8Array([
    111, 5, 85, 121, 12, 236, 37, 72,
    190, 221, 46, 76, 178, 48, 57, 241,
    4, 240, 40, 33, 134
  ]),
  rskRefundAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  liquidityProviderBtcAddress: new Uint8Array([
    111, 77, 25, 29, 213, 89, 98, 105,
    251, 153, 254, 72, 87, 69, 181,
    236, 217, 126, 72, 185, 152
  ]),
  callFee: BigInt(1000000000000000),
  penaltyFee: 1000000,
  contractAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  data: '0x1a1b1c',
  gasLimit: 46000,
  nonce: BigInt('7591081102472764799'),
  value: BigInt(600000000000000000),
  agreementTimestamp: 1690985578,
  timeForDeposit: 3600,
  callTime: 7200,
  depositConfirmations: 10,
  callOnRegister: false,
  productFeeAmount: BigInt(600000000000000000),
  gasFee: BigInt(600000000000000)
}

describe('PegInContract class should', () => {
  let registerPeginParams: RegisterPeginLbcParams
  let btcTxMock: any

  beforeAll(async () => {
    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })
    btcTxMock = await readFile('src/blockchain/mocks/btcTxMock.json').then(buffer => JSON.parse(buffer.toString()))
    const quote = peginQuoteMock
    const signature = '07cea1bed6da0994f7ae2f0669b82a033e1b519b964b8f7620a1d65c0c40d3500a8b2eab708c7601eb1bc32de9739f4a2865f72c6b58abbdbf793c5a4e7f64641c'
    const btcRawTransaction = btcTxMock.rawTx
    const height = 501
    const partialMerkleTree = '0200000002a2e4c3ee20febe6276705eac0df30e0457215069e058b2c1a2e771f0a70892f6a0025d9a02e5990ac75f3d3a8515aecf723fd53e57fcf8ae2f95951df9b483fc0105'
    registerPeginParams = { quote, signature, btcRawTransaction, height, partialMerkleTree }
  })

  test('initialize correctly', () => {
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)
    expect(ethers.Contract).toBeCalled()
    expect(lbc).toHaveProperty('peginContract', expect.anything())
  })

  describe('registerPegin', () => {
    const FAKE_RECEIPT = { status: 1, hash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }
    const contractMock = {
      registerPegIn: jest.fn().mockImplementation(async () => {
        return Promise.resolve(
          {
            wait: async () => Promise.resolve(FAKE_RECEIPT)
          }
        )
      }),
      pauseStatus: jest.fn().mockImplementation(async () => Promise.resolve([false, '', BigInt(0)])),
      callStatic: {
        registerPegIn: jest.fn().mockImplementation(async () => Promise.resolve(FAKE_RECEIPT))
      }
    }

    const encodedSignature = [
      7, 206, 161, 190, 214, 218, 9, 148,
      247, 174, 47, 6, 105, 184, 42, 3,
      62, 27, 81, 155, 150, 75, 143, 118,
      32, 161, 214, 92, 12, 64, 211, 80,
      10, 139, 46, 171, 112, 140, 118, 1,
      235, 27, 195, 45, 233, 115, 159, 74,
      40, 101, 247, 44, 107, 88, 171, 189,
      191, 121, 60, 90, 78, 127, 100, 100,
      28
    ]

    const encodedPmt = [
      2, 0, 0, 0, 2, 162, 228, 195, 238,
      32, 254, 190, 98, 118, 112, 94,
      172, 13, 243, 14, 4, 87, 33, 80,
      105, 224, 88, 178, 193, 162, 231,
      113, 240, 167, 8, 146, 246, 160, 2,
      93, 154, 2, 229, 153, 10, 199, 95,
      61, 58, 133, 21, 174, 207, 114, 63,
      213, 62, 87, 252, 248, 174, 47, 149,
      149, 29, 249, 180, 131, 252, 1, 5
    ]

    const normalizedQuote = parsedPeginQuoteMock
    normalizedQuote.lbcAddress = (normalizedQuote.lbcAddress as string).toLowerCase()
    normalizedQuote.rskRefundAddress = (normalizedQuote.rskRefundAddress as string).toLowerCase()
    normalizedQuote.contractAddress = (normalizedQuote.contractAddress as string).toLowerCase()
    normalizedQuote.liquidityProviderRskAddress = (normalizedQuote.liquidityProviderRskAddress as string).toLowerCase()

    test('execute registerPegin when no action is provided', async () => {
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegInContract(connectionMock, config)
      await lbc.registerPegin(
        registerPeginParams
      )
      expect(contractMock.registerPegIn).toBeCalledTimes(1)
      expect(contractMock.callStatic.registerPegIn).not.toHaveBeenCalled()
      expect(serializer.stringify(contractMock.registerPegIn.mock.calls.at(0)?.at(0))).toEqual(serializer.stringify(normalizedQuote))
      expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(1) as any)).toEqual(encodedSignature)
      expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(2) as any)).toEqual(btcTxMock.encodedRawTx)
      expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(3) as any)).toEqual(encodedPmt)
      expect(contractMock.registerPegIn.mock.calls.at(0)?.at(4)).toEqual(registerPeginParams.height)
    })

    test('execute registerPegin when action is execution', async () => {
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegInContract(connectionMock, config)
      await lbc.registerPegin(
        registerPeginParams,
        'execution'
      )
      expect(contractMock.registerPegIn).toBeCalledTimes(1)
      expect(contractMock.callStatic.registerPegIn).not.toHaveBeenCalled()
      expect(serializer.stringify(contractMock.registerPegIn.mock.calls.at(0)?.at(0))).toEqual(serializer.stringify(normalizedQuote))
      expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(1) as any)).toEqual(encodedSignature)
      expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(2) as any)).toEqual(btcTxMock.encodedRawTx)
      expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(3) as any)).toEqual(encodedPmt)
      expect(contractMock.registerPegIn.mock.calls.at(0)?.at(4)).toEqual(registerPeginParams.height)
    })

    test('make a static call to registerPegin correctly', async () => {
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const liquidityBridgeContract = new PegInContract(connectionMock, config)

      const result = await liquidityBridgeContract.registerPegin(registerPeginParams, 'staticCall')

      expect(contractMock.callStatic.registerPegIn).toHaveBeenCalledTimes(1)
      expect(contractMock.registerPegIn).not.toHaveBeenCalled()
      expect(serializer.stringify(contractMock.callStatic.registerPegIn.mock.calls.at(0)?.at(0))).toEqual(serializer.stringify(normalizedQuote))
      expect(Array.from(contractMock.callStatic.registerPegIn.mock.calls.at(0)?.at(1) as any)).toEqual(encodedSignature)
      expect(Array.from(contractMock.callStatic.registerPegIn.mock.calls.at(0)?.at(2) as any)).toEqual(btcTxMock.encodedRawTx)
      expect(Array.from(contractMock.callStatic.registerPegIn.mock.calls.at(0)?.at(3) as any)).toEqual(encodedPmt)
      expect(contractMock.callStatic.registerPegIn.mock.calls.at(0)?.at(4)).toEqual(registerPeginParams.height)
      expect(result).toEqual(FAKE_RECEIPT)
    })

    test('throw error on invalid action', async () => {
      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegInContract(connectionMock, config)
      await expect(lbc.registerPegin(registerPeginParams, 'invalidAction' as any)).rejects.toThrow('Invalid action')
    })

    test('throw FlyoverError on registerPegin execution error', async () => {
      contractMock.registerPegIn = jest.fn().mockImplementation(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })

      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegInContract(connectionMock, config)
      expect.assertions(3)
      await lbc.registerPegin(registerPeginParams, 'execution').catch(e => {
        expect(e).toBeInstanceOf(BridgeError)
        expect(e.message).toBe('error executing function registerPegIn')
        expect(e.details.error).toBe(FAKE_ERROR_MESSAGE)
      })
    })

    test('throw FlyoverError on registerPegin contract paused', async () => {
      const pausedMock = {
        pauseStatus: jest.fn().mockImplementationOnce(async () => Promise.resolve([true, 'maintenance', BigInt(123456)]))
      }
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => pausedMock as any)
      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const liquidityBridgeContract = new PegInContract(connectionMock, config)
      expect.assertions(4)
      await liquidityBridgeContract.registerPegin(registerPeginParams, 'execution').catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Protocol paused')
        expect(e.details.reason).toBe('maintenance')
        expect(e.details.timestamp).toBe(123456)
      })
    })

    test('throw FlyoverError on registerPegin static call error', async () => {
      contractMock.callStatic.registerPegIn = jest.fn().mockImplementation(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const liquidityBridgeContract = new PegInContract(connectionMock, config)
      expect.assertions(3)
      await liquidityBridgeContract.registerPegin(registerPeginParams, 'staticCall').catch(e => {
        expect(e).toBeInstanceOf(BridgeError)
        expect(e.message).toBe('error during static call to function registerPegIn')
        expect(e.details.error.message).toBe(FAKE_ERROR_MESSAGE)
      })
    })
  })

  test('execute validatePegInDepositAddress correctly', async () => {
    const contractMock = {
      validatePegInDepositAddress: jest.fn().mockImplementation(async () => {
        return Promise.resolve(true)
      })
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })

    const config: FlyoverConfig = {
      network: 'Regtest',
      captchaTokenResolver: async () => Promise.resolve('')
    }
    const lbc = new PegInContract(connectionMock, config)
    jest.spyOn(ethers.utils.base58, 'decode').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.base58.decode(arg)
    })

    await lbc.validatePeginDepositAddress(peginQuoteMock, '2NB9Rp6DxS4WXefGoyNLa5rQWkcQtUM1FmF')

    const decodedAddress = [
      196, 196, 89, 163, 131, 210, 22, 251, 195,
      243, 191, 43, 188, 17, 192, 94, 140, 234,
      13, 179, 0, 100, 171, 220, 94
    ]

    const normalizedQuote = parsedPeginQuoteMock
    normalizedQuote.lbcAddress = (normalizedQuote.lbcAddress as string).toLowerCase()
    normalizedQuote.rskRefundAddress = (normalizedQuote.rskRefundAddress as string).toLowerCase()
    normalizedQuote.contractAddress = (normalizedQuote.contractAddress as string).toLowerCase()
    normalizedQuote.liquidityProviderRskAddress = (normalizedQuote.liquidityProviderRskAddress as string).toLowerCase()
    expect(contractMock.validatePegInDepositAddress).toBeCalledTimes(1)
    expect(serializer.stringify(contractMock.validatePegInDepositAddress.mock.calls.at(0)?.at(0))).toEqual(serializer.stringify(normalizedQuote))
    expect(Array.from(contractMock.validatePegInDepositAddress.mock.calls.at(0)?.at(1) as any)).toEqual(decodedAddress)
  })

  test('throw FlyoverError on validatePegInDepositAddress error', async () => {
    const contractMock = {
      validatePegInDepositAddress: jest.fn().mockImplementation(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)
    expect.assertions(2)
    await lbc.validatePeginDepositAddress(peginQuoteMock, '2NB9Rp6DxS4WXefGoyNLa5rQWkcQtUM1FmF').catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing view validatePegInDepositAddress')
    })
  })


  test('execute validatePegInDepositAddress correctly', async () => {
    const contractMock = {
      validatePegInDepositAddress: jest.fn().mockImplementation(async () => {
        return Promise.resolve(true)
      })
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = {
      network: 'Regtest',
      captchaTokenResolver: async () => Promise.resolve('')
    }
    const lbc = new PegInContract(connectionMock, config)
    jest.spyOn(ethers.utils.base58, 'decode').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.base58.decode(arg)
    })

    await lbc.validatePeginDepositAddress(peginQuoteMock, '2NB9Rp6DxS4WXefGoyNLa5rQWkcQtUM1FmF')

    const decodedAddress = [
      196, 196, 89, 163, 131, 210, 22, 251, 195,
      243, 191, 43, 188, 17, 192, 94, 140, 234,
      13, 179, 0, 100, 171, 220, 94
    ]

    const normalizedQuote = parsedPeginQuoteMock
    normalizedQuote.lbcAddress = (normalizedQuote.lbcAddress as string).toLowerCase()
    normalizedQuote.rskRefundAddress = (normalizedQuote.rskRefundAddress as string).toLowerCase()
    normalizedQuote.contractAddress = (normalizedQuote.contractAddress as string).toLowerCase()
    normalizedQuote.liquidityProviderRskAddress = (normalizedQuote.liquidityProviderRskAddress as string).toLowerCase()
    expect(contractMock.validatePegInDepositAddress).toBeCalledTimes(1)
    expect(serializer.stringify(contractMock.validatePegInDepositAddress.mock.calls.at(0)?.at(0))).toEqual(serializer.stringify(normalizedQuote))
    expect(Array.from(contractMock.validatePegInDepositAddress.mock.calls.at(0)?.at(1) as any)).toEqual(decodedAddress)
  })

  test('throw FlyoverError on validatePegInDepositAddress error', async () => {
    const contractMock = {
      validatePegInDepositAddress: jest.fn().mockImplementation(async () => {
        throw new Error('some error')
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)
    expect.assertions(2)
    await lbc.validatePeginDepositAddress(peginQuoteMock, '2NB9Rp6DxS4WXefGoyNLa5rQWkcQtUM1FmF').catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing view validatePegInDepositAddress')
    })
  })

  test('get productFeePercentage correctly', async () => {
    const contractMock = {
      getFeePercentage: jest.fn().mockImplementation(async () => Promise.resolve(2))
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)

    const result = await lbc.getProductFeePercentage()

    expect(contractMock.getFeePercentage).toBeCalledTimes(1)
    expect(result).toEqual(2)
  })

  test('normalize 0x prefix when parsing pegin quote', async () => {
    const contractMock = {
      hashPegInQuote: jest.fn().mockReturnValue(Promise.resolve([0x01, 0x05, 0x07]))
    }
    jest.spyOn(ethers.utils, 'hexlify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.hexlify(arg)
    })
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)
    const prefixedMock = peginQuoteMock
    const notPrefixedMock = structuredClone(peginQuoteMock)
    notPrefixedMock.quote.data = notPrefixedMock.quote.data.slice(2)
    await expect(lbc.hashPeginQuote(prefixedMock)).resolves.not.toThrow()
    await expect(lbc.hashPeginQuote(notPrefixedMock)).resolves.not.toThrow()
    expect(serializer.stringify(contractMock.hashPegInQuote.mock.calls[0]?.[0])).toBe(serializer.stringify(parsedPeginQuoteMock))
    expect(serializer.stringify(contractMock.hashPegInQuote.mock.calls[1]?.[0])).toBe(serializer.stringify(parsedPeginQuoteMock))
  })
})
