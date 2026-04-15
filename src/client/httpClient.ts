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
}
