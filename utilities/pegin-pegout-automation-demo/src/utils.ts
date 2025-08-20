import { Flyover } from '@rsksmart/flyover-sdk'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import inquirer from 'inquirer'
import { demoConfig } from './config.js'

/**
 * Fake token resolver for demo purposes
 */
export const fakeTokenResolver: () => Promise<string> = async () => Promise.resolve('demo-captcha-token')

/**
 * Initialize Flyover SDK
 */
export async function initializeFlyover(): Promise<Flyover> {
  // Create Flyover instance
  const flyover = new Flyover({
    network: demoConfig.network,
    allowInsecureConnections: true,
    captchaTokenResolver: fakeTokenResolver,
    disableChecksum: true
  })

  // Create RSK connection using mnemonic
  const rsk = await BlockchainConnection.createUsingPassphrase(
    demoConfig.mnemonic,
    demoConfig.nodeUrl
  )

  // Connect to RSK
  await flyover.connectToRsk(rsk)

  return flyover
}

/**
 * Simple error formatting
 */
export function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

/**
 * JSON stringify with BigInt support
 * Converts BigInt values to strings for JSON serialization
 */
export function stringifyWithBigInt(obj: unknown, space?: number): string {
  return JSON.stringify(obj, (key, value) => {
    if (typeof value === 'bigint') {
      return value.toString()
    }
    return value
  }, space)
}

/**
 * Wait for user to press Enter to continue
 * @param message - Optional custom message (defaults to "Press Enter to continue...")
 */
export async function waitForEnter(message = 'Press Enter to continue...'): Promise<void> {
  await inquirer.prompt([
    {
      type: 'input',
      name: 'continue',
      message
    }
  ])
}
