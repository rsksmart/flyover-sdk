import chalk from 'chalk'
import inquirer from 'inquirer'
import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { PeginQuoteRequest } from '@rsksmart/flyover-sdk'
import { initializeFlyover, formatError, stringifyWithBigInt, waitForEnter } from '../../utils.js'
import { demoConfig } from '../../config.js'

/**
 * Authenticated pegin demonstration flow with signature modification capability
 * This flow allows users to modify the signature to test invalid signature handling
 */
export async function peginModifyingSignature(): Promise<void> {
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

    //Create quote request
    console.clear()
    console.log(chalk.cyan('='.repeat(80)))
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

    await waitForEnter('Press Enter to get quotes from provider...')

    // Get quotes
    const quotes = await flyover.getQuotes(request)

    if (!quotes || quotes.length === 0) {
      console.log(chalk.red('✗ No quotes available'))
      return
    }

    const quote = quotes[0]

    console.log(chalk.white('='.repeat(80)))
    console.log(chalk.white('\nRESPONSE:'))
    console.log(chalk.gray(stringifyWithBigInt(quotes, 2)))
    console.log()

    await waitForEnter('Press Enter to sign quote...')

    // Sign quote
    console.clear()
    console.log(chalk.cyan('='.repeat(80)))
    console.log(chalk.cyan('STEP 2: SIGNING QUOTE: CALLING flyover.signQuote()'))
    console.log(chalk.cyan('='.repeat(80)))

    console.log(chalk.white('\nPARAMETER:'))
    console.log(chalk.gray(stringifyWithBigInt(quote, 2)))
    console.log()

    await waitForEnter('Press Enter to sign quote...')

    const originalSignedQuote = await flyover.signQuote(quote)

    console.log(chalk.white('='.repeat(80)))
    console.log(chalk.white('\nRESPONSE:'))
    console.log(chalk.gray(stringifyWithBigInt(originalSignedQuote, 2)))
    console.log()

    await waitForEnter('Press Enter to modify signature...')

    // Allow signature modification
    console.clear()
    console.log(chalk.cyan('='.repeat(80)))
    console.log(chalk.cyan('STEP 2.5: SIGNATURE MODIFICATION'))
    console.log(chalk.cyan('='.repeat(80)))
    console.log(chalk.yellow('\nThis is the original signed quote:'))
    console.log(chalk.gray(stringifyWithBigInt(originalSignedQuote, 2)))

    console.log()

    const { modifiedSignature } = await inquirer.prompt([
      {
        type: 'input',
        name: 'modifiedSignature',
        message: 'Edit the signature (modify to test error handling):',
        default: originalSignedQuote,
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return 'Signature cannot be empty'
          }
          return true
        }
      }
    ])

    const signatureWasModified = modifiedSignature !== originalSignedQuote

    if (signatureWasModified) {
      console.log(chalk.yellow('⚠ Signature was modified - this will likely cause authentication failure'))
    } else {
      console.log(chalk.green('✓ Signature unchanged - should work normally'))
    }

    console.log(chalk.white('\nModified Signature:'))
    console.log(chalk.gray(stringifyWithBigInt(modifiedSignature, 2)))
    console.log()

    await waitForEnter('Press Enter to accept authenticated quote with modified signature...')

    // Accept authenticated quote with modified signature
    console.clear()
    console.log(chalk.cyan('='.repeat(80)))
    console.log(chalk.cyan('STEP 3: ACCEPTING QUOTE: CALLING flyover.acceptAuthenticatedQuote()'))
    console.log(chalk.cyan('='.repeat(80)))

    // Show the accept quote request parameters
    console.log(chalk.white('PARAMETERS:'))
    console.log('\nQUOTE:')
    console.log(chalk.gray(stringifyWithBigInt(quote, 2)))
    console.log('\nSIGNED QUOTE:')
    console.log(chalk.gray(stringifyWithBigInt(modifiedSignature, 2)))
    console.log()

    await waitForEnter('Press Enter to proceed...')

    const acceptedQuote = await flyover.acceptAuthenticatedQuote(quote, modifiedSignature)

    console.log(chalk.white('='.repeat(80)))
    console.log(chalk.white('\nRESPONSE:'))
    console.log(chalk.gray(stringifyWithBigInt(acceptedQuote, 2)))
    console.log()

    await waitForEnter('Press Enter to view demo summary and next steps...')

    // Display results
    console.clear()
    console.log(chalk.green.bold('='.repeat(80)))
    console.log(chalk.green.bold('AUTHENTICATED PEGIN DEMO WITH SIGNATURE TESTING COMPLETED!'))
    console.log(chalk.green.bold('='.repeat(80)))
    console.log()

    if (signatureWasModified) {
      console.log(chalk.yellow.bold('Note: Signature was modified but authentication still succeeded'))
      console.log(chalk.yellow('This might indicate the signature validation is not working as expected'))
      console.log()
    }

    console.log(chalk.white.bold('SUMMARY:'))
    console.log(chalk.white(`Bitcoin Deposit Address: ${chalk.yellow(acceptedQuote.bitcoinDepositAddressHash)}`))
    console.log(chalk.white(`Destination RSK Address: ${chalk.yellow(demoConfig.rskAddress)}`))
    console.log(chalk.white(`Amount: ${chalk.yellow(Number(demoConfig.peginAmount) / 1e18)} RBTC`))
    console.log(chalk.white(`Signature Modified: ${signatureWasModified ? chalk.red('Yes') : chalk.green('No')}`))
    console.log()
    console.log(chalk.blue('Next steps for real usage:'))
    console.log(chalk.gray('1. Send Bitcoin to the deposit address above'))
    console.log(chalk.gray('2. Wait for Bitcoin network confirmations'))
    console.log(chalk.gray('3. RBTC will be delivered to your RSK address'))
    console.log(chalk.gray('4. Monitor transaction status via Flyover SDK'))
    console.log()

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
  }
}
