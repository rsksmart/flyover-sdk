import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { calculatePegoutFee, estimatePegout, pegoutValueForAmount, splitPegoutValue } from './estimatePegout'
import { type PegOutConfiguration } from '../blockchain/flyoverConfigurations'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { FlyoverError } from '../client/httpClient'
import { SAT_TO_WEI } from '../constants/units'

const ETHER = BigInt('1000000000000000000')

// Provisional regtest values from liquidity-bridge-contract v3.0.0 FlyoverConfigurationsRegtest.pegOutConfig
const regtestConfig: PegOutConfiguration = {
  fixedFee: ETHER / BigInt(10_000),
  percentageFee: BigInt(10),
  minAmount: ETHER / BigInt(200),
  maxAmount: ETHER * BigInt(10),
  confirmationTiers: [
    { maxAmount: ETHER / BigInt(10), confirmations: BigInt(2) },
    { maxAmount: ETHER, confirmations: BigInt(20) },
    { maxAmount: ETHER * BigInt(10), confirmations: BigInt(100) }
  ],
  penaltyFee: ETHER / BigInt(100),
  claimWindow: BigInt(1800),
  claimWindowBlocks: BigInt(600),
  callTime: BigInt(7200),
  expireTime: BigInt(14400),
  expireBlocks: BigInt(3300),
  maxMinerFee: ETHER / BigInt(2000)
}
// v3.0.0 HelperConfig DUST_THRESHOLD_LOCAL default
const regtestDust = BigInt(10_000)

const MIN_AMOUNT_CALL_FEE = regtestConfig.fixedFee + regtestConfig.minAmount * regtestConfig.percentageFee / BigInt(10_000)
const MIN_AMOUNT_VALUE = regtestConfig.minAmount + MIN_AMOUNT_CALL_FEE + regtestConfig.maxMinerFee

const BLOCK_NUMBER = 1234
const BLOCK_TIMESTAMP = 1_700_000_000

interface ContextMock {
  context: FlyoverSDKContext
  configurations: {
    getPegOutConfiguration: jest.Mock<any>
    calculatePegOutFee: jest.Mock<any>
    getRequiredPegOutBtcConfirmations: jest.Mock<any>
  }
  pegOutContract: { getDustThreshold: jest.Mock<any> }
  httpClient: { get: jest.Mock<any>, post: jest.Mock<any>, getCaptchaToken: jest.Mock<any> }
}

function contextMock (config: PegOutConfiguration, dustThreshold: bigint): ContextMock {
  const configurations = {
    getPegOutConfiguration: jest.fn<any>().mockResolvedValue(config),
    calculatePegOutFee: jest.fn<any>().mockImplementation(async (amount: bigint) => calculatePegoutFee(config, amount)),
    getRequiredPegOutBtcConfirmations: jest.fn<any>().mockImplementation(async (amount: bigint) =>
      config.confirmationTiers.find(tier => amount <= tier.maxAmount)?.confirmations)
  }
  const pegOutContract = { getDustThreshold: jest.fn<any>().mockResolvedValue(dustThreshold) }
  const httpClient = { get: jest.fn<any>(), post: jest.fn<any>(), getCaptchaToken: jest.fn<any>() }
  const provider = { getBlock: jest.fn<any>().mockResolvedValue({ number: BLOCK_NUMBER, timestamp: BLOCK_TIMESTAMP }) }
  const context = {
    config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') },
    httpClient,
    rskConnection: { getUnderlyingProvider: () => provider },
    lbc: { flyoverConfigurations: configurations, pegOutContract }
  } as unknown as FlyoverSDKContext
  return { context, configurations, pegOutContract, httpClient }
}

describe('calculatePegoutFee should', () => {
  test('apply the fixed and percentage fee and floor it to a satoshi', () => {
    const amount = BigInt('5000010000000000')
    // 1e14 + 5000010000000 = 105000010000000, floored to 105000000000000
    expect(calculatePegoutFee(regtestConfig, amount)).toBe(BigInt('105000000000000'))
  })

  test('not floor a fee of at most one satoshi', () => {
    const config = { fixedFee: BigInt(0), percentageFee: BigInt(10) }
    expect(calculatePegoutFee(config, BigInt('5000000000000'))).toBe(BigInt('5000000000'))
    expect(calculatePegoutFee(config, SAT_TO_WEI * BigInt(1000))).toBe(SAT_TO_WEI)
  })
})

describe('splitPegoutValue should', () => {
  test('split the value like PegOutEscrow.requestPegOut', () => {
    const split = splitPegoutValue(MIN_AMOUNT_VALUE, regtestConfig, regtestDust)
    expect(split).toEqual({
      amount: ETHER / BigInt(200),
      callFee: MIN_AMOUNT_CALL_FEE,
      gasFee: regtestConfig.maxMinerFee,
      change: BigInt(0)
    })
  })

  test('fold change below the dust threshold into the call fee', () => {
    const value = MIN_AMOUNT_VALUE + BigInt(5_000)
    const split = splitPegoutValue(value, regtestConfig, regtestDust)
    expect(split.callFee).toBe(MIN_AMOUNT_CALL_FEE + BigInt(5_000))
    expect(split.change).toBe(BigInt(0))
  })

  test('refund change at or above the dust threshold', () => {
    const value = MIN_AMOUNT_VALUE + regtestDust
    const split = splitPegoutValue(value, regtestConfig, regtestDust)
    expect(split.callFee).toBe(MIN_AMOUNT_CALL_FEE)
    expect(split.change).toBe(regtestDust)
  })

  test('reject a value that does not cover fixedFee + maxMinerFee', () => {
    const minimum = regtestConfig.fixedFee + regtestConfig.maxMinerFee
    expect(() => splitPegoutValue(minimum, regtestConfig, regtestDust)).toThrow(FlyoverError)
    try {
      splitPegoutValue(minimum, regtestConfig, regtestDust)
    } catch (e: any) {
      expect(e.message).toBe('Peg-out value too low')
      expect(e.details.minimum).toBe((minimum + BigInt(1)).toString())
    }
  })
})

describe('pegoutValueForAmount should', () => {
  const amounts = [
    ETHER / BigInt(200),
    BigInt('5000010000000000'),
    BigInt('123456780000000000'),
    BigInt('9999999990000000000'),
    SAT_TO_WEI
  ]
  const configs = [
    regtestConfig,
    { ...regtestConfig, percentageFee: BigInt(0) },
    { ...regtestConfig, percentageFee: BigInt(1_000) },
    { ...regtestConfig, percentageFee: BigInt(37), fixedFee: BigInt('100000000012345') }
  ]

  test.each(configs.flatMap(config => amounts.map(amount => [config, amount] as const)))(
    'return a value that gives back the exact amount, and 1 wei less gives 1 sat less (%#)', (config, amount) => {
      const value = pegoutValueForAmount(amount, config)
      expect(splitPegoutValue(value, config, regtestDust).amount).toBe(amount)
      expect(splitPegoutValue(value - BigInt(1), config, regtestDust).amount).toBe(amount - SAT_TO_WEI)
    })

  test('show that amount + fee + gasFee is 1 sat short', () => {
    const amount = BigInt('5000010000000000')
    const naive = amount + calculatePegoutFee(regtestConfig, amount) + regtestConfig.maxMinerFee
    expect(splitPegoutValue(naive, regtestConfig, regtestDust).amount).toBe(amount - SAT_TO_WEI)
    expect(pegoutValueForAmount(amount, regtestConfig)).toBeGreaterThan(naive)
  })
})

describe('estimatePegout should', () => {
  let mocks: ContextMock

  beforeEach(() => {
    mocks = contextMock(regtestConfig, regtestDust)
  })

  test('return what requestPegOut would charge and store at the read block', async () => {
    const amount = ETHER / BigInt(200)
    const estimate = await estimatePegout(mocks.context, amount)
    const depositDateLimit = BigInt(BLOCK_TIMESTAMP + 1800)
    expect(estimate).toEqual({
      amount,
      callFee: MIN_AMOUNT_CALL_FEE,
      gasFee: regtestConfig.maxMinerFee,
      change: BigInt(0),
      value: MIN_AMOUNT_VALUE,
      minimumBtcReceived: amount,
      requiredConfirmations: BigInt(2),
      depositDateLimit,
      expireDate: depositDateLimit + BigInt(14400),
      expireBlock: BigInt(BLOCK_NUMBER + 600 + 3300),
      transferTime: BigInt(7200),
      blockNumber: BigInt(BLOCK_NUMBER),
      blockTimestamp: BigInt(BLOCK_TIMESTAMP)
    })
    expect(estimate.value).toBe(estimate.amount + estimate.callFee + estimate.gasFee + estimate.change)
  })

  test('report the change the escrow refunds when the rounding gap reaches the dust threshold', async () => {
    const amount = BigInt('5000010000000000')
    const estimate = await estimatePegout(mocks.context, amount)
    expect(estimate.callFee).toBe(BigInt('105000000000000'))
    expect(estimate.change).toBe(BigInt(10_000_000))
    expect(splitPegoutValue(estimate.value, regtestConfig, regtestDust)).toEqual({
      amount, callFee: estimate.callFee, gasFee: estimate.gasFee, change: estimate.change
    })
  })

  test('read every value at the same block', async () => {
    const amount = ETHER / BigInt(200)
    await estimatePegout(mocks.context, amount)
    expect(mocks.configurations.getPegOutConfiguration).toBeCalledWith(BLOCK_NUMBER)
    expect(mocks.configurations.calculatePegOutFee).toBeCalledWith(amount, BLOCK_NUMBER)
    expect(mocks.configurations.getRequiredPegOutBtcConfirmations).toBeCalledWith(amount, BLOCK_NUMBER)
    expect(mocks.pegOutContract.getDustThreshold).toBeCalledWith(BLOCK_NUMBER)
  })

  test('make no request to a liquidity provider', async () => {
    await estimatePegout(mocks.context, ETHER / BigInt(200))
    expect(mocks.httpClient.get).not.toBeCalled()
    expect(mocks.httpClient.post).not.toBeCalled()
  })

  test.each([
    [BigInt(0), 'the amount must be greater than zero'],
    [BigInt(-1), 'the amount must be greater than zero'],
    [ETHER / BigInt(200) + BigInt(1), 'the amount must be a whole number of satoshis']
  ])('reject the invalid amount %s', async (amount, reason) => {
    await expect(estimatePegout(mocks.context, amount)).rejects.toMatchObject({
      message: 'Invalid peg-out amount',
      details: { amount: amount.toString(), reason }
    })
    expect(mocks.configurations.getPegOutConfiguration).not.toBeCalled()
  })

  test.each([
    [ETHER / BigInt(200) - SAT_TO_WEI, 'minAmount'],
    [ETHER * BigInt(10) + SAT_TO_WEI, 'maxAmount']
  ])('reject the out of bounds amount %s naming the violated bound', async (amount, violatedBound) => {
    await expect(estimatePegout(mocks.context, amount)).rejects.toMatchObject({
      message: 'Peg-out not serviceable',
      details: {
        amount: amount.toString(),
        minAmount: regtestConfig.minAmount.toString(),
        maxAmount: regtestConfig.maxAmount.toString(),
        violatedBound
      }
    })
  })

  test.each([
    { claimWindow: BigInt(1800), expireTime: BigInt(127_801) },
    { claimWindowBlocks: BigInt(701), expireBlocks: BigInt(3300) }
  ])('reject a configuration whose deadlines exceed the native peg-out cap (%#)', async (deadlines) => {
    mocks = contextMock({ ...regtestConfig, ...deadlines }, regtestDust)
    await expect(estimatePegout(mocks.context, ETHER / BigInt(200))).rejects.toMatchObject({
      message: 'Unfair peg-out configuration'
    })
  })

  test('accept deadlines exactly at the native peg-out cap', async () => {
    mocks = contextMock({ ...regtestConfig, expireTime: BigInt(127_800), claimWindowBlocks: BigInt(700) }, regtestDust)
    const estimate = await estimatePegout(mocks.context, ETHER / BigInt(200))
    expect(estimate.expireDate).toBe(BigInt(BLOCK_TIMESTAMP + 129_600))
    expect(estimate.expireBlock).toBe(BigInt(BLOCK_NUMBER + 4000))
  })

  test('return no estimate when a configuration read fails', async () => {
    mocks.configurations.getPegOutConfiguration.mockRejectedValue(new Error('error executing view getPegOutConfiguration'))
    await expect(estimatePegout(mocks.context, ETHER / BigInt(200))).rejects.toThrow('error executing view getPegOutConfiguration')
  })

  test('fail without an RSK connection or a FlyoverConfigurations contract', async () => {
    await expect(estimatePegout({ ...mocks.context, rskConnection: undefined }, SAT_TO_WEI)).rejects.toThrow('Missing RSK connection')
    const lbc = { ...mocks.context.lbc, flyoverConfigurations: undefined } as any
    await expect(estimatePegout({ ...mocks.context, lbc }, SAT_TO_WEI)).rejects.toThrow('Missing FlyoverConfigurations contract')
  })
})
