
const errorCodes: Record<string, string> = {
  LBC001: 'Not registered',
  LBC002: 'Reentrant call',
  LBC003: 'Not EOA',
  LBC004: 'Invalid reward percentage',
  LBC005: 'Not owner or provider',
  LBC006: 'Invalid Status',
  LBC007: 'Not allowed',
  LBC008: 'Not enough collateral',
  LBC009: 'Withdraw collateral first',
  LBC010: 'Name must not be empty',
  LBC011: 'Fee must be greater than 0',
  LBC012: 'Quote expiration must be greater than 0',
  LBC013: 'Accepted quote expiration must be greater than 0',
  LBC014: 'Min transaction value must be greater than 0',
  LBC015: 'Max transaction value must be greater than min transaction value',
  LBC016: "Max transaction value can't be higher than maximum quote value",
  LBC017: 'API base URL must not be empty',
  LBC018: 'Invalid provider type',
  LBC019: 'Insufficient funds',
  LBC020: 'Sending funds failed',
  LBC021: 'Need to resign first',
  LBC022: 'Not enough blocks',
  LBC023: 'Already resigned',
  LBC024: 'Unauthorized',
  LBC025: 'Quote already processed',
  LBC026: 'Insufficient gas',
  LBC027: 'Block timestamp overflow',
  LBC028: 'Quote already registered',
  LBC029: 'Invalid signature',
  LBC030: 'Height must be lower than 2^31',
  LBC031: 'Error -303: Failed to validate BTC transaction',
  LBC032: 'Error -302: Transaction already processed',
  LBC033: 'Error -304: Transaction value is zero',
  LBC034: 'Error -305: Transaction UTXO value is below the minimum',
  LBC035: 'Error -900: Bridge error',
  LBC036: 'Unknown Bridge error',
  LBC037: 'Provider not registered',
  LBC038: 'LBC: Quote already refunded',
  LBC039: 'LBC: Block height overflown',
  LBC040: 'LBC: Quote already pegged out',
  LBC041: 'LBC: Quote not expired yet',
  LBC042: 'LBC: Deposit not found',
  LBC043: 'LBC: Quote already refunded',
  LBC044: 'LBC: Error on refund user',
  LBC045: 'LBC: Quote not processed',
  LBC046: 'LBC: Quote expired by date',
  LBC047: 'LBC: Quote expired by blocks',
  LBC048: 'LBC: Wrong sender',
  LBC049: "LBC: Don't have required confirmations",
  LBC050: 'Failed to send refund to LP address',
  LBC051: 'Wrong LBC address',
  LBC052: 'Bridge is not an accepted contract address',
  LBC053: 'BTC refund address must be 21 or 33 bytes long',
  LBC054: 'BTC LP address must be 21 bytes long',
  LBC055: 'Too low agreed amount',
  LBC056: 'Wrong LBC address',
  LBC057: 'Too low transferred amount',
  LBC058: 'Invalid block height',
  LBC059: '1st block height invalid',
  LBC060: 'N block height invalid',
  LBC061: 'Invalid header length',
  LBC062: 'Slicing out of range',
  LBC063: 'Not enough value'
}

export function processError (error: any): any { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (typeof error === 'string') {
    const errorCode = error.match(/LBC\d{3}/g)?.[0]
    if (errorCode !== undefined && errorCodes[errorCode] !== undefined) {
      throw new Error(error.replace(errorCode, errorCodes[errorCode] as string))
    }
    throw new Error(error)
  } else if (error instanceof Error) {
    throw error
  }
  return error
}
