import { describe, test, jest, expect } from '@jest/globals'
import { ethers, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { FlyoverConfigurationsContract } from './flyoverConfigurations'
import { type FlyoverPeginConfig } from '../constants/networks'

jest.mock('ethers')

const { BigNumber } = jest.requireActual<typeof ethers>('ethers')

const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () { return jest.mocked({}) }
} as any)

const CONFIG_ADDRESS = '0x4186a8ecd32cf005a5122b63195f7117cbc4be19'

const baseConfig: FlyoverPeginConfig = {
  network: 'Regtest',
  captchaTokenResolver: async () => Promise.resolve('')
}

describe('FlyoverConfigurationsContract should', () => {
  test('throw when neither network default nor custom configurations address is available', () => {
    const config: FlyoverConfig = { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') }
    expect(() => new FlyoverConfigurationsContract(connectionMock, config)).toThrow(/invalid FlyoverConfigurations address/)
  })

  test('read calculatePegInFee from chain and return a bigint', async () => {
    const calculatePegInFee = jest.fn<() => Promise<any>>().mockResolvedValue(BigNumber.from('12345'))
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: CONFIG_ADDRESS, calculatePegInFee } as any))

    const configurations = new FlyoverConfigurationsContract(connectionMock, baseConfig)
    const fee = await configurations.calculatePegInFee(BigInt('1000000000000000000'))

    expect(calculatePegInFee).toHaveBeenCalledWith(BigInt('1000000000000000000'))
    expect(fee).toBe(BigInt('12345'))
    expect(typeof fee).toBe('bigint')
  })

  test('read getRequiredPegInConfirmations from chain and return a bigint', async () => {
    const getRequiredPegInConfirmations = jest.fn<() => Promise<any>>().mockResolvedValue(BigNumber.from('3'))
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: CONFIG_ADDRESS, getRequiredPegInConfirmations } as any))

    const configurations = new FlyoverConfigurationsContract(connectionMock, baseConfig)
    const confirmations = await configurations.getRequiredPegInConfirmations(BigInt('500000000000000000'))

    expect(confirmations).toBe(BigInt('3'))
  })

  test('normalize getPegInConfiguration into a bigint view', async () => {
    const onchain = {
      fixedFee: BigNumber.from('1000'),
      percentageFee: BigNumber.from('10'),
      penaltyFee: BigNumber.from('5'),
      confirmationTiers: [
        { maxAmount: BigNumber.from('100'), confirmations: BigNumber.from('1') },
        { maxAmount: BigNumber.from('1000'), confirmations: BigNumber.from('3') }
      ],
      callTime: BigNumber.from('7200'),
      expireTime: BigNumber.from('9000'),
      expireBlocks: BigNumber.from('500'),
      deliveryGrace: BigNumber.from('120'),
      minAmount: BigNumber.from('1'),
      maxAmount: BigNumber.from('100000')
    }
    const getPegInConfiguration = jest.fn<() => Promise<any>>().mockResolvedValue(onchain)
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: CONFIG_ADDRESS, getPegInConfiguration } as any))

    const configurations = new FlyoverConfigurationsContract(connectionMock, baseConfig)
    const config = await configurations.getPegInConfiguration()

    expect(config.fixedFee).toBe(BigInt('1000'))
    expect(config.percentageFee).toBe(BigInt('10'))
    expect(config.confirmationTiers).toHaveLength(2)
    expect(config.confirmationTiers[0]).toEqual({ maxAmount: BigInt('100'), confirmations: BigInt('1') })
    expect(config.maxAmount).toBe(BigInt('100000'))
  })
})
