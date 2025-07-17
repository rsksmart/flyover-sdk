import chalk from 'chalk'
import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { PeginQuoteRequest } from '@rsksmart/flyover-sdk'
import { initializeFlyover, formatError, stringifyWithBigInt, waitForEnter } from '../../utils.js'
import { demoConfig } from '../../config.js'

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
      console.clear()
      console.log(chalk.magenta('='.repeat(80)))
      console.log(chalk.magenta(`QUOTE ACCEPTANCE #${quoteCount} - TESTING LOCKING CAP LIMITS`))
      console.log(chalk.magenta('='.repeat(80)))
      console.log()

      try {
        const request: PeginQuoteRequest = {
          callEoaOrContractAddress: demoConfig.rskAddress,
          callContractArguments: '',
          valueToTransfer: demoConfig.peginAmount,
          rskRefundAddress: demoConfig.rskAddress
        }

        const quotes = await flyover.getQuotes(request)

        if (!quotes || quotes.length === 0) {
          console.log(chalk.red('✗ No quotes available'))
          return
        }

        const quote = quotes[0]

        const signedQuote = await flyover.signQuote(quote)

        // Step 3: Accept authenticated quote (this is where cap exceeded error might occur)

        const acceptedQuote = await flyover.acceptAuthenticatedQuote(quote, signedQuote)

        console.log(chalk.white('='.repeat(80)))
        console.log(chalk.white('\nFINALRESPONSE:'))
        console.log(chalk.gray(stringifyWithBigInt(acceptedQuote, 2)))
        console.log()

        console.log(chalk.green.bold(`✓ QUOTE #${quoteCount} ACCEPTED SUCCESSFULLY!`))
        console.log(chalk.yellow('Locking cap still has available space. Continuing...'))
        console.log()

        await waitForEnter(`Press Enter to attempt quote #${quoteCount + 1}...`)

      } catch (error: unknown) {
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

          capExceeded = true
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
          throw error
        }
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
