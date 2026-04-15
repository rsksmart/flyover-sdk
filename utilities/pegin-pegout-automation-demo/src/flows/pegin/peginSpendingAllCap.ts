import chalk from 'chalk'
import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { PeginQuoteRequest, Flyover } from '@rsksmart/flyover-sdk'
import { initializeFlyover, formatError, stringifyWithBigInt, waitForEnter } from '../../utils.js'
import { demoConfig } from '../../config.js'

/**
 * Process a single quote attempt for locking cap testing
 * @param flyover - The initialized Flyover instance
 * @param quoteCount - The current quote attempt number
 * @returns The accepted quote response
 */
async function processQuoteAttempt(flyover: Flyover, quoteCount: number) {
  // Display attempt header
  console.clear()
  console.log(chalk.magenta('='.repeat(80)))
  console.log(chalk.magenta(`QUOTE ACCEPTANCE #${quoteCount} - TESTING LOCKING CAP LIMITS`))
  console.log(chalk.magenta('='.repeat(80)))
  console.log()

  // Step 1: Get quotes
  console.log(chalk.cyan('STEP 1: GETTING QUOTES: CALLING flyover.getQuotes()'))
  console.log(chalk.cyan('='.repeat(80)))

  const request: PeginQuoteRequest = {
    callEoaOrContractAddress: demoConfig.rskAddress,
    callContractArguments: '',
    valueToTransfer: demoConfig.peginAmount,
    rskRefundAddress: demoConfig.rskAddress
  }

  console.log(chalk.white('\nPARAMETER:'))
  console.log(chalk.gray(stringifyWithBigInt(request, 2)))
  console.log(chalk.white(`Amount: ${chalk.yellow(`${Number(request.valueToTransfer) / 1e18} RBTC`)}`))
  console.log()

  const quotes = await flyover.getQuotes(request)

  if (!quotes || quotes.length === 0) {
    console.log(chalk.red('✗ No quotes available'))
    throw new Error('No quotes available')
  }

  const quote = quotes[0]

  console.log(chalk.white('='.repeat(80)))
  console.log(chalk.white('\nRESPONSE:'))
  console.log(chalk.gray(stringifyWithBigInt(quotes, 2)))
  console.log()

  // Step 2: Sign quote
  console.log(chalk.cyan('STEP 2: SIGNING QUOTE: CALLING flyover.signQuote()'))
  console.log(chalk.cyan('='.repeat(80)))

  console.log(chalk.white('\nPARAMETER:'))
  console.log(chalk.gray(stringifyWithBigInt(quote, 2)))
  console.log()

  const signedQuote = await flyover.signQuote(quote)

  console.log(chalk.white('='.repeat(80)))
  console.log(chalk.white('\nRESPONSE:'))
  console.log(chalk.gray(stringifyWithBigInt(signedQuote, 2)))
  console.log()

  // Step 3: Accept authenticated quote (this is where cap exceeded error might occur)
  console.log(chalk.cyan('STEP 3: ACCEPTING QUOTE: CALLING flyover.acceptAuthenticatedQuote()'))
  console.log(chalk.cyan('='.repeat(80)))

  console.log(chalk.white('PARAMETERS:'))
  console.log('\nQUOTE:')
  console.log(chalk.gray(stringifyWithBigInt(quote, 2)))
  console.log('\nSIGNED QUOTE:')
  console.log(chalk.gray(stringifyWithBigInt(signedQuote, 2)))
  console.log()

  const acceptedQuote = await flyover.acceptAuthenticatedQuote(quote, signedQuote)

  console.log(chalk.white('='.repeat(80)))
  console.log(chalk.white('\nRESPONSE:'))
  console.log(chalk.gray(stringifyWithBigInt(acceptedQuote, 2)))
  console.log()

  console.log(chalk.green.bold(`✓ QUOTE #${quoteCount} ACCEPTED SUCCESSFULLY!`))
  console.log(chalk.yellow('Locking cap still has available space. Continuing...'))
  console.log()

  await waitForEnter(`Press Enter to attempt quote #${quoteCount + 1}...`)

  return acceptedQuote
}

/**
 * Handle errors that occur during quote attempts
 * @param error - The error that occurred
 * @param quoteCount - The current quote attempt number
 * @returns true if locking cap was exceeded (should stop loop), false if should continue
 */
async function handleQuoteAttemptError(error: unknown, quoteCount: number): Promise<boolean> {
  const flyoverError = error as { details?: { error?: string } }

  if (flyoverError?.details?.error?.includes('locking cap exceeded')) {
    console.log(chalk.red.bold('='.repeat(80)))
    console.log(chalk.red.bold(`LOCKING CAP EXCEEDED AFTER ${quoteCount - 1} SUCCESSFUL QUOTES!`))
    console.log(chalk.red.bold('='.repeat(80)))
    console.log()

    // Extract and display locking cap information
    try {
      const errorMessage = flyoverError.details.error
      const jsonMatch = errorMessage.match(/Args: ({.*})/)

      if (jsonMatch) {
        const lockingData = JSON.parse(jsonMatch[1])
        console.log(chalk.cyan.bold('LOCKING CAP ANALYSIS:'))
        console.log(`  Provider Address: ${lockingData.address}`)
        console.log(`  Current Locked: ${lockingData.currentLocked}`)
        console.log(`  Locking Cap: ${lockingData.lockingCap}`)

        const currentLocked = BigInt(lockingData.currentLocked)
        const lockingCap = BigInt(lockingData.lockingCap)
        const utilization = Number((currentLocked * BigInt(10000)) / lockingCap) / 100

        console.log(`  Utilization: ${utilization.toFixed(2)}%`)
        console.log()

        console.log(chalk.green.bold('SUCCESS: LOCKING CAP EXHAUSTION DEMONSTRATED!'))
        console.log(chalk.green(`Total quotes accepted before cap exceeded: ${quoteCount - 1}`))
      } else {
        console.log(chalk.yellow('Could not parse locking cap details from error message'))
      }
    } catch {
      console.log(chalk.yellow('Could not parse locking cap details from error message'))
    }

    console.log(chalk.white('\nError Details (JSON):'))
    console.log(chalk.gray(stringifyWithBigInt(error, 2)))
    console.log()

    return true // Cap exceeded, should stop loop
  } else {
    // Some other error occurred
    console.log()
    console.log(chalk.red.bold('✗ Unexpected error occurred:'))
    console.log(chalk.red(formatError(error)))
    console.log()

    console.log(chalk.white('Error Details (JSON):'))
    console.log(chalk.gray(stringifyWithBigInt({
      message: formatError(error),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
      } : error,
      timestamp: new Date().toISOString()
    }, 2)))
    console.log()

    throw error // Re-throw other errors to exit the program
  }
}

/**
 * Pegin demonstration flow for testing locking cap limits
 * This flow continuously accepts quotes until the provider's locking cap is exceeded
 */
export async function spendAllCapFlow(): Promise<void> {
  try {
    //Initialize Flyover SDK
    const flyover = await initializeFlyover()

    //Get liquidity providers
    const providers = await flyover.getLiquidityProviders()

    if (!providers || providers.length === 0) {
      console.log(chalk.red('✗ No providers available'))
      return
    }
    //Select provider
    const provider = providers.find(p => p.id === demoConfig.providerId)
    assertTruthy(provider, `Provider ${demoConfig.providerId} not found`)
    flyover.useLiquidityProvider(provider)

    await waitForEnter('Press Enter to start accepting quotes until cap is exceeded...')

    // Loop accepting quotes until cap is exceeded
    let quoteCount = 0
    let capExceeded = false

    while (!capExceeded) {
      quoteCount++
      try {
        await processQuoteAttempt(flyover, quoteCount)

      } catch (error: unknown) {
        capExceeded = await handleQuoteAttemptError(error, quoteCount)
      }
    }

    await waitForEnter('Press Enter to finish')

  } catch (error) {
    console.log()
    console.log(chalk.red.bold('✗ Demo failed:'))
    console.log(chalk.red(formatError(error)))
    console.log()

    // Show full error details in JSON
    console.log(chalk.white('Error Details (JSON):'))
    console.log(chalk.gray(stringifyWithBigInt({
      message: formatError(error),
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
      } : error,
      timestamp: new Date().toISOString()
    }, 2)))
    console.log()

    await waitForEnter('Press Enter to finish')
  }
}
