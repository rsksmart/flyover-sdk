import { describe, test, jest, expect } from '@jest/globals'
import { BridgeError } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { depositPegout } from './depositPegout'

const quoteMock: PegoutQuote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddress: 'any address',
    callFee: BigInt(1),
    depositAddr: 'any address',
    depositConfirmations: 1,
    depositDateLimit: 1,
    expireBlocks: 1,
    expireDate: 1,
    gasFee: BigInt(1),
    lbcAddress: 'any address',
    liquidityProviderRskAddress: 'any address',
    lpBtcAddr: 'any address',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddress: 'any address',
    transferConfirmations: 1,
    transferTime: 1,
    value: BigInt(1),
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: 'any hash'
}
const successfulResultMock = { successful: true, txHash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }

const lbcMock = jest.mocked({
  pegOutContract: {
    depositPegout: async (_quote: PegoutQuote, _signature: string, _amount: bigint) => Promise.resolve(successfulResultMock)
  },
} as LiquidityBridgeContract, { shallow: true })

describe('depositPegout function should', () => {
  test('fail on pegout quote missing properties', async () => {
    const amount = BigInt(500)
    const signature = '0x1234'
    await expect(depositPegout({} as any, signature, amount, lbcMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
    await expect(depositPegout({ quoteHash: 'any hash', quote: {} } as any, signature, amount, lbcMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteDetailRequiredFields.join(', ')}`)
  })

  test('fail on missing amount', async () => {
    const amount = undefined
    const signature = '0x1234'
    await expect(depositPegout(quoteMock, signature, amount as any, lbcMock)).rejects
      .toThrow('Validation failed for object with following missing properties: amount')
    await expect(depositPegout(quoteMock, signature, amount as any, lbcMock)).rejects
      .toThrow('Validation failed for object with following missing properties: amount')
  })

  test('fail on missing signature', async () => {
    const amount = BigInt(500)
    const signature: any = undefined
    await expect(depositPegout(quoteMock, signature, amount, lbcMock)).rejects
      .toThrow('Validation failed for object with following missing properties: signature')
  })

  test('execute LBC depositPegout correctly', async () => {
    const amount = BigInt(500)
    const signature = '0x1234'
    jest.spyOn(lbcMock.pegOutContract, 'depositPegout').mockResolvedValue(successfulResultMock)
    await depositPegout(quoteMock, signature, amount, lbcMock)
    expect(lbcMock.pegOutContract.depositPegout).toBeCalledTimes(1)
    expect(lbcMock.pegOutContract.depositPegout).lastCalledWith(quoteMock, signature, amount)
  })

  test('return txHash on successful execution', async () => {
    const amount = BigInt(500)
    const signature = '0x1234'
    const txHash = await depositPegout(quoteMock, signature, amount, lbcMock)
    expect(txHash).toEqual(successfulResultMock.txHash)
  })
  test('throw FlyoverError on non successful execution (tx returned ok but with status 0)', async () => {
    jest.spyOn(lbcMock.pegOutContract, 'depositPegout').mockResolvedValue({ successful: false, txHash: '0x8fbfb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' })
    const amount = BigInt(500)
    const signature = '0x1234'
    expect.assertions(2)
    await depositPegout(quoteMock, signature, amount, lbcMock).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('deposit pegout transaction did not complete successfully')
    })
  })
})
