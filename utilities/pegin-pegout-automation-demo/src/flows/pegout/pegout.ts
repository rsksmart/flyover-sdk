import chalk from 'chalk'
import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { PegoutQuoteRequest } from '@rsksmart/flyover-sdk'
import { initializeFlyover, formatError, stringifyWithBigInt, waitForEnter } from '../../utils.js'
import { demoConfig } from '../../config.js'

/**
 * Authenticated pegout demonstration flow
 */
export async function pegoutHappyPath(): Promise<void> {
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

    //Create pegout quote request
    console.clear()
    console.log(chalk.cyan('='.repeat(80)))
    console.log(chalk.cyan('STEP 1: GETTING PEGOUT QUOTES: CALLING flyover.getPegoutQuotes()'))
    console.log(chalk.cyan('='.repeat(80)))

    const request: PegoutQuoteRequest = {
      rskRefundAddress: demoConfig.rskAddress,
      to: demoConfig.btcAddress,
      valueToTransfer: demoConfig.pegoutAmount
    }

    console.log(chalk.white('\nPARAMETER:'))
    console.log(chalk.gray(stringifyWithBigInt(request, 2)))
    console.log(chalk.white(`Amount: ${chalk.yellow(`${Number(request.valueToTransfer) / 1e18} RBTC`)}`))
    console.log()

    await waitForEnter()

    // Get pegout quotes
    const quotes = await flyover.getPegoutQuotes(request)

    if (!quotes || quotes.length === 0) {
      console.log(chalk.red('✗ No pegout quotes available'))
      return
    }

    const quote = quotes[0]

    console.log(chalk.white('='.repeat(80)))
    console.log(chalk.white('\nRESPONSE:'))
    console.log(chalk.gray(stringifyWithBigInt(quotes, 2)))
    console.log()

    await waitForEnter()

    // Sign pegout quote
    console.clear()
    console.log(chalk.cyan('='.repeat(80)))
    console.log(chalk.cyan('STEP 2: SIGNING QUOTE: CALLING flyover.signQuote()'))
    console.log(chalk.cyan('='.repeat(80)))

    console.log(chalk.white('\nPARAMETER:'))
    console.log(chalk.gray(stringifyWithBigInt(quote, 2)))
    console.log()

    await waitForEnter()

    const signedQuote = await flyover.signQuote(quote)

    console.log(chalk.white('='.repeat(80)))
    console.log(chalk.white('\nRESPONSE:'))
    console.log(chalk.gray(stringifyWithBigInt(signedQuote, 2)))
    console.log()

    await waitForEnter()

    // Accept authenticated pegout quote
    console.clear()
    console.log(chalk.cyan('='.repeat(80)))
    console.log(chalk.cyan('STEP 3: ACCEPTING PEGOUT QUOTE: CALLING flyover.acceptAuthenticatedPegoutQuote()'))
    console.log(chalk.cyan('='.repeat(80)))

    // Show the accept pegout quote request parameters
    console.log(chalk.white('PARAMETERS:'))
    console.log('\nQUOTE:')
    console.log(chalk.gray(stringifyWithBigInt(quote, 2)))
    console.log('\nSIGNED QUOTE:')
    console.log(chalk.gray(stringifyWithBigInt(signedQuote, 2)))
    console.log()

    await waitForEnter()

    const acceptedQuote = await flyover.acceptAuthenticatedPegoutQuote(quote, signedQuote)

    console.log(chalk.white('='.repeat(80)))
    console.log(chalk.white('\nRESPONSE:'))
    console.log(chalk.gray(stringifyWithBigInt(acceptedQuote, 2)))
    console.log()

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

    console.log(chalk.gray('This might be due to:'))
    console.log(chalk.gray('- Network connectivity issues'))
    console.log(chalk.gray('- Provider not available for pegout'))
    console.log(chalk.gray('- Insufficient RBTC balance'))
    console.log(chalk.gray('- Invalid pegout configuration'))
    console.log()

    await waitForEnter('Press Enter to finish')
  }
}
