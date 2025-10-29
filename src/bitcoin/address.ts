
export const BTC_ADDRESS_TYPES = [
    "p2pkh",
    "p2sh",
    "p2wpkh",
    "p2wsh",
    "p2tr",
] as const

export type BtcAddressType = typeof BTC_ADDRESS_TYPES[number]
