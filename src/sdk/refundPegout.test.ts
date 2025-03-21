import { describe, test, jest, expect } from '@jest/globals'
import { BridgeError } from '@rsksmart/bridges-core-sdk'
import { type PegoutQuote, pegoutQuoteDetailRequiredFields, pegoutQuoteRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { refundPegout } from './refundPegout'

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
  refundPegout: async (_quote: PegoutQuote, _signature: string) => Promise.resolve(successfulResultMock)
} as LiquidityBridgeContract, { shallow: true })

describe('refundPegout function should', () => {
  test('fail on pegout quote missing properties', async () => {
    await expect(refundPegout({} as any, lbcMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
    await expect(refundPegout({ quoteHash: 'any hash', quote: {} } as any, lbcMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteDetailRequiredFields.join(', ')}`)
  })

  test('execute LBC refundPegout correctly', async () => {
    jest.spyOn(lbcMock, 'refundPegout').mockResolvedValue(successfulResultMock)
    await refundPegout(quoteMock, lbcMock)
    expect(lbcMock.refundPegout).toBeCalledTimes(1)
    expect(lbcMock.refundPegout).lastCalledWith(quoteMock)
  })

  test('return txHash on successful execution', async () => {
    const txHash = await refundPegout(quoteMock, lbcMock)
    expect(txHash).toEqual(successfulResultMock.txHash)
  })

  test('throw FlyoverError on non successful execution (tx returned ok but with status 0)', async () => {
    jest.spyOn(lbcMock, 'refundPegout').mockResolvedValue({ successful: false, txHash: '0x8fbfb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' })
    expect.assertions(2)
    await refundPegout(quoteMock, lbcMock).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('refund pegout transaction did not complete successfully')
    })
  })
})
