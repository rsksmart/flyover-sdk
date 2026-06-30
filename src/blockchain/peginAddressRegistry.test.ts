import { describe, test, jest, expect, beforeAll } from '@jest/globals'
import { ethers, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { PegInAddressRegistryContract, decodePegInAddress, PegInAddressEncoding } from './peginAddressRegistry'
import { type FlyoverPeginConfig } from '../constants/networks'

jest.mock('ethers')

// Verified live-regtest vector: the registry returns the RAW base58check payload bytes
// (version byte + 20-byte hash + 4-byte checksum), which base58-encode to the human address.
const VECTOR_BYTES = '0xc414c9ddfb07c64fc452c40e423a49624ccae047b3dd12f09d'
const VECTOR_ADDRESS = '2Mu99L6NMXKfMH8HxHTgoTArCyDSrwA3dPr'

const RSK_ADDRESS = '0x9D93929A9099be4355fC2389FbF253982F9dF47c'

const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: function () { return this.signer },
  get signer () { return jest.mocked({}) }
} as any)

const baseConfig: FlyoverPeginConfig = {
  network: 'Regtest',
  captchaTokenResolver: async () => Promise.resolve('')
}

describe('decodePegInAddress should', () => {
  test('base58-encode the raw payload for BASE58 encoding and match the verified vector', () => {
    const { utils } = jest.requireActual<typeof ethers>('ethers')
    jest.spyOn(ethers.utils.base58, 'encode').mockImplementation((arg) => utils.base58.encode(arg))

    expect(decodePegInAddress(VECTOR_BYTES, PegInAddressEncoding.BASE58)).toBe(VECTOR_ADDRESS)
  })

  test('throw on BECH32 encoding (not implemented)', () => {
    expect(() => decodePegInAddress(VECTOR_BYTES, PegInAddressEncoding.BECH32)).toThrow(/unsupported peg-in address encoding/)
  })

  test('throw on unknown encoding', () => {
    expect(() => decodePegInAddress(VECTOR_BYTES, 99 as PegInAddressEncoding)).toThrow(/unknown peg-in address encoding/)
  })
})

describe('PegInAddressRegistryContract should', () => {
  beforeAll(() => {
    const { utils } = jest.requireActual<typeof ethers>('ethers')
    jest.spyOn(ethers.utils.base58, 'encode').mockImplementation((arg) => utils.base58.encode(arg))
    jest.spyOn(ethers.utils, 'hexlify').mockImplementation((arg) => utils.hexlify(arg))
  })

  test('throw when neither network default nor custom registry address is available', () => {
    const config: FlyoverConfig = { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') }
    expect(() => new PegInAddressRegistryContract(connectionMock, config)).toThrow(/invalid PegInAddressRegistry address/)
  })

  test('use the custom registry address override', () => {
    const config: FlyoverPeginConfig = {
      network: 'Mainnet',
      captchaTokenResolver: async () => Promise.resolve(''),
      customPegInAddressRegistryAddress: '0x145845fd06c85b7ea1aa2d030e1a747b3d8d15d7'
    }
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: config.customPegInAddressRegistryAddress } as any))
    expect(() => new PegInAddressRegistryContract(connectionMock, config)).not.toThrow()
  })

  test('derive the BTC deposit address from getPegInAddress and decode the verified vector', async () => {
    const getPegInAddress = jest.fn<() => Promise<[string, number]>>()
      .mockResolvedValue([VECTOR_BYTES, PegInAddressEncoding.BASE58])
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: '0x145845fd06c85b7ea1aa2d030e1a747b3d8d15d7', getPegInAddress } as any))

    const registry = new PegInAddressRegistryContract(connectionMock, baseConfig)
    const address = await registry.getPegInDepositAddress(RSK_ADDRESS)

    expect(getPegInAddress).toHaveBeenCalledWith(RSK_ADDRESS)
    expect(address).toBe(VECTOR_ADDRESS)
  })

  test('reject an invalid RSK address in getPegInDepositAddress', async () => {
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: '0x145845fd06c85b7ea1aa2d030e1a747b3d8d15d7' } as any))
    const registry = new PegInAddressRegistryContract(connectionMock, baseConfig)
    await expect(registry.getPegInDepositAddress('not-an-address')).rejects.toThrow(/invalid RSK address/)
  })

  test('decode a batch of addresses sharing one encoding', async () => {
    const second = '0xc414000000000000000000000000000000000000000000d6e8'
    const getPegInAddresses = jest.fn<() => Promise<[string[], number]>>()
      .mockResolvedValue([[VECTOR_BYTES, second], PegInAddressEncoding.BASE58])
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: '0x145845fd06c85b7ea1aa2d030e1a747b3d8d15d7', getPegInAddresses } as any))

    const registry = new PegInAddressRegistryContract(connectionMock, baseConfig)
    const result = await registry.getPegInDepositAddresses([RSK_ADDRESS, RSK_ADDRESS])

    expect(result[0]).toBe(VECTOR_ADDRESS)
    expect(result).toHaveLength(2)
  })

  test('pass through isRegistered', async () => {
    const isRegistered = jest.fn<() => Promise<boolean>>().mockResolvedValue(true)
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: '0x145845fd06c85b7ea1aa2d030e1a747b3d8d15d7', isRegistered } as any))

    const registry = new PegInAddressRegistryContract(connectionMock, baseConfig)
    await expect(registry.isRegistered(RSK_ADDRESS)).resolves.toBe(true)
    expect(isRegistered).toHaveBeenCalledWith(RSK_ADDRESS)
  })

  test('return the registration root as hex', async () => {
    const getRegistrationRoot = jest.fn<() => Promise<string>>()
      .mockResolvedValue('0x00000000000000000000000000000000000000000000000000000000000000ab')
    const contractMock = jest.mocked(ethers.Contract)
    contractMock.mockImplementation(() => ({ address: '0x145845fd06c85b7ea1aa2d030e1a747b3d8d15d7', getRegistrationRoot } as any))

    const registry = new PegInAddressRegistryContract(connectionMock, baseConfig)
    await expect(registry.getRegistrationRoot()).resolves.toBe('0x00000000000000000000000000000000000000000000000000000000000000ab')
  })
})
