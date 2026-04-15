/**
 * Ensures a hex string has the '0x' prefix.
 * If the string already has the prefix, it is returned as is.
 * If the string doesn't have the prefix, it is added.
 *
 * @param hexString The hex string to format
 * @returns The hex string with '0x' prefix
 */
export function ensureHexPrefix (hexString: string): string {
  return hexString.toLowerCase().startsWith('0x') ? hexString : '0x' + hexString
}
