import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { RskBridge } from './bridge'
import { describe, test, jest, expect } from '@jest/globals'
import * as ethers from 'ethers'

jest.mock('ethers')

const signerMock = jest.mocked({})
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: () => {
    return signerMock
  },
  get signer () {
    return signerMock
  }
} as BlockchainConnection)

describe('RskBridge class should', () => {
  test('initialize correctly', () => {
    const bridge = new RskBridge(connectionMock)
    expect(ethers.Contract).toBeCalledWith(
      '0x0000000000000000000000000000000001000006',
      ['function getMinimumLockTxValue() external view returns (int256)'],
      connectionMock.signer
    )
    expect(bridge).toHaveProperty('bridge', expect.anything())
  })

  test('get min lock value correctly', async () => {
    const actualEthers: typeof ethers = jest.requireActual('ethers')
    const contractMock = {
      getMinimumLockTxValue: jest.fn().mockImplementation(
        async () => Promise.resolve(actualEthers.BigNumber.from(1234))
      )
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const bridge = new RskBridge(connectionMock)
    const result = await bridge.getMinimumLockTxValue()

    expect(contractMock.getMinimumLockTxValue).toBeCalledTimes(1)
    expect(typeof result).toBe('bigint')
    expect(result).toEqual(BigInt(1234))
  })
})
