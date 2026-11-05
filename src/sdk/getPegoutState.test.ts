import { describe, test, expect, jest, beforeEach } from '@jest/globals'
import { getPegoutState } from './getPegoutState'
import { type PegoutState } from '../blockchain/pegoutEscrow'
import { type FlyoverSDKContext } from '../utils/interfaces'

const CHAIN_HEIGHT = 1234
const REQUEST_HASH = 'ab'.repeat(32)
const CLAIMED_ID = '0x' + 'cd'.repeat(32)
const ZERO_ID = '0x' + '00'.repeat(32)
const NONCE = BigInt(7)

interface Mocks {
  context: FlyoverSDKContext
  getPegOutState: jest.Mock<any>
  requestIdAt: jest.Mock<any>
  httpClient: { get: jest.Mock<any>, post: jest.Mock<any> }
}

function mocks (statesById: Record<string, PegoutState>, currentId: string): Mocks {
  const getPegOutState = jest.fn<any>().mockImplementation(async (id: string) => statesById[id] ?? 'NONE')
  const requestIdAt = jest.fn<any>().mockResolvedValue(currentId)
  const httpClient = { get: jest.fn<any>(), post: jest.fn<any>() }
  const context = {
    config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') },
    httpClient,
    rskConnection: { getChainHeight: async () => Promise.resolve(CHAIN_HEIGHT) },
    lbc: { pegOutEscrow: { getPegOutState, requestIdAt } }
  } as unknown as FlyoverSDKContext
  return { context, getPegOutState, requestIdAt, httpClient }
}

describe('getPegoutState should', () => {
  let m: Mocks

  beforeEach(() => {
    m = mocks({ [REQUEST_HASH]: 'REQUESTED' }, REQUEST_HASH)
  })

  test('return REQUESTED for an unclaimed peg-out without resolving the nonce', async () => {
    await expect(getPegoutState(m.context, REQUEST_HASH, NONCE)).resolves.toBe('REQUESTED')
    expect(m.getPegOutState).toBeCalledWith(REQUEST_HASH, CHAIN_HEIGHT)
    expect(m.requestIdAt).not.toBeCalled()
  })

  test.each<PegoutState>(['CANCELLED', 'REFUNDED'])('return %s when it ended under the request id', async (state) => {
    m = mocks({ [REQUEST_HASH]: state }, REQUEST_HASH)
    await expect(getPegoutState(m.context, REQUEST_HASH, NONCE)).resolves.toBe(state)
  })

  test.each<PegoutState>(['CLAIMED', 'FULFILLED', 'REFUNDED'])(
    'follow a claimed peg-out to its new id through the nonce and return %s', async (state) => {
      m = mocks({ [CLAIMED_ID]: state }, CLAIMED_ID)
      await expect(getPegoutState(m.context, REQUEST_HASH, NONCE)).resolves.toBe(state)
      expect(m.requestIdAt).toBeCalledWith(NONCE, CHAIN_HEIGHT)
      expect(m.getPegOutState).toHaveBeenLastCalledWith(CLAIMED_ID, CHAIN_HEIGHT)
    })

  test('return NONE for an id the escrow never issued', async () => {
    m = mocks({}, ZERO_ID)
    await expect(getPegoutState(m.context, REQUEST_HASH, NONCE)).resolves.toBe('NONE')
    expect(m.getPegOutState).toBeCalledTimes(1)
  })

  test('return NONE without a nonce, since a claimed peg-out cannot be followed', async () => {
    m = mocks({ [CLAIMED_ID]: 'CLAIMED' }, CLAIMED_ID)
    await expect(getPegoutState(m.context, REQUEST_HASH)).resolves.toBe('NONE')
    expect(m.requestIdAt).not.toBeCalled()
  })

  test('make no request to a liquidity provider', async () => {
    m = mocks({ [CLAIMED_ID]: 'FULFILLED' }, CLAIMED_ID)
    await getPegoutState(m.context, REQUEST_HASH, NONCE)
    expect(m.httpClient.get).not.toBeCalled()
    expect(m.httpClient.post).not.toBeCalled()
  })

  test('reject a malformed id without reading the escrow', async () => {
    await expect(getPegoutState(m.context, 'not-an-id', NONCE)).rejects.toMatchObject({ details: 'invalid peg-out id not-an-id' })
    expect(m.getPegOutState).not.toBeCalled()
  })
})
