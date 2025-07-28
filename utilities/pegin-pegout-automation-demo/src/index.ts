#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import { peginHappyPath } from './flows/pegin/peginHappyPath.js'
import { peginModifyingSignature } from './flows/pegin/peginModifyingSignature.js'
import { pegoutHappyPath } from './flows/pegout/pegout.js'
import { spendAllCapFlow } from './flows/pegin/peginSpendingAllCap.js'

async function main(): Promise<void> {
  console.clear()
  console.log(chalk.cyan.bold('╔══════════════════════════════════════════════════════════════╗'))
  console.log(chalk.cyan.bold('║                     FLYOVER SDK DEMO                         ║'))
  console.log(chalk.cyan.bold('║              Authenticated Pegin/Pegout CLI                  ║'))
  console.log(chalk.cyan.bold('╚══════════════════════════════════════════════════════════════╝'))
  console.log()

  try {
    // Main operation selection
    const { operation } = await inquirer.prompt([
      {
        type: 'list',
        name: 'operation',
        message: 'SELECT AN OPERATION',
        choices: [
          new inquirer.Separator(),
          {
            name: 'Pegin happy path',
            value: 'pegin'
          },
          {
            name: 'Pegin modifying signature',
            value: 'peginInvalid'
          },
          {
            name: 'Pegin spending all cap',
            value: 'spendAllCap'
          },
          new inquirer.Separator(),
          {
            name: 'Pegout happy path',
            value: 'pegout'
          },
          new inquirer.Separator(),
          {
            name: 'Exit',
            value: 'exit'
          }
        ],
        pageSize: 10
      }
    ])

    console.log()

    switch (operation) {
      case 'pegin':
        await peginHappyPath()
        break

      case 'peginInvalid':
        await peginModifyingSignature()
        break

      case 'pegout':
        await pegoutHappyPath()
        break

      case 'spendAllCap':
        await spendAllCapFlow()
        break

      case 'exit':
        process.exit(0)
        break

      default:
        console.log(chalk.red('Invalid selection. Please try again.'))
        process.exit(1)
    }

  } catch (error) {
    console.error(chalk.red.bold('\nError occurred:'))
    if (error instanceof Error) {
      console.error(chalk.red(error.message))
    } else {
      console.error(chalk.red('Unknown error occurred'))
    }
    process.exit(1)
  }
}

// Handle process termination gracefully
process.on('SIGINT', () => {
  process.exit(0)
})

process.on('SIGTERM', () => {
  process.exit(0)
})

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(chalk.red.bold('\nFatal error:'))
    console.error(chalk.red(error.message || error))
    process.exit(1)
  })
}
