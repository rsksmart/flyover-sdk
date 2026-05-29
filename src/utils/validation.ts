import { type FlyoverConfig, isRskChecksummedAddress } from '@rsksmart/bridges-core-sdk'
import { FlyoverError } from '../client/httpClient'
import { FlyoverNetworks } from '../constants/networks'

export function validateRskChecksum (config: FlyoverConfig, ...addresses: string[]): void {
  if (config.disableChecksum === true) {
    return
  }
  const chainId = FlyoverNetworks[config.network as keyof typeof FlyoverNetworks].chainId
  const invalidAddresses = addresses.filter(address => !isRskChecksummedAddress(address, chainId))
  if (invalidAddresses.length > 0) {
    throw FlyoverError.checksumError(invalidAddresses)
  }
}

export const isHex = (value: string) => /^(0x)?([0-9A-Fa-f]{2})*$/.test(value)

/**
 * Compares two strings for equality, ignoring case. If any of the values is falsy,
 * it returns true only if they are the exact same falsy value
 * @param str1 a string to compare
 * @param str2 another string to compare
 * @returns whether they are the same or not, ignoring case
 */
export const isTextEqualNoCase = (str1: string, str2: string): boolean => {
  if (!str1 || !str2) {
    return str1 === str2
  }
  return str1.toLowerCase() === str2.toLowerCase()
}
