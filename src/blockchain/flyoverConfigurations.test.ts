import { describe, test, jest, expect } from '@jest/globals'
import { type BlockchainConnection, ethers, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { FlyoverConfigurationsContract } from './flyoverConfigurations'

jest.mock('ethers')

const { BigNumber } = jest.requireActual<typeof ethers>('ethers')

const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () { return jest.mocked({}) }
} as BlockchainConnection)

const CONFIG_ADDRESS = '0x4186a8ecd32cf005a5122b63195f7117cbc4be19'

const config: FlyoverConfig = {
  network: 'Regtest',
  captchaTokenResolver: async () => Promise.resolve(''),
  customFlyoverConfigurationsAddress: CONFIG_ADDRESS
}

const onchainPegOutConfiguration = {
  fixedFee: BigNumber.from('100000000000000'),
  percentageFee: BigNumber.from('10'),
  minAmount: BigNumber.from('5000000000000000'),
  maxAmount: BigNumber.from('10000000000000000000'),
  confirmationTiers: [
    { maxAmount: BigNumber.from('100000000000000000'), confirmations: BigNumber.from('2') },
    { maxAmount: BigNumber.from('1000000000000000000'), confirmations: BigNumber.from('20') }
  ],
  penaltyFee: BigNumber.from('10000000000000000'),
  claimWindow: BigNumber.from('1800'),
  claimWindowBlocks: BigNumber.from('600'),
  callTime: BigNumber.from('7200'),
  expireTime: BigNumber.from('14400'),
  expireBlocks: BigNumber.from('3300'),
  maxMinerFee: BigNumber.from('500000000000000')
}

function mockContract (functions: Record<string, unknown>): void {
  jest.mocked(ethers.Contract).mockImplementation(() => ({ address: CONFIG_ADDRESS, ...functions }) as any)
}

describe('FlyoverConfigurationsContract should', () => {
  test('throw when neither a network default nor a custom address is available', () => {
    const noAddress: FlyoverConfig = { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') }
    expect(() => new FlyoverConfigurationsContract(connectionMock, noAddress)).toThrow(/invalid FlyoverConfigurations address/)
  })

  test('use the custom address', async () => {
    mockContract({})
    const configurations = new FlyoverConfigurationsContract(connectionMock, config)
    expect(ethers.Contract).toHaveBeenLastCalledWith(CONFIG_ADDRESS, expect.anything(), expect.anything())
    await expect(configurations.getAddress()).resolves.toBe(CONFIG_ADDRESS)
  })

  test('normalize getPegOutConfiguration into bigints, read at the given block', async () => {
    const getPegOutConfiguration = jest.fn<() => Promise<any>>().mockResolvedValue(onchainPegOutConfiguration)
    mockContract({ getPegOutConfiguration })

    const result = await new FlyoverConfigurationsContract(connectionMock, config).getPegOutConfiguration(77)

    expect(getPegOutConfiguration).toBeCalledWith({ blockTag: 77 })
    expect(result).toEqual({
      fixedFee: BigInt('100000000000000'),
      percentageFee: BigInt(10),
      minAmount: BigInt('5000000000000000'),
      maxAmount: BigInt('10000000000000000000'),
      confirmationTiers: [
        { maxAmount: BigInt('100000000000000000'), confirmations: BigInt(2) },
        { maxAmount: BigInt('1000000000000000000'), confirmations: BigInt(20) }
      ],
      penaltyFee: BigInt('10000000000000000'),
      claimWindow: BigInt(1800),
      claimWindowBlocks: BigInt(600),
      callTime: BigInt(7200),
      expireTime: BigInt(14400),
      expireBlocks: BigInt(3300),
      maxMinerFee: BigInt('500000000000000')
    })
  })

  test('read calculatePegOutFee at the given block', async () => {
    const calculatePegOutFee = jest.fn<() => Promise<any>>().mockResolvedValue(BigNumber.from('105000000000000'))
    mockContract({ calculatePegOutFee })

    const fee = await new FlyoverConfigurationsContract(connectionMock, config)
      .calculatePegOutFee(BigInt('5000000000000000'), 77)

    expect(calculatePegOutFee).toBeCalledWith(BigInt('5000000000000000'), { blockTag: 77 })
    expect(fee).toBe(BigInt('105000000000000'))
  })

  test('read getRequiredPegOutBtcConfirmations at the given block', async () => {
    const getRequiredPegOutBtcConfirmations = jest.fn<() => Promise<any>>().mockResolvedValue(BigNumber.from('20'))
    mockContract({ getRequiredPegOutBtcConfirmations })

    const confirmations = await new FlyoverConfigurationsContract(connectionMock, config)
      .getRequiredPegOutBtcConfirmations(BigInt('500000000000000000'), 77)

    expect(getRequiredPegOutBtcConfirmations).toBeCalledWith(BigInt('500000000000000000'), { blockTag: 77 })
    expect(confirmations).toBe(BigInt(20))
  })
})
