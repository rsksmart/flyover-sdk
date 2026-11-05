import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { requestPegout } from './requestPegout'
import { type PegOutConfiguration } from '../blockchain/flyoverConfigurations'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { SAT_TO_WEI } from '../constants/units'

const ETHER = BigInt('1000000000000000000')

// Provisional regtest values from liquidity-bridge-contract v3.0.0 FlyoverConfigurationsRegtest.pegOutConfig
const regtestConfig: PegOutConfiguration = {
  fixedFee: ETHER / BigInt(10_000),
  percentageFee: BigInt(10),
  minAmount: ETHER / BigInt(200),
  maxAmount: ETHER * BigInt(10),
  confirmationTiers: [{ maxAmount: ETHER * BigInt(10), confirmations: BigInt(2) }],
  penaltyFee: ETHER / BigInt(100),
  claimWindow: BigInt(1800),
  claimWindowBlocks: BigInt(600),
  callTime: BigInt(7200),
  expireTime: BigInt(14400),
  expireBlocks: BigInt(3300),
  maxMinerFee: ETHER / BigInt(2000)
}

const CHAIN_HEIGHT = 1234
const DESTINATION = 'mxqk28jvEtvjxRN8k7W9hFEJfWz5VcUgHW'
const REFUND_ADDRESS = '0x79568c2989232dca1840087d73d403602364c0d4'
// value whose derived amount is exactly minAmount (0.005 BTC)
const VALUE = BigInt('5605000000000000')
const RESULT = { requestHash: 'ab'.repeat(32), txHash: '0x' + 'cd'.repeat(32), nonce: BigInt(7) }

interface ContextMock {
  context: FlyoverSDKContext
  getPegOutConfiguration: jest.Mock<any>
  escrowRequest: jest.Mock<any>
}

function contextMock (config: PegOutConfiguration): ContextMock {
  const getPegOutConfiguration = jest.fn<any>().mockResolvedValue(config)
  const escrowRequest = jest.fn<any>().mockResolvedValue(RESULT)
  const context = {
    config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve(''), disableChecksum: true },
    httpClient: {},
    rskConnection: { getChainHeight: async () => Promise.resolve(CHAIN_HEIGHT) },
    lbc: { flyoverConfigurations: { getPegOutConfiguration }, pegOutEscrow: { requestPegOut: escrowRequest } }
  } as unknown as FlyoverSDKContext
  return { context, getPegOutConfiguration, escrowRequest }
}

describe('requestPegout should', () => {
  let mocks: ContextMock

  beforeEach(() => {
    mocks = contextMock(regtestConfig)
  })

  test('send exactly one escrow request with the decoded destination and return its result', async () => {
    const result = await requestPegout(mocks.context, DESTINATION, REFUND_ADDRESS, VALUE)

    expect(mocks.escrowRequest).toBeCalledTimes(1)
    expect(mocks.escrowRequest).toBeCalledWith(DESTINATION, REFUND_ADDRESS, VALUE)
    expect(result).toEqual(RESULT)
  })

  test('check the value against the configuration at the current chain height', async () => {
    await requestPegout(mocks.context, DESTINATION, REFUND_ADDRESS, VALUE)
    expect(mocks.getPegOutConfiguration).toBeCalledWith(CHAIN_HEIGHT)
  })

  test.each([
    ['below minAmount', VALUE - SAT_TO_WEI * BigInt(2), 'minAmount'],
    ['above maxAmount', ETHER * BigInt(11), 'maxAmount']
  ])('reject a value whose amount is %s before sending', async (_case, value, violatedBound) => {
    await expect(requestPegout(mocks.context, DESTINATION, REFUND_ADDRESS, value)).rejects.toMatchObject({
      message: 'Peg-out not serviceable',
      details: { violatedBound }
    })
    expect(mocks.escrowRequest).not.toBeCalled()
  })

  test('reject a value that is not above fixedFee + maxMinerFee before sending', async () => {
    const reserved = regtestConfig.fixedFee + regtestConfig.maxMinerFee
    await expect(requestPegout(mocks.context, DESTINATION, REFUND_ADDRESS, reserved)).rejects.toMatchObject({
      message: 'Peg-out value too low',
      details: { minimum: (reserved + BigInt(1)).toString() }
    })
    expect(mocks.escrowRequest).not.toBeCalled()
  })

  test('reject a configuration whose deadlines exceed the native peg-out cap before sending', async () => {
    mocks = contextMock({ ...regtestConfig, expireTime: BigInt(127_801) })
    await expect(requestPegout(mocks.context, DESTINATION, REFUND_ADDRESS, VALUE)).rejects.toMatchObject({
      message: 'Unfair peg-out configuration'
    })
    expect(mocks.escrowRequest).not.toBeCalled()
  })

  test.each([
    ['the zero address', '0x0000000000000000000000000000000000000000'],
    ['not an RSK address', 'not an address']
  ])('reject a refund address that is %s before sending', async (_case, refundAddress) => {
    await expect(requestPegout(mocks.context, DESTINATION, refundAddress, VALUE)).rejects.toMatchObject({
      message: 'Invalid RSK address'
    })
    expect(mocks.getPegOutConfiguration).not.toBeCalled()
    expect(mocks.escrowRequest).not.toBeCalled()
  })

  test.each([
    ['empty', '', 'Invalid BTC address'],
    ['from another network', '12higDjoCCNXSA95xZMWUdPvXNmkAduhWv', 'Wrong network']
  ])('reject a destination address that is %s before sending', async (_case, destination, message) => {
    await expect(requestPegout(mocks.context, destination, REFUND_ADDRESS, VALUE)).rejects.toMatchObject({ message })
    expect(mocks.escrowRequest).not.toBeCalled()
  })

  test('fail without the PegOutEscrow contract', async () => {
    const lbc = { ...mocks.context.lbc, pegOutEscrow: undefined } as any
    await expect(requestPegout({ ...mocks.context, lbc }, DESTINATION, REFUND_ADDRESS, VALUE)).rejects.toThrow('Missing PegOutEscrow contract')
  })
})
