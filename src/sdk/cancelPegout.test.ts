import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { cancelPegout } from './cancelPegout'
import { type PegoutState } from '../blockchain/pegoutEscrow'
import { type FlyoverSDKContext } from '../utils/interfaces'

const CHAIN_HEIGHT = 1234
const REQUEST_HASH = 'ab'.repeat(32)
const REFUND_ADDRESS = '0x79568c2989232dCa1840087D73d403602364c0D4'
const TX_HASH = '0x' + 'cd'.repeat(32)

interface EscrowMock {
  getPegOutState: jest.Mock<any>
  getRefundAddress: jest.Mock<any>
  getSenderAddress: jest.Mock<any>
  cancelPegOut: jest.Mock<any>
}

function contextMock (escrow: EscrowMock): FlyoverSDKContext {
  return {
    config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') },
    httpClient: {},
    rskConnection: { getChainHeight: async () => Promise.resolve(CHAIN_HEIGHT) },
    lbc: { pegOutEscrow: escrow }
  } as unknown as FlyoverSDKContext
}

describe('cancelPegout should', () => {
  let escrow: EscrowMock

  beforeEach(() => {
    escrow = {
      getPegOutState: jest.fn<any>().mockResolvedValue('REQUESTED'),
      getRefundAddress: jest.fn<any>().mockResolvedValue(REFUND_ADDRESS),
      getSenderAddress: jest.fn<any>().mockResolvedValue(REFUND_ADDRESS.toLowerCase()),
      cancelPegOut: jest.fn<any>().mockResolvedValue(TX_HASH)
    }
  })

  test('send exactly one cancel when the refund address cancels a REQUESTED peg-out, and return its hash', async () => {
    const txHash = await cancelPegout(contextMock(escrow), REQUEST_HASH)

    expect(escrow.cancelPegOut).toBeCalledTimes(1)
    expect(escrow.cancelPegOut).toBeCalledWith(REQUEST_HASH)
    expect(txHash).toBe(TX_HASH)
  })

  test('check the state and the refund address at the current chain height', async () => {
    await cancelPegout(contextMock(escrow), REQUEST_HASH)
    expect(escrow.getPegOutState).toBeCalledWith(REQUEST_HASH, CHAIN_HEIGHT)
    expect(escrow.getRefundAddress).toBeCalledWith(REQUEST_HASH, CHAIN_HEIGHT)
  })

  test.each<PegoutState>(['NONE', 'CLAIMED', 'CANCELLED', 'FULFILLED', 'REFUNDED'])(
    'reject a %s peg-out with InvalidState before sending', async (state) => {
      escrow.getPegOutState.mockResolvedValue(state)
      await expect(cancelPegout(contextMock(escrow), REQUEST_HASH)).rejects.toMatchObject({
        message: 'InvalidState',
        details: { requestHash: REQUEST_HASH, expected: 'REQUESTED', actual: state }
      })
      expect(escrow.cancelPegOut).not.toBeCalled()
    })

  test('reject a sender other than the refund address with InvalidSender before sending', async () => {
    const other = '0x' + '11'.repeat(20)
    escrow.getSenderAddress.mockResolvedValue(other)
    await expect(cancelPegout(contextMock(escrow), REQUEST_HASH)).rejects.toMatchObject({
      message: 'InvalidSender',
      details: { requestHash: REQUEST_HASH, expected: REFUND_ADDRESS, actual: other }
    })
    expect(escrow.cancelPegOut).not.toBeCalled()
  })

  test('reject a malformed id without reading the escrow', async () => {
    await expect(cancelPegout(contextMock(escrow), 'not-an-id')).rejects.toMatchObject({ details: 'invalid peg-out id not-an-id' })
    expect(escrow.getPegOutState).not.toBeCalled()
    expect(escrow.cancelPegOut).not.toBeCalled()
  })
})
