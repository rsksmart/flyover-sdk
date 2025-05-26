export const remove0x = (value: string) => (value.startsWith('0x') || value.startsWith('0X')) ? value.slice(2) : value
