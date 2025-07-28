# Flyover SDK Pegin/Pegout Automation Demo

This utility provides automated demonstration flows for testing and showcasing the Flyover SDK's pegin and pegout automation functionalities. It includes interactive demos with clear step-by-step presentations and error handling scenarios.

## Overview

The automation demo includes several flows designed to demonstrate different aspects of the Flyover protocol:

- **Pegin Flows**: Move Bitcoin to RSK (RBTC)
- **Pegout Flows**: Move RBTC to Bitcoin
- **Testing Scenarios**: Error handling, capacity limits, and signature validation

## Prerequisites

- Having the local environment running with the flyover sdk installed and configured.
- Having a valid mnemonic and addresses for testing in local.
- The nmemonic should be the one capable of derivating the whitelisted addresses for the demo.

## Installation

1. Navigate to the demo directory:
```bash
cd utilities/pegin-pegout-automation-demo
```

2. Install dependencies:
```bash
npm install
```

3. Set up configuration (see Configuration section below)

## Configuration

Create a configuration file based on the example.env file. Rename it to .env.

## Available Flows

### Pegin Flows

#### 1. Pegin Happy Path (`peginHappyPath`)
Demonstrates the standard authenticated pegin flow:
- Get quotes from liquidity provider
- Sign the quote
- Accept the authenticated quote

#### 2. Pegin with Signature Modification (`peginModifyingSignature`)
Tests signature validation by allowing manual signature modification:
- Follows standard pegin flow
- Allows user to modify the signature
- Tests error handling for invalid signatures

#### 3. Pegin Spending All Cap (`peginSpendingAllCap`)
Tests provider capacity limits:
- Continuously accepts quotes until provider cap is exceeded
- Demonstrates locking cap analysis
- Shows capacity management behavior

### Pegout Flows

#### 1. Pegout Happy Path (`pegoutHappyPath`)
Demonstrates the standard authenticated pegout flow:
- Get pegout quotes from liquidity provider
- Sign the pegout quote
- Accept the authenticated pegout quote

### Notes:
After an execution of the demo, can be useful to delete the registers on the Database. Executing this script in the mongo shell will do the trick:
```bash
use flyover
```
and then

```bash
db["peginQuote"].deleteMany({})
db["peginQuoteCreationData"].deleteMany({})
db["retainedPeginQuote"].deleteMany({})
db["pegoutQuote"].deleteMany({})
db["pegoutQuoteCreationData"].deleteMany({})
db["retainedPegoutQuote"].deleteMany({})
```

## Flow Structure

Each flow follows a consistent presentation format:

### Step Presentation
```
================================================================================
STEP X: DESCRIPTION: CALLING flyover.methodName()
================================================================================

PARAMETER:
{
  "key": "value"
}

[Press Enter to continue...]

================================================================================

RESPONSE:
{
  "response": "data"
}
```

### Interactive Pauses
- Each step waits for user input before proceeding
- Clear parameter and response display
- Consistent error handling and formatting
