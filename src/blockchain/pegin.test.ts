import { describe, test, jest, expect } from '@jest/globals'
import { BlockchainConnection, ethers, FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { PegInContract } from './pegin'
import JSONbig from 'json-bigint'
import { RegisterPeginLbcParams } from '../sdk/registerPegin'
import { Quote as PeginQuote } from '../api'
import { FlyoverError } from '../client/httpClient'

jest.mock('ethers')

const serializer = JSONbig({ useNativeBigInt: true })
const signerMock = jest.mocked({})
const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () {
    return signerMock
  }
} as BlockchainConnection)
const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }

describe('PegInContract class should', () => {
  test('initialize correctly', () => {
    const lbc = new PegInContract(connectionMock, config)
    expect(ethers.Contract).toBeCalled()
    expect(lbc).toHaveProperty('peginContract', expect.anything())
  })

  describe('functions removed from the contract', () => {
    const contractMock = {
      registerPegIn: jest.fn(),
      validatePegInDepositAddress: jest.fn(),
      callStatic: { registerPegIn: jest.fn() }
    }
    const quote = { quote: {}, quoteHash: 'hash' } as unknown as PeginQuote
    const registerParams = {} as RegisterPeginLbcParams

    const expectRemoved = async (call: Promise<unknown>, functionName: string): Promise<void> => {
      const message = `${functionName} is no longer part of the PegIn contract`
      const error: any = await call.then(() => undefined, (e: unknown) => e)
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe(message)
      expect(error.recoverable).toBe(false)
      expect(error.details.error).toBeInstanceOf(Error)
      expect(error.details.error.message).toBe(message)
    }

    test('reject validatePeginDepositAddress without calling the contract', async () => {
      jest.mocked(ethers.Contract).mockImplementation(() => contractMock as any)
      const lbc = new PegInContract(connectionMock, config)
      await expectRemoved(lbc.validatePeginDepositAddress(quote, 'address'), 'validatePegInDepositAddress')
      expect(contractMock.validatePegInDepositAddress).not.toHaveBeenCalled()
    })

    test.each(['execution', 'staticCall'] as const)('reject registerPegin with action %s without calling the contract', async (action) => {
      jest.mocked(ethers.Contract).mockImplementation(() => contractMock as any)
      const lbc = new PegInContract(connectionMock, config)
      await expectRemoved(lbc.registerPegin(registerParams, action), 'registerPegIn')
      expect(contractMock.registerPegIn).not.toHaveBeenCalled()
      expect(contractMock.callStatic.registerPegIn).not.toHaveBeenCalled()
    })

    test('reject registerPegin when no action is provided', async () => {
      jest.mocked(ethers.Contract).mockImplementation(() => contractMock as any)
      const lbc = new PegInContract(connectionMock, config)
      await expectRemoved(lbc.registerPegin(registerParams), 'registerPegIn')
    })
  })

  describe('getEip712Domain function should', () => {
    const contractMock = {
      eip712Domain: jest.fn()
        .mockImplementation(async () => Promise.resolve(['', 'Flyover PegIn', '1', 1234, '0x1234567890abcdef1234567890abcdef12345678'])),
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
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
