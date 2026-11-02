import { describe, test, jest, expect, beforeAll } from '@jest/globals'
import { BlockchainConnection, BridgeError, ethers, FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { PegInContract } from './pegin'
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

describe('PegInContract class should', () => {
  let resolvePeginParams: RegisterPeginLbcParams
  let btcTxMock: any

  beforeAll(async () => {
    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })
    btcTxMock = await readFile('src/blockchain/mocks/btcTxMock.json').then(buffer => JSON.parse(buffer.toString()))
    resolvePeginParams = {
      rskAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
      btcRawTransaction: btcTxMock.rawTx,
      height: 501,
      partialMerkleTree: '0200000002a2e4c3ee20febe6276705eac0df30e0457215069e058b2c1a2e771f0a70892f6a0025d9a02e5990ac75f3d3a8515aecf723fd53e57fcf8ae2f95951df9b483fc0105'
    }
  })

  test('initialize correctly', () => {
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)
    expect(ethers.Contract).toBeCalled()
    expect(lbc).toHaveProperty('peginContract', expect.anything())
  })

  describe('resolvePegin', () => {
    const FAKE_RECEIPT = { status: 1, hash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }
    const contractMock = {
      resolvePegIn: jest.fn().mockImplementation(async () => {
        return Promise.resolve(
          {
            wait: async () => Promise.resolve(FAKE_RECEIPT)
          }
        )
      }),
      pauseStatus: jest.fn().mockImplementation(async () => Promise.resolve([false, '', BigInt(0)])),
      callStatic: {
        resolvePegIn: jest.fn().mockImplementation(async () => Promise.resolve({ toBigInt: () => BigInt(7) }))
      }
    }

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

    test('execute resolvePegIn correctly', async () => {
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegInContract(connectionMock, config)
      await lbc.resolvePegin(resolvePeginParams)
      expect(contractMock.resolvePegIn).toBeCalledTimes(1)
      expect(contractMock.callStatic.resolvePegIn).not.toHaveBeenCalled()
      expect(contractMock.resolvePegIn.mock.calls.at(0)?.at(0)).toEqual(resolvePeginParams.rskAddress.toLowerCase())
      expect(Array.from(contractMock.resolvePegIn.mock.calls.at(0)?.at(1) as any)).toEqual(btcTxMock.encodedRawTx)
      expect(Array.from(contractMock.resolvePegIn.mock.calls.at(0)?.at(2) as any)).toEqual(encodedPmt)
      expect(contractMock.resolvePegIn.mock.calls.at(0)?.at(3)).toEqual(resolvePeginParams.height)
    })

    test('make a static call to resolvePegIn correctly', async () => {
      contractMock.resolvePegIn.mockClear()
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const liquidityBridgeContract = new PegInContract(connectionMock, config)

      const result = await liquidityBridgeContract.simulateResolvePegin(resolvePeginParams)

      expect(contractMock.callStatic.resolvePegIn).toHaveBeenCalledTimes(1)
      expect(contractMock.resolvePegIn).not.toHaveBeenCalled()
      expect(contractMock.callStatic.resolvePegIn.mock.calls.at(0)?.at(0)).toEqual(resolvePeginParams.rskAddress.toLowerCase())
      expect(Array.from(contractMock.callStatic.resolvePegIn.mock.calls.at(0)?.at(1) as any)).toEqual(btcTxMock.encodedRawTx)
      expect(Array.from(contractMock.callStatic.resolvePegIn.mock.calls.at(0)?.at(2) as any)).toEqual(encodedPmt)
      expect(contractMock.callStatic.resolvePegIn.mock.calls.at(0)?.at(3)).toEqual(resolvePeginParams.height)
      expect(result).toEqual(BigInt(7))
    })

    test('throw FlyoverError on resolvePegIn execution error', async () => {
      contractMock.resolvePegIn = jest.fn().mockImplementation(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })

      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const lbc = new PegInContract(connectionMock, config)
      expect.assertions(3)
      await lbc.resolvePegin(resolvePeginParams).catch(e => {
        expect(e).toBeInstanceOf(BridgeError)
        expect(e.message).toBe('error executing function resolvePegIn')
        expect(e.details.error).toBe(FAKE_ERROR_MESSAGE)
      })
    })

    test('throw FlyoverError on resolvePegIn contract paused', async () => {
      const pausedMock = {
        pauseStatus: jest.fn().mockImplementationOnce(async () => Promise.resolve([true, 'maintenance', BigInt(123456)]))
      }
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => pausedMock as any)
      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const liquidityBridgeContract = new PegInContract(connectionMock, config)
      expect.assertions(4)
      await liquidityBridgeContract.resolvePegin(resolvePeginParams).catch(e => {
        expect(e).toBeInstanceOf(FlyoverError)
        expect(e.message).toBe('Protocol paused')
        expect(e.details.reason).toBe('maintenance')
        expect(e.details.timestamp).toBe(123456)
      })
    })

    test('throw FlyoverError on resolvePegIn static call error', async () => {
      contractMock.callStatic.resolvePegIn = jest.fn().mockImplementation(async () => {
        throw new Error(FAKE_ERROR_MESSAGE)
      })
      const contractClassMock = jest.mocked(ethers.Contract)
      contractClassMock.mockImplementation(() => contractMock as any)

      const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
      const liquidityBridgeContract = new PegInContract(connectionMock, config)
      expect.assertions(3)
      await liquidityBridgeContract.simulateResolvePegin(resolvePeginParams).catch(e => {
        expect(e).toBeInstanceOf(BridgeError)
        expect(e.message).toBe('error during static call to function resolvePegIn')
        expect(e.details.error.message).toBe(FAKE_ERROR_MESSAGE)
      })
    })
  })

  describe('getEip712Domain function should', () => {
    const contractMock = {
      eip712Domain: jest.fn()
        .mockImplementation(async () => Promise.resolve(['', 'Flyover PegIn', '1', 1234, '0x1234567890abcdef1234567890abcdef12345678'])),
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new PegInContract(connectionMock, config)

    test('return correct domain', async () => {
      const domain = await lbc.getEip712Domain()
      expect(serializer.stringify(domain)).toEqual(serializer.stringify({
        name: 'Flyover PegIn',
        version: '1',
        chainId: 1234,
        verifyingContract: '0x1234567890abcdef1234567890abcdef12345678'
      }))
    })
  })
})
