import { describe, test, expect, jest } from '@jest/globals'
import { type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import * as core from '@rsksmart/bridges-core-sdk'
import { FlyoverError } from '..'
import { validateRskChecksum } from './validation'

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
