import { describe, test, jest, expect, beforeEach } from '@jest/globals'
import { type BlockchainConnection, decodeBtcAddress, ethers, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { isPegoutId, PegOutEscrowContract } from './pegoutEscrow'

jest.mock('ethers')

const { BigNumber } = jest.requireActual<typeof ethers>('ethers')

const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () { return jest.mocked({}) }
} as BlockchainConnection)

const ESCROW_ADDRESS = '0x8901a2bbf639bfd21a97004ba4d7ae2bd00b8da8'
const REQUEST_HASH = '0x' + 'ab'.repeat(32)
const TX_HASH = '0x' + 'cd'.repeat(32)
const DESTINATION = 'mxqk28jvEtvjxRN8k7W9hFEJfWz5VcUgHW'
const REFUND_ADDRESS = '0x79568c2989232dCa1840087D73d403602364c0D4'
const VALUE = BigInt('5605000000000000')

const config: FlyoverConfig = {
  network: 'Regtest',
  captchaTokenResolver: async () => Promise.resolve(''),
  customPegOutEscrowAddress: ESCROW_ADDRESS
}

function receipt (events: unknown[]): unknown {
  return { transactionHash: TX_HASH, blockNumber: 1234, events }
}

describe('PegOutEscrowContract should', () => {
  let requestPegOut: jest.Mock<any>
  let cancelPegOut: jest.Mock<any>
  let getPegOutQuote: jest.Mock<any>
  let getPegOutState: jest.Mock<any>
  let requestIdAt: jest.Mock<any>
  let wait: jest.Mock<any>
  let signer: { getAddress: jest.Mock<any> } | null

  beforeEach(() => {
    wait = jest.fn<any>().mockResolvedValue(receipt([{ event: 'PegOutRequested', args: { requestHash: REQUEST_HASH } }]))
    requestPegOut = jest.fn<any>().mockResolvedValue({ hash: TX_HASH, wait })
    cancelPegOut = jest.fn<any>().mockResolvedValue({ hash: TX_HASH, wait: jest.fn<any>().mockResolvedValue(receipt([])) })
    getPegOutQuote = jest.fn<any>().mockResolvedValue({ nonce: BigNumber.from(7), rskRefundAddress: REFUND_ADDRESS })
    getPegOutState = jest.fn<any>().mockResolvedValue(1)
    requestIdAt = jest.fn<any>().mockResolvedValue(REQUEST_HASH)
    signer = { getAddress: jest.fn<any>().mockResolvedValue(REFUND_ADDRESS) }
    jest.mocked(ethers.Contract).mockImplementation(() => ({
      address: ESCROW_ADDRESS, signer, requestPegOut, cancelPegOut, getPegOutQuote, getPegOutState, requestIdAt
    }) as any)
  })

  test('throw when neither a network default nor a custom address is available', () => {
    const noAddress: FlyoverConfig = { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') }
    expect(() => new PegOutEscrowContract(connectionMock, noAddress)).toThrow(/invalid PegOutEscrow address/)
  })

  test('use the custom address', async () => {
    const escrow = new PegOutEscrowContract(connectionMock, config)
    expect(ethers.Contract).toHaveBeenLastCalledWith(ESCROW_ADDRESS, expect.anything(), expect.anything())
    await expect(escrow.getAddress()).resolves.toBe(ESCROW_ADDRESS)
  })

  test('send one requestPegOut transaction with the value and return the id, hash and nonce', async () => {
    const result = await new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE)

    expect(requestPegOut).toBeCalledTimes(1)
    expect(requestPegOut).toBeCalledWith(decodeBtcAddress(DESTINATION), REFUND_ADDRESS, { value: VALUE })
    expect(result).toEqual({ requestHash: REQUEST_HASH.slice(2), txHash: TX_HASH, nonce: BigInt(7) })
  })

  test('read the nonce at the block the request was mined in', async () => {
    await new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE)
    expect(getPegOutQuote).toBeCalledWith(REQUEST_HASH, { blockTag: 1234 })
  })

  test('return no nonce when the request was claimed in the same block', async () => {
    getPegOutState.mockResolvedValue(0)
    const result = await new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE)
    expect(result).toEqual({ requestHash: REQUEST_HASH.slice(2), txHash: TX_HASH, nonce: undefined })
  })

  test('throw a BridgeError when the transaction cannot be sent', async () => {
    requestPegOut.mockRejectedValue(new Error('cannot estimate gas'))
    await expect(new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE))
      .rejects.toMatchObject({ message: 'error executing function requestPegOut', details: { error: 'cannot estimate gas' } })
  })

  test('throw an error carrying the transaction hash when the mined transaction reverted', async () => {
    wait.mockRejectedValue(new Error('transaction failed'))
    await expect(new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE))
      .rejects.toMatchObject({ message: 'Peg-out request reverted', details: { txHash: TX_HASH, reason: 'transaction failed' } })
  })

  test('throw when the receipt has no PegOutRequested event', async () => {
    wait.mockResolvedValue(receipt([{ event: 'EscrowPegOutChangePaid', args: {} }]))
    await expect(new PegOutEscrowContract(connectionMock, config).requestPegOut(DESTINATION, REFUND_ADDRESS, VALUE))
      .rejects.toMatchObject({ details: `requestPegOut transaction ${TX_HASH} emitted no PegOutRequested event` })
  })

  test('send one cancelPegOut transaction for the id and return its hash', async () => {
    const txHash = await new PegOutEscrowContract(connectionMock, config).cancelPegOut(REQUEST_HASH.slice(2))
    expect(cancelPegOut).toBeCalledTimes(1)
    expect(cancelPegOut).toBeCalledWith(REQUEST_HASH)
    expect(txHash).toBe(TX_HASH)
  })

  test('throw an error carrying the transaction hash when the mined cancel reverted', async () => {
    cancelPegOut.mockResolvedValue({ hash: TX_HASH, wait: jest.fn<any>().mockRejectedValue(new Error('transaction failed')) })
    await expect(new PegOutEscrowContract(connectionMock, config).cancelPegOut(REQUEST_HASH))
      .rejects.toMatchObject({ message: 'Peg-out cancel reverted', details: { txHash: TX_HASH, reason: 'transaction failed' } })
  })

  test.each([[0, 'NONE'], [1, 'REQUESTED'], [2, 'CLAIMED'], [3, 'CANCELLED'], [4, 'FULFILLED'], [5, 'REFUNDED']])(
    'read state %i as %s at the given block', async (onchain, state) => {
      getPegOutState.mockResolvedValue(onchain)
      const result = await new PegOutEscrowContract(connectionMock, config).getPegOutState(REQUEST_HASH.slice(2), 77)
      expect(getPegOutState).toBeCalledWith(REQUEST_HASH, { blockTag: 77 })
      expect(result).toBe(state)
    })

  test('read the refund address of a stored peg-out at the given block', async () => {
    const refundAddress = await new PegOutEscrowContract(connectionMock, config).getRefundAddress(REQUEST_HASH, 77)
    expect(getPegOutQuote).toBeCalledWith(REQUEST_HASH, { blockTag: 77 })
    expect(refundAddress).toBe(REFUND_ADDRESS)
  })

  test('read the sender from the signer, and fail on a read-only connection', async () => {
    await expect(new PegOutEscrowContract(connectionMock, config).getSenderAddress()).resolves.toBe(REFUND_ADDRESS)
    signer = null
    await expect(new PegOutEscrowContract(connectionMock, config).getSenderAddress())
      .rejects.toMatchObject({ details: 'a signing RSK connection is required to send PegOutEscrow transactions' })
  })

  test('read the current id of a nonce at the given block', async () => {
    const currentId = await new PegOutEscrowContract(connectionMock, config).requestIdAt(BigInt(7), 77)
    expect(requestIdAt).toBeCalledWith(BigInt(7), { blockTag: 77 })
    expect(currentId).toBe(REQUEST_HASH)
  })

  test.each([
    [REQUEST_HASH, true],
    [REQUEST_HASH.slice(2), true],
    ['0x1234', false],
    ['zz'.repeat(32), false]
  ])('tell whether %s is a peg-out id', (value, expected) => {
    expect(isPegoutId(value)).toBe(expected)
  })
})
