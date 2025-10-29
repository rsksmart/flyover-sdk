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
