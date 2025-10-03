import { deepFreeze } from '@rsksmart/bridges-core-sdk'

/**
 * Object with available mempool URLs for different networks
 */
export const MempoolBaseUrls = deepFreeze({
  Mainnet: 'https://mempool.space/api',
  Testnet: 'https://mempool.space/testnet/api'
})
