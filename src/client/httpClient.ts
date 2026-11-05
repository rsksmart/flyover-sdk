import { BridgeError } from '@rsksmart/bridges-core-sdk'

export class FlyoverError extends BridgeError {
  static withReason (message: string): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: true,
      message: 'Flyover error',
      details: message
    })
  }

  static invalidQuoteHashError (serverUrl: string): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      serverUrl,
      message: 'Quote hash mismatch',
      details: `Real quote hash doesn't match quote hash provided by server. ${serverUrl} is potentially a malicious liquidity provider.`
    })
  }

  static manipulatedQuoteResonseError (serverUrl: string): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      serverUrl,
      message: 'Manipulated quote response',
      details: `The quote response of the server doesn't match with the parameters specified in the quote request.
        ${serverUrl} is potentially a malicious liquidity provider.`
    })
  }

  static invalidSignatureError (args: { serverUrl: string, signature: string, address: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      serverUrl: args.serverUrl,
      message: 'Invalid signature',
      details: `Address ${args.address} couldn't be recovered from signature ${args.signature}.
        ${args.serverUrl} is potentially a malicious liquidity provider.`
    })
  }

  static untrustedBtcAddressError (args: { serverUrl: string, address: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      serverUrl: args.serverUrl,
      message: 'Invalid BTC address',
      details: `Address ${args.address} doesn't belong to the expected receiver.
        ${args.serverUrl} is potentially a malicious liquidity provider.`
    })
  }

  static untrustedLbcAddressError (args: { serverUrl: string, received: string, expected: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      serverUrl: args.serverUrl,
      message: 'Untrusted LBC address',
      details: `The LBC address returned by the server (${args.received}) does not match the trusted contract address (${args.expected}).
        ${args.serverUrl} is potentially a malicious liquidity provider.`
    })
  }

  static unsupportedBtcAddressError (address: string): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Invalid BTC address',
      details: `The type of address ${address} is not supported currently.`
    })
  }

  static wrongNetworkError (mainnet: boolean): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Wrong network',
      details: `It was used an address which is not from ${mainnet ? 'Mainnet' : 'Testnet'} network.`
    })
  }

  static invalidRskAddress (address: string): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Invalid RSK address',
      details: `Address ${address} is not a valid RSK address.`
    })
  }

  static checksumError (addresses: string[]): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Invalid RSK address checksum',
      details: `The following addresses doesn't have a valid checksum address: ${addresses.join(', ')}`
    })
  }

  static protocolPaused(args: { reason: string, timestamp: number }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: true,
      message: 'Protocol paused',
      details: { reason: args.reason, timestamp: args.timestamp }
    })
  }

  static invalidPegoutAmount (args: { amount: bigint, reason: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Invalid peg-out amount',
      details: { amount: args.amount.toString(), reason: args.reason }
    })
  }

  static pegoutInsufficientValue (args: { value: bigint, minimum: bigint }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Peg-out value too low',
      details: {
        value: args.value.toString(),
        minimum: args.minimum.toString(),
        reason: `the value must be at least ${args.minimum.toString()} wei (fixedFee + maxMinerFee + 1)`
      }
    })
  }

  static pegoutNotServiceable (args: { amount: bigint, minAmount: bigint, maxAmount: bigint, violatedBound: 'minAmount' | 'maxAmount' }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Peg-out not serviceable',
      details: {
        amount: args.amount.toString(),
        minAmount: args.minAmount.toString(),
        maxAmount: args.maxAmount.toString(),
        violatedBound: args.violatedBound
      }
    })
  }

  static pegoutRequestReverted (args: { txHash: string, reason: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Peg-out request reverted',
      details: { txHash: args.txHash, reason: args.reason }
    })
  }

  static pegoutCancelReverted (args: { txHash: string, reason: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'Peg-out cancel reverted',
      details: { txHash: args.txHash, reason: args.reason }
    })
  }

  static pegoutInvalidState (args: { requestHash: string, expected: string, actual: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'InvalidState',
      details: {
        requestHash: args.requestHash,
        expected: args.expected,
        actual: args.actual,
        reason: `the peg-out is ${args.actual}, not ${args.expected}`
      }
    })
  }

  static pegoutInvalidSender (args: { requestHash: string, expected: string, actual: string }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: false,
      message: 'InvalidSender',
      details: {
        requestHash: args.requestHash,
        expected: args.expected,
        actual: args.actual,
        reason: 'only the refund address of the peg-out can cancel it'
      }
    })
  }

  static unfairPegoutConfiguration (args: { deadlineSeconds: bigint, maxSeconds: bigint, deadlineBlocks: bigint, maxBlocks: bigint }): FlyoverError {
    return new FlyoverError({
      timestamp: Date.now(),
      recoverable: true,
      message: 'Unfair peg-out configuration',
      details: {
        reason: 'the peg-out deadlines exceed the native peg-out cap, so the escrow would reject any request',
        deadlineSeconds: args.deadlineSeconds.toString(),
        maxSeconds: args.maxSeconds.toString(),
        deadlineBlocks: args.deadlineBlocks.toString(),
        maxBlocks: args.maxBlocks.toString()
      }
    })
  }
}
