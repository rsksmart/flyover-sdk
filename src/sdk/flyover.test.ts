import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { Flyover } from './flyover'
import { getQuote } from './getQuote'
import { getProviders } from './getProviders'
import { acceptQuote } from './acceptQuote'
import { getPegoutQuote } from './getPegoutQuote'
import { acceptPegoutQuote } from './acceptPegoutQuote'
import { depositPegout } from './depositPegout'
import { type Quote, type PeginQuoteRequest, type LiquidityProvider, type PegoutQuote, type PegoutQuoteRequest } from '../api'
import { LiquidityBridgeContract } from '../blockchain/lbc'
import { refundPegout } from './refundPegout'
import { registerPegin, type RegisterPeginParams } from './registerPegin'
import { type BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { FlyoverError } from '../client/httpClient'
import { supportsConversion } from './supportsConversion'
import { getMetadata } from './getMetadata'
import { getPeginStatus } from './getPeginStatus'
import { getPegoutStatus } from './getPegoutStatus'
import { getAvailableLiquidity } from './getAvailableLiquidity'
import { validatePeginTransaction, type ValidatePeginTransactionOptions, type ValidatePeginTransactionParams } from './validatePeginTransaction'
import { RskBridge } from '../blockchain/bridge'

jest.mock('ethers')

jest.mock('./getProviders')
jest.mock('./getQuote')
jest.mock('./acceptQuote')
jest.mock('./getPegoutQuote')
jest.mock('./acceptPegoutQuote')
jest.mock('./depositPegout')
jest.mock('./refundPegout')
jest.mock('./registerPegin')
jest.mock('./supportsConversion')
jest.mock('./getMetadata')
jest.mock('./getPeginStatus')
jest.mock('./getPegoutStatus')
jest.mock('./getAvailableLiquidity')
jest.mock('./validatePeginTransaction')

const mockedGetQuote = getQuote as jest.Mock<typeof getQuote>
const mockedGetPegoutQuote = getPegoutQuote as jest.Mock<typeof getPegoutQuote>

const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  getAbstraction: () => {
    return jest.mocked({})
  }
} as BlockchainConnection)

const signatureMock = 'fa751697c71da60568814c1c18161a4be6af252177e6483b66ee554d6ff141a72879c152ac436ae07816dd69984d9440f9651e47ac24e7216825093f13f9147b1c'

const quoteMock: Quote = {
  quoteHash: 'any hash',
  quote: {
    fedBTCAddr: 'any address',
    lbcAddr: 'any address',
    lpRSKAddr: 'any address',
    btcRefundAddr: 'any address',
    rskRefundAddr: 'any address',
    lpBTCAddr: 'any address',
    contractAddr: 'any address',
    callFee: BigInt(1),
    penaltyFee: BigInt(1),
    data: 'any data',
    gasLimit: 1,
    nonce: BigInt(1),
    value: BigInt('9007199254740993'),
    timeForDeposit: 1,
    lpCallTime: 1,
    agreementTimestamp: 1,
    confirmations: 1,
    callOnRegister: true,
    gasFee: BigInt('1'),
    productFeeAmount: BigInt(50000000000000)
  }
}

const pegoutQuoteMock: PegoutQuote = {
  quote: {
    agreementTimestamp: 1,
    btcRefundAddress: 'any address',
    callFee: BigInt(1),
    depositAddr: 'any address',
    depositConfirmations: 1,
    depositDateLimit: 1,
    expireBlocks: 1,
    expireDate: 1,
    gasFee: BigInt('1'),
    lbcAddress: 'any address',
    liquidityProviderRskAddress: 'any address',
    lpBtcAddr: 'any address',
    nonce: BigInt(1),
    penaltyFee: BigInt(1),
    rskRefundAddress: 'any address',
    transferConfirmations: 1,
    transferTime: 1,
    value: BigInt('9007199254740993'),
    productFeeAmount: BigInt(50000000000000)
  },
  quoteHash: 'any hash'
}

const providerMock: LiquidityProvider = {
  apiBaseUrl: 'http://localhost',
  id: 1,
  provider: 'any address',
  name: 'any name',
  status: true,
  providerType: 'pegin',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  }
}

const quoteRequestMock: PeginQuoteRequest = {
  callEoaOrContractAddress: 'any address',
  callContractArguments: 'any address',
  valueToTransfer: BigInt('9007199254740993'),
  rskRefundAddress: 'any address'
}

const pegoutQuoteRequestMock: PegoutQuoteRequest = {
  to: 'any address',
  valueToTransfer: BigInt('9007199254740993'),
  rskRefundAddress: 'any address'
}

const registerPeginParamsMock: RegisterPeginParams = {
  quote: quoteMock,
  signature: 'any signature',
  partialMerkleTree: 'any pmt',
  btcRawTransaction: 'any tx',
  height: 1
}

mockedGetQuote.mockImplementation(async () => Promise.resolve([quoteMock]))
mockedGetPegoutQuote.mockImplementation(async () => Promise.resolve([pegoutQuoteMock]))

describe('Flyover object should', () => {
  let flyover: Flyover

  beforeEach(() => {
    flyover = new Flyover({
      network: 'Regtest',
      allowInsecureConnections: true,
      captchaTokenResolver: async () => Promise.resolve('')
    })
  })

  test('fail to get quotes if liquidity provider has not been selected', async () => {
    await flyover.connectToRsk(connectionMock)
    await expect(flyover.getQuotes({
      callEoaOrContractAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
      callContractArguments: '',
      valueToTransfer: BigInt(500000000000000000),
      rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1'
    })).rejects.toThrow('You need to select a provider to do this operation')
  })

  test('fail to get pegout quotes if liquidity provider has not been selected', async () => {
    await flyover.connectToRsk(connectionMock)
    await expect(flyover.getPegoutQuotes({
      to: 'mxqk28jvEtvjxRN8k7W9hFEJfWz5VcUgHW',
      valueToTransfer: BigInt(500000000000000000),
      rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1'
    })).rejects.toThrow('You need to select a provider to do this operation')
  })

  test('fail to accept quote if liquidity provider has not been selected', async () => {
    await expect(flyover.acceptQuote(quoteMock)).rejects.toThrow('You need to select a provider to do this operation')
  })

  test('fail to accept pegout quote if liquidity provider has not been selected', async () => {
    await expect(flyover.acceptPegoutQuote(pegoutQuoteMock)).rejects.toThrow('You need to select a provider to do this operation')
  })

  test('be able to set selected provider', () => {
    flyover.useLiquidityProvider(providerMock)
    expect(flyover).not.toHaveProperty('liquidityProvider', undefined)
  })

  test('invoke correctly getProviders', async () => {
    await flyover.connectToRsk(connectionMock)
    await flyover.getLiquidityProviders()
    expect(getProviders).toBeCalledTimes(1)
  })

  test('throw error if getLiquidityProviders is executed without a RSK connection', async () => {
    await expect(flyover.getLiquidityProviders()).rejects.toThrow('Not connected to RSK')
  })

  test('invoke correctly getQuotes', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getQuotes(quoteRequestMock)
    expect(getQuote).toBeCalledTimes(1)
  })

  test('invoke correctly getPegoutQuotes', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getPegoutQuotes(pegoutQuoteRequestMock)
    expect(getPegoutQuote).toBeCalledTimes(1)
  })

  test('invoke correctly acceptQuote', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.acceptQuote(quoteMock)
    expect(acceptQuote).toBeCalledTimes(1)
  })

  test('invoke correctly acceptPegoutQuote', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.acceptPegoutQuote(pegoutQuoteMock)
    expect(acceptPegoutQuote).toBeCalledTimes(1)
  })

  test('change network correctly', () => {
    const previousNetwork: string = (flyover as any).config.network
    flyover.setNetwork('Testnet')
    let actualNetwork: string = (flyover as any).config.network

    expect(previousNetwork).not.toEqual(actualNetwork)
    expect(actualNetwork).toBe('Testnet')

    flyover.setNetwork('Regtest')
    actualNetwork = (flyover as any).config.network
    expect(actualNetwork).not.toBe('Testnet')
    expect(actualNetwork).toBe('Regtest')
  })

  test('not allow insecure connections by default', () => {
    const mainnet = new Flyover({ network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') })
    const testnet = new Flyover({ network: 'Testnet', captchaTokenResolver: async () => Promise.resolve('') })
    const regtest = new Flyover({ network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') })
    expect((mainnet as any).config.allowInsecureConnections).not.toBe(true)
    expect((testnet as any).config.allowInsecureConnections).not.toBe(true)
    expect((regtest as any).config.allowInsecureConnections).not.toBe(true)
  })

  test('ask for addresses checksum by default', () => {
    const mainnet = new Flyover({ network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') })
    const testnet = new Flyover({ network: 'Testnet', captchaTokenResolver: async () => Promise.resolve('') })
    const regtest = new Flyover({ network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') })
    expect((mainnet as any).config.disableChecksum).not.toBe(true)
    expect((testnet as any).config.disableChecksum).not.toBe(true)
    expect((regtest as any).config.disableChecksum).not.toBe(true)
  })

  test('fail to get quotes when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
    (flyover as any).config.allowInsecureConnections = false
    const provider = { ...providerMock }
    provider.apiBaseUrl = 'http://localhost:1234'
    flyover.useLiquidityProvider(provider)
    await flyover.connectToRsk(connectionMock)
    await expect(flyover.getQuotes(quoteRequestMock)).rejects
      .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })

  test('fail to get pegout quotes when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
    (flyover as any).config.allowInsecureConnections = false
    const provider = { ...providerMock }
    provider.apiBaseUrl = 'http://localhost:1234'
    flyover.useLiquidityProvider(provider)
    await flyover.connectToRsk(connectionMock)
    await expect(flyover.getPegoutQuotes(pegoutQuoteRequestMock)).rejects
      .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })

  test('fail to accept quote when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
    (flyover as any).config.allowInsecureConnections = false
    const provider = { ...providerMock }
    provider.apiBaseUrl = 'http://localhost:1234'
    flyover.useLiquidityProvider(provider)
    await expect(flyover.acceptQuote(quoteMock)).rejects.toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })

  test('fail to accept pegout quote when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
    (flyover as any).config.allowInsecureConnections = false
    const provider = { ...providerMock }
    provider.apiBaseUrl = 'http://localhost:1234'
    flyover.useLiquidityProvider(provider)
    await expect(flyover.acceptPegoutQuote(pegoutQuoteMock)).rejects.toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })
  test('generate QR code from Bitcoin address', async () => {
    const qrCode = await flyover.generateQrCode(
      'mq4kBDAL4yDJBdd1qJk5jEffkJxvNdLxeF',
      '1.4455',
      'rsk'
    )
    expect(qrCode).toBe(
      'data:image/png;base64,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'
    )
  })

  test('generate QR code from RSK address', async () => {
    const qrCode = await flyover.generateQrCode(
      '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
      '10000',
      'bitcoin'
    )
    expect(qrCode).toBe(
      'data:image/png;base64,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'
    )
  })

  test('throw error when generating code from invalid address', async () => {
    await expect(
      flyover.generateQrCode('ricardomilos<3', '1000000000', 'rsk')
    ).rejects.toThrow('Only Bitcoin and RSK addresses are supported')
  })

  test('validate correclty if its connected to network', async () => {
    const connected = new Flyover({
      network: 'Regtest',
      rskConnection: connectionMock,
      captchaTokenResolver: async () => Promise.resolve('')
    })
    const notConnected = new Flyover({
      network: 'Regtest',
      captchaTokenResolver: async () => Promise.resolve('')
    })

    const connectedResult = await connected.isConnected()
    const notConnectedResult = await notConnected.isConnected()

    expect(connectedResult).toBe(true)
    expect(notConnectedResult).toBe(false)
  })

  test('throw error when trying to connect with an existing connection', async () => {
    const otherConenction = jest.mocked({} as BlockchainConnection)

    const connected = new Flyover({
      network: 'Regtest',
      rskConnection: connectionMock,
      captchaTokenResolver: async () => Promise.resolve('')
    })

    await expect(connected.connectToRsk(otherConenction)).rejects.toThrow('already connected to Rsk network')
  })

  test('connect successfully to RSK', async () => {
    expect(flyover).toEqual(expect.objectContaining(
      {
        config: expect.not.objectContaining({ rskConnection: expect.anything() })
      }
    ))
    await flyover.connectToRsk(connectionMock)
    expect(flyover).toEqual(expect.objectContaining(
      {
        config: expect.objectContaining({ rskConnection: expect.anything() })
      }
    ))
  })

  test('throw error if depositPegout is executed without a RSK connection', async () => {
    await expect(flyover.depositPegout(pegoutQuoteMock, '0x1234', BigInt(800))).rejects.toThrow('Not connected to RSK')
  })

  test('execute deposit pegout successfully', async () => {
    await flyover.connectToRsk(connectionMock)
    const amount = BigInt(500)
    await flyover.depositPegout(pegoutQuoteMock, signatureMock, amount)

    expect(depositPegout).toBeCalledTimes(1)
    expect(depositPegout).toBeCalledWith(pegoutQuoteMock, signatureMock, amount, expect.any(LiquidityBridgeContract))
  })

  test('create LBC instance during depositPegout if not created before', async () => {
    await flyover.connectToRsk(connectionMock)
    const amount = BigInt(500)

    expect(flyover).not.toHaveProperty('liquidityBridgeContract')

    await flyover.depositPegout(pegoutQuoteMock, signatureMock, amount)

    expect(flyover).not.toHaveProperty('liquidityBridgeContract', undefined)
  })

  test('throw error if refundPegout is executed without a RSK connection', async () => {
    await expect(flyover.refundPegout(pegoutQuoteMock)).rejects.toThrow('Not connected to RSK')
  })

  test('execute refund pegout successfully', async () => {
    await flyover.connectToRsk(connectionMock)
    await flyover.refundPegout(pegoutQuoteMock)

    expect(refundPegout).toBeCalledTimes(1)
    expect(refundPegout).toBeCalledWith(pegoutQuoteMock, expect.any(LiquidityBridgeContract))
  })

  test('create LBC instance during refundPegout if not created before', async () => {
    await flyover.connectToRsk(connectionMock)

    expect(flyover).not.toHaveProperty('liquidityBridgeContract')

    await flyover.refundPegout(pegoutQuoteMock)

    expect(flyover).not.toHaveProperty('liquidityBridgeContract', undefined)
  })

  test('throw error if registerPegin is executed without a RSK connection', async () => {
    await expect(flyover.registerPegin(registerPeginParamsMock)).rejects.toThrow('Not connected to RSK')
  })

  test('execute register pegin successfully', async () => {
    await flyover.connectToRsk(connectionMock)
    await flyover.registerPegin(registerPeginParamsMock)

    expect(registerPegin).toBeCalledTimes(1)
    expect(registerPegin).toBeCalledWith(registerPeginParamsMock, expect.any(LiquidityBridgeContract))
  })

  test('create LBC instance during registerPegin if not created before', async () => {
    await flyover.connectToRsk(connectionMock)
    expect(flyover).not.toHaveProperty('liquidityBridgeContract')

    await flyover.registerPegin(registerPeginParamsMock)
    expect(flyover).not.toHaveProperty('liquidityBridgeContract', undefined)
  })

  test('throw error if getQuotes is executed without a RSK connection', async () => {
    flyover.useLiquidityProvider(providerMock)
    await expect(flyover.getQuotes(quoteRequestMock)).rejects.toThrow('Not connected to RSK')
  })

  test('throw error if acceptQuote is executed without a RSK connection', async () => {
    flyover.useLiquidityProvider(providerMock)
    await expect(flyover.acceptQuote(quoteMock)).rejects.toThrow('Not connected to RSK')
  })

  test('throw error if unsupported network is used', async () => {
    expect.assertions(2)
    try {
      flyover.setNetwork('MyNetwork' as any)
    } catch (e: any) {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.details).toBe('unsupported network')
    }
  })

  test('invoke correctly supportsConversion', () => {
    flyover.supportsConversion('rBTC', 'BTC')
    expect(supportsConversion).toBeCalledTimes(1)
  })

  test('invoke correctly getMetadata', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getMetadata()
    expect(getMetadata).toBeCalledTimes(1)
  })

  test('invoke delete last quotes when provider changes', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getQuotes(quoteRequestMock)
    await flyover.getPegoutQuotes(pegoutQuoteRequestMock)
    expect((flyover as any).lastPeginQuote).not.toBeNull()
    expect((flyover as any).lastPegoutQuote).not.toBeNull()
    const otherProvider = { ...providerMock }
    flyover.useLiquidityProvider(otherProvider)
    expect((flyover as any).lastPeginQuote).toBeNull()
    expect((flyover as any).lastPegoutQuote).toBeNull()
  })

  test('save last pegin quote', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getQuotes(quoteRequestMock)
    expect((flyover as any).lastPeginQuote).not.toBeNull()
  })

  test('save last pegout quote', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getPegoutQuotes(pegoutQuoteRequestMock)
    expect((flyover as any).lastPegoutQuote).not.toBeNull()
  })

  test('fail to get metadata if liquidity provider has not been selected', async () => {
    expect.assertions(2)
    try {
      await flyover.connectToRsk(connectionMock)
      await flyover.getMetadata()
    } catch (e: any) {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.details).toBe('You need to select a provider to fetch the metadata')
    }
  })

  test('fail to get metadata if is not connected to the network', async () => {
    expect.assertions(2)
    try {
      flyover.useLiquidityProvider(providerMock)
      await flyover.getMetadata()
    } catch (e: any) {
      expect(e).toBeInstanceOf(Error)
      expect(e.message).toBe('Not connected to RSK')
    }
  })

  test('invoke correctly getPeginStatus', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getPeginStatus('1234')
    expect(getPeginStatus).toBeCalledTimes(1)
  })
  test('fail to get pegin status if liquidity provider has not been selected', async () => {
    await expect(flyover.getPegoutStatus('1234')).rejects.toThrow('You need to select a provider to do this operation')
  })
  test('fail to get pegin status when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
    (flyover as any).config.allowInsecureConnections = false
    const provider = { ...providerMock }
    provider.apiBaseUrl = 'http://localhost:1234'
    flyover.useLiquidityProvider(provider)
    await flyover.connectToRsk(connectionMock)
    await expect(flyover.getPeginStatus('1234')).rejects
      .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })

  test('invoke correctly getPegoutStatus', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(connectionMock)
    await flyover.getPegoutStatus('5678')
    expect(getPegoutStatus).toBeCalledTimes(1)
  })
  test('fail to get pegout status if liquidity provider has not been selected', async () => {
    await expect(flyover.getPegoutStatus('5678')).rejects.toThrow('You need to select a provider to do this operation')
  })
  test('fail to get pegout status when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
    (flyover as any).config.allowInsecureConnections = false
    const provider = { ...providerMock }
    provider.apiBaseUrl = 'http://localhost:1234'
    flyover.useLiquidityProvider(provider)
    await flyover.connectToRsk(connectionMock)
    await expect(flyover.getPegoutStatus('5678')).rejects
      .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })

  describe('getAvailableLiquidity', () => {
    test('invoke correctly', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.getAvailableLiquidity()
      expect(getAvailableLiquidity).toBeCalledTimes(1)
    })
    test('fail to get available liquidity if LP has not been selected', async () => {
      await expect(flyover.getAvailableLiquidity()).rejects.toThrow('You need to select a provider to do this operation')
    })
    test('fail to get available liquidity when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
      (flyover as any).config.allowInsecureConnections = false
      const provider = { ...providerMock }
      provider.apiBaseUrl = 'http://localhost:1234'
      flyover.useLiquidityProvider(provider)
      await expect(flyover.getAvailableLiquidity()).rejects
        .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
    })
  })
  describe('validatePeginTransaction method should', () => {
    const params: ValidatePeginTransactionParams = {
      quoteInfo: quoteMock,
      acceptInfo: {
        signature: signatureMock,
        bitcoinDepositAddressHash: '2MvkytopbHAGgTwrpQjpGVM5WZYvujPqf9u'
      },
      btcTx: '010203'
    }
    const options: ValidatePeginTransactionOptions = { throwError: true }
    test('invoke correctly validatePeginTransaction', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(connectionMock)
      await flyover.validatePeginTransaction(params, options)
      expect(validatePeginTransaction).toBeCalledTimes(1)
      expect(validatePeginTransaction).toBeCalledWith(
        {
          config: expect.objectContaining({
            network: 'Regtest',
            allowInsecureConnections: true
          }),
          bridge: expect.any(RskBridge),
          lbc: expect.any(LiquidityBridgeContract),
          provider: providerMock
        },
        params,
        options
      )
    })
    test('fail if LP has not been selected', async () => {
      await flyover.connectToRsk(connectionMock)
      await expect(flyover.validatePeginTransaction(params)).rejects.toThrow('You need to select a provider to do this operation')
    })
    test('create LBC instance if not created before', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(connectionMock)
      expect(flyover).not.toHaveProperty('liquidityBridgeContract')
      await flyover.validatePeginTransaction(params)
      expect(flyover).not.toHaveProperty('liquidityBridgeContract', undefined)
    })
    test('create RskBridge instance if not created before', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(connectionMock)
      expect(flyover).not.toHaveProperty('rskBridge')
      await flyover.validatePeginTransaction(params)
      expect(flyover).not.toHaveProperty('rskBridge', undefined)
    })
  })
})
