import { describe, test, jest, expect } from '@jest/globals'
import { BridgeError } from '@rsksmart/bridges-core-sdk'
import { type Quote, quoteDetailRequiredFields, quoteRequiredFields } from '../api'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { registerPegin, type RegisterPeginParams } from './registerPegin'

const quoteMock: Quote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddr: 'any address',
    callFee: BigInt(1),
    contractAddr: 'any address',
    confirmations: 1,
    gasLimit: 1,
    lbcAddr: 'any address',
    lpRSKAddr: 'any address',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddr: 'any address',
    timeForDeposit: 1,
    value: BigInt(1),
    callOnRegister: true,
    data: '0x',
    fedBTCAddr: 'any address',
    lpBTCAddr: 'any address',
    lpCallTime: 1,
    gasFee: BigInt(1),
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: 'any hash'
}

const successfulResultMock = { successful: true, txHash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }

const paramsMock: RegisterPeginParams = {
  quote: quoteMock,
  signature: 'any signaure',
  btcRawTransaction: 'any tx',
  partialMerkleTree: 'any pmt',
  height: 1
}

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const lbcMock = jest.mocked({
  registerPegin: async (
    _params: RegisterPeginParams,
    _action: 'staticCall' | 'execution'
  ) => Promise.resolve(successfulResultMock)
} as LiquidityBridgeContract, { shallow: true })

describe('registerPegin function should', () => {
  test('fail on params missing properties', async () => {
    await expect(registerPegin({} as any, lbcMock)).rejects
      .toThrow('Validation failed for object with following missing properties: quote, signature, btcRawTransaction, partialMerkleTree, height')
    const missingQuoteParams: any = { ...paramsMock, quote: {} }
    await expect(registerPegin(missingQuoteParams, lbcMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${quoteRequiredFields.join(', ')}`)
    const missingQuoteDetailParams: any = { ...paramsMock, quote: { quote: {}, quoteHash: 'any hash' } }
    await expect(registerPegin(missingQuoteDetailParams, lbcMock)).rejects
      .toThrow(`Validation failed for object with following missing properties: ${quoteDetailRequiredFields.join(', ')}`)
  })

  test('execute LBC registerPegin correctly', async () => {
    jest.spyOn(lbcMock, 'registerPegin').mockResolvedValue(successfulResultMock)
    await registerPegin(paramsMock, lbcMock)
    expect(lbcMock.registerPegin).toBeCalledTimes(1)
    const { quote, signature, btcRawTransaction, partialMerkleTree, height } = paramsMock
    expect(lbcMock.registerPegin).lastCalledWith({ quote, signature, btcRawTransaction, partialMerkleTree, height }, 'execution')
  })

  test('return txHash on successful execution', async () => {
    const txHash = await registerPegin(paramsMock, lbcMock)
    expect(txHash).toEqual(successfulResultMock.txHash)
  })

  test('throw FlyoverError on non successful execution (tx returned ok but with status 0)', async () => {
    jest.spyOn(lbcMock, 'registerPegin').mockResolvedValue({ successful: false, txHash: '0x8fbfb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' })
    expect.assertions(2)
    await registerPegin(paramsMock, lbcMock).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe("register pegin transaction didn't complete successfully")
    })
  })
})
