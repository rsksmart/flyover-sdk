import {
  deepFreeze, isRskAddress, rskChecksum,
  isRskChecksummedAddress, isBtcAddress, isBtcNativeSegwitAddress,
  isBtcTestnetAddress, isBtcMainnetAddress, isLegacyBtcAddress
} from '@rsksmart/bridges-core-sdk'
import { getSimpleQuoteStatus } from '../constants/status'
import { getQuoteTotal, isPeginStillPayable } from '../utils/quote'

export const FlyoverUtils = deepFreeze({
  /**
    * Convert the status of a quote to a simple status usable by the client without knowing
    * the specific meaning of every status involved in the pegin/pegout process. Useful for
    * parsing the output of {@link Flyover.getPeginStatus} and {@link Flyover.getPegoutStatus}
    *
    * @param { string } status The status of a Pegin or Pegout quote
    * @returns { 'EXPIRED' | 'PENDING' | 'SUCCESS' | 'FAILED' } A simplified version of the status usable by the client
    */
  getSimpleQuoteStatus,
  /**
    * Get the total value of a given pegin or pegout quote without knowing the specific
    * operations to calculate it.
    *
    * @param { Quote | PegoutQuote } quote The quote to get the total of
    *
    * @returns { bigint } The total value of the quote to be paid
    */
  getQuoteTotal,
  /**
    * Check if a given string is a valid RSK address
    *
    * @param { string } address The address to check
    *
    * @returns { boolean } Whether the address is a valid RSK address or not
    */
  isRskAddress,
  /**
    * Check if a given string is a valid RSK checksummed address
    *
    * @param { string } address The address to check
    *
    * @returns { boolean } Whether the address is a valid RSK checksummed address or not
    */
  isRskChecksummedAddress,
  /**
    * Check if a given string is a valid BTC address
    *
    * @param { string } address The address to check
    *
    * @returns { boolean } Whether the address is a valid BTC address or not
    */
  isBtcAddress,
  /**
    * Check if a given string is a valid BTC native segwit address (P2WPKH or P2WSH)
    *
    * @param { string } address The address to check
    *
    * @returns { boolean } Whether the address is a valid BTC native segwit address or not
    */
  isBtcNativeSegwitAddress,
  /**
    * Check if a given string is a valid BTC testnet address
    *
    * @param { string } address The address to check
    *
    * @returns { boolean } Whether the address is a valid BTC testnet address or not
    */
  isBtcTestnetAddress,
  /**
    * Check if a given string is a valid BTC mainnet address
    *
    * @param { string } address The address to check
    *
    * @returns { boolean } Whether the address is a valid BTC mainnet address or not
    */
  isBtcMainnetAddress,
  /**
    * Check if a given string is a valid legacy BTC address (P2PKH or P2SH)
    *
    * @param { string } address The address to check
    *
    * @returns { boolean } Whether the address is a valid legacy BTC address or not
    */
  isLegacyBtcAddress,
  /**
    * Checksum a valid RSK address
    *
    * @param { string } address The address to apply the checksum
    * @param { 30|31|33 } chainId The chain id to use for the checksum
    *
    * @throws { FlyoverError } If the address is not a valid RSK address
    *
    * @returns { string } The checksummed address
    */
  rskChecksum,
  /**
    * Checks if a given pegin quote is still payable or if it has expired
    *
    * @param { Quote } quote The quote of the pegin to check
    *
    * @returns { boolean } Weather the quote is still payable or not
    */
  isPeginStillPayable
} as const)
