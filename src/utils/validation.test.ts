import { describe, test, expect, jest } from '@jest/globals'
import { type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import * as core from '@rsksmart/bridges-core-sdk'
import { FlyoverError } from '..'
import { compareIgnoreCase, isHex, validateRskChecksum } from './validation'

jest.mock('@rsksmart/bridges-core-sdk', () => {
  return {
    __esModule: true,
    ...jest.requireActual<any>('@rsksmart/bridges-core-sdk')
  }
})

describe('validateRskChecksum function should', () => {
  const rskMainnetAddress = '0x98AcE08d2B759A265ae326f010496BCd63c15Afc'
  const ethAddress = '0xC4356aF40cc379b15925Fc8C21e52c00F474e8e9'
  test('allow non checksummed addresses if config has the validation disabled', () => {
    const testnet: FlyoverConfig = {
      disableChecksum: true,
      network: 'Testnet',
      captchaTokenResolver: async () => Promise.resolve('')
    }
    const mainnet: FlyoverConfig = { ...testnet, network: 'Mainnet' }
    const addresses = [rskMainnetAddress.toLowerCase(), ethAddress]
    expect(() => {
      validateRskChecksum(testnet, ...addresses)
      validateRskChecksum(mainnet, ...addresses)
    }).not.toThrow()
  })

  test('execute the validation once per address', () => {
    const rskChecksumSpy = jest.spyOn(core, 'isRskChecksummedAddress')
    const addresses = [
      '0x98AcE08d2B759A265ae326f010496BCd63c15Afc',
      '0xAa9caf1e3967600578727f975F283446a3dA6612',
      '0x4202BAC9919C3412fc7C8BE4e678e26279386603'
    ]
    const config: FlyoverConfig = {
      network: 'Testnet',
      captchaTokenResolver: async () => Promise.resolve('')
    }
    expect.assertions(3 + addresses.length)
    try {
      validateRskChecksum(config, ...addresses)
    } catch (e: any) {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Invalid RSK address checksum')
      expect(rskChecksumSpy).toHaveBeenCalledTimes(addresses.length)
      addresses.forEach(address => { expect(rskChecksumSpy).toHaveBeenCalledWith(address, 31) })
    }
  })

  test('use the proper chain id', () => {
    const rskChecksumSpy = jest.spyOn(core, 'isRskChecksummedAddress')
    const mainnet: FlyoverConfig = { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') }
    const testnet: FlyoverConfig = { ...mainnet, network: 'Testnet' }
    const regtest: FlyoverConfig = { ...mainnet, network: 'Regtest' }
    const testnetAddress = '0xCD8a1C9aCC980Ae031456573e34Dc05CD7dAE6e3'
    const regtestAddress = '0xCd8A1c9ACC980ae031456573E34DC05CD7dAE6E3'
    validateRskChecksum(mainnet, rskMainnetAddress)
    validateRskChecksum(testnet, testnetAddress)
    validateRskChecksum(regtest, regtestAddress)

    expect(rskChecksumSpy).toHaveBeenCalledTimes(3)
    expect(rskChecksumSpy).toHaveBeenNthCalledWith(1, rskMainnetAddress, 30)
    expect(rskChecksumSpy).toHaveBeenNthCalledWith(2, testnetAddress, 31)
    expect(rskChecksumSpy).toHaveBeenNthCalledWith(3, regtestAddress, 33)
  })

  test('build the error message correctly', () => {
    const testnet: FlyoverConfig = { network: 'Testnet', captchaTokenResolver: async () => Promise.resolve('') }
    expect.assertions(3)
    try {
      validateRskChecksum(testnet, rskMainnetAddress, ethAddress)
    } catch (e: any) {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.message).toBe('Invalid RSK address checksum')
      expect(e.details).toBe(`The following addresses doesn't have a valid checksum address: ${rskMainnetAddress}, ${ethAddress}`)
    }
  })
})

describe('compareIgnoreCase function should', () => {
  test('return true for equal strings regardless of case', () => {
    expect(compareIgnoreCase('0xABC', '0xabc')).toBe(true)
    expect(compareIgnoreCase('Any Address', 'any address')).toBe(true)
  })

  test('return false for different strings', () => {
    expect(compareIgnoreCase('0xABC', '0xABD')).toBe(false)
    expect(compareIgnoreCase('any address', 'other address')).toBe(false)
  })

  test('return true when both values are null or undefined at runtime', () => {
    expect(compareIgnoreCase(null as unknown as string, null as unknown as string)).toBe(true)
    expect(compareIgnoreCase(undefined as unknown as string, undefined as unknown as string)).toBe(true)
    expect(compareIgnoreCase(null as unknown as string, undefined as unknown as string)).toBe(true)
    expect(compareIgnoreCase(undefined as unknown as string, null as unknown as string)).toBe(true)
  })

  test('return false when only one value is null or undefined at runtime', () => {
    expect(compareIgnoreCase(null as unknown as string, '0xabc')).toBe(false)
    expect(compareIgnoreCase(undefined as unknown as string, '0xabc')).toBe(false)
    expect(compareIgnoreCase('0xabc', null as unknown as string)).toBe(false)
    expect(compareIgnoreCase('0xabc', undefined as unknown as string)).toBe(false)
  })
})

describe('isHex function should', () => {
  test('return true for valid hex strings', () => {
    const validHexStrings = [
      '0x',
      '',
      '0x1A2b3C4d5E6f',
      'abcdef',
      '0xABCDEF'
    ]
    validHexStrings.forEach(hexString => {
      expect(isHex(hexString)).toBe(true)
    })
  })

  test('return false for invalid hex strings', () => {
    const invalidHexStrings = [
      '0xGHIJKL',
      '0x12345Z',
      'xyz',
      '0x1234 ',
      ' 0x1234',
      '0x12.34',
      '0x12345',
      '0XABCDEF'
    ]
    invalidHexStrings.forEach(hexString => {
      expect(isHex(hexString)).toBe(false)
    })
  })
})
