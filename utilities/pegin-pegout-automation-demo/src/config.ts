import { FlyoverNetworks } from '@rsksmart/flyover-sdk'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

/**
 * Demo configuration interface
 */
export interface DemoConfig {
  network: keyof typeof FlyoverNetworks
  mnemonic: string
  providerId: number
  nodeUrl: string
  rskAddress: string
  btcAddress: string
  peginAmount: bigint
  pegoutAmount: bigint
}

/**
 * Load demo configuration from environment variables
 */
function getConfig(): DemoConfig {
  const {
    DEMO_NETWORK: network,
    DEMO_MNEMONIC: mnemonic,
    DEMO_PROVIDER_ID: providerId,
    DEMO_NODE_URL: nodeUrl,
    DEMO_RSK_ADDRESS: rskAddress,
    DEMO_BTC_ADDRESS: btcAddress,
    DEMO_PEGIN_AMOUNT: peginAmount,
    DEMO_PEGOUT_AMOUNT: pegoutAmount
  } = process.env

  // Simple validation - throw if missing
  if (!mnemonic) throw new Error('Missing DEMO_MNEMONIC')
  if (!providerId) throw new Error('Missing DEMO_PROVIDER_ID')
  if (!nodeUrl) throw new Error('Missing DEMO_NODE_URL')
  if (!rskAddress) throw new Error('Missing DEMO_RSK_ADDRESS')
  if (!btcAddress) throw new Error('Missing DEMO_BTC_ADDRESS')
  if (!peginAmount) throw new Error('Missing DEMO_PEGIN_AMOUNT')
  if (!pegoutAmount) throw new Error('Missing DEMO_PEGOUT_AMOUNT')
  if (!network) throw new Error('Missing DEMO_NETWORK')

  return {
    network: network as keyof typeof FlyoverNetworks,
    mnemonic,
    providerId: Number(providerId),
    peginAmount: BigInt(peginAmount),
    pegoutAmount: BigInt(pegoutAmount),
    nodeUrl,
    rskAddress,
    btcAddress
  }
}

// Export the configuration
export const demoConfig = getConfig()
