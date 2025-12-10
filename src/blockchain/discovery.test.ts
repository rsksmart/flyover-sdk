import { describe, test, jest, expect } from '@jest/globals'
import { BlockchainConnection, ethers, FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { DiscoveryContract } from './discovery'

jest.mock('ethers')

const signerMock = jest.mocked({})
const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () {
    return signerMock
  }
} as BlockchainConnection)

describe('DiscoveryContract class should', () => {
  test('initialize correctly', () => {
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new DiscoveryContract(connectionMock, config)
    expect(ethers.Contract).toBeCalled()
    expect(lbc).toHaveProperty('discoveryContract', expect.anything())
  })

  test('execute getProviders correctly', async () => {
    const realEthers = jest.requireActual<typeof ethers>('ethers')
    const contractProviders: any[] = [
      {
        apiBaseUrl: 'any url',
        id: realEthers.BigNumber.from(1),
        name: 'mock 1',
        providerAddress: 'address 1',
        providerType: BigInt(0),
        status: true
      },
      {
        apiBaseUrl: 'any url',
        id: realEthers.BigNumber.from(2),
        name: 'mock 2',
        providerAddress: 'address 2',
        providerType: BigInt(1),
        status: false
      }
    ]

    const parsedProviders = [
      {
        apiBaseUrl: 'any url',
        id: 1,
        name: 'mock 1',
        provider: 'address 1',
        providerType: 'pegin',
        status: true
      },
      {
        apiBaseUrl: 'any url',
        id: 2,
        name: 'mock 2',
        provider: 'address 2',
        providerType: 'pegout',
        status: false
      }
    ]

    const contractMock = {
      getProviders: jest.fn().mockImplementation(async () => Promise.resolve(contractProviders))
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new DiscoveryContract(connectionMock, config)

    const result = await lbc.getProviders()

    expect(contractMock.getProviders).toBeCalledTimes(1)
    expect(contractMock.getProviders).toBeCalledWith()
    // to validate the contract parsing
    contractProviders.forEach(provider => { provider.id = provider.id.toNumber() })
    expect(result).toEqual(parsedProviders)
  })
})
