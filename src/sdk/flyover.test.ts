import { describe, test, expect, beforeEach, jest } from '@jest/globals'
import { Flyover } from './flyover'
import { getQuote } from './getQuote'
import { getProviders } from './getProviders'
import { acceptQuote } from './acceptQuote'
import { acceptAuthenticatedQuote } from './acceptAuthenticatedQuote'
import { acceptAuthenticatedPegoutQuote } from './acceptAuthenticatedPegoutQuote'
import { getPegoutQuote } from './getPegoutQuote'
import { acceptPegoutQuote } from './acceptPegoutQuote'
import { depositPegout } from './depositPegout'
import { type Quote, type PeginQuoteRequest, type LiquidityProvider, type PegoutQuote, type PegoutQuoteRequest, type AcceptedQuote, type AcceptedPegoutQuote } from '../api'
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
import { isPeginQuotePaid } from './isPeginQuotePaid'
import { isPegoutQuotePaid } from './isPegoutQuotePaid'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'
import { isPegoutRefundable } from './isPegoutRefundable'
import { isPeginRefundable, type IsPeginRefundableParams } from './isPeginRefundable'
import { signQuote } from './signQuote'
import { estimateRecommendedPegin } from './recommendedPegin'
import { estimateRecommendedPegout, RecommendedPegoutExtraArgs } from './recommendedPegout'
import { getPeginPaymentData } from './getPeginPaymentData'
import { getPegoutPaymentData } from './getPegoutPaymentData'
import { PegOutContract } from '../blockchain/pegout'
import { PegInContract } from '../blockchain/pegin'
import { DiscoveryContract } from '../blockchain/discovery'

jest.mock('ethers')

jest.mock('./getProviders')
jest.mock('./getQuote')
jest.mock('./acceptQuote')
jest.mock('./acceptAuthenticatedQuote')
jest.mock('./acceptAuthenticatedPegoutQuote')
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
jest.mock('./isPeginQuotePaid')
jest.mock('./isPegoutQuotePaid')
jest.mock('./isPegoutRefundable')
jest.mock('./isPeginRefundable')
jest.mock('./recommendedPegin')
jest.mock('./recommendedPegout')
jest.mock('./signQuote')
jest.mock('./getPeginPaymentData')
jest.mock('./getPegoutPaymentData')

const mockedGetQuote = getQuote as jest.Mock<typeof getQuote>
const mockedGetPegoutQuote = getPegoutQuote as jest.Mock<typeof getPegoutQuote>

const rskConnectionMock = jest.mocked({
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
    chainId: 31,
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
    chainId: 31,
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

mockedGetQuote.mockImplementation(async () => Promise.resolve([quoteMock]))
mockedGetPegoutQuote.mockImplementation(async () => Promise.resolve([pegoutQuoteMock]))

describe('Flyover object should', () => {
  let flyover: Flyover
  const FAKE_NETWORK = 'Regtest'

  beforeEach(() => {
    flyover = new Flyover({
      network: FAKE_NETWORK,
      allowInsecureConnections: true,
      captchaTokenResolver: async () => Promise.resolve('')
    })
  })

  test('fail to get quotes if liquidity provider has not been selected', async () => {
    await flyover.connectToRsk(rskConnectionMock)
    await expect(flyover.getQuotes({
      callEoaOrContractAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
      callContractArguments: '',
      valueToTransfer: BigInt(500000000000000000),
      rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1'
    })).rejects.toThrow('You need to select a provider to do this operation')
  })

  test('fail to get pegout quotes if liquidity provider has not been selected', async () => {
    await flyover.connectToRsk(rskConnectionMock)
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
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.getLiquidityProviders()
    expect(getProviders).toBeCalledTimes(1)
  })

  test('throw error if getLiquidityProviders is executed without a RSK connection', async () => {
    await expect(flyover.getLiquidityProviders()).rejects.toThrow('Not connected to RSK')
  })

  test('invoke correctly getQuotes', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.getQuotes(quoteRequestMock)
    expect(getQuote).toBeCalledTimes(1)
  })

  test('invoke correctly getPegoutQuotes', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.getPegoutQuotes(pegoutQuoteRequestMock)
    expect(getPegoutQuote).toBeCalledTimes(1)
  })

  test('invoke correctly acceptQuote', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.acceptQuote(quoteMock)
    expect(acceptQuote).toBeCalledTimes(1)
  })

  describe('acceptAuthenticatedQuote method should', () => {
    test('invoke correctly acceptAuthenticatedQuote', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.acceptAuthenticatedQuote(quoteMock, signatureMock)
      expect(acceptAuthenticatedQuote).toBeCalledTimes(1)
      expect(acceptAuthenticatedQuote).toBeCalledWith(
        (flyover as any).httpClient,
        (flyover as any).liquidityBridgeContract,
        providerMock,
        quoteMock,
        signatureMock
      )
    })

    test('fail to accept authenticated quote if liquidity provider has not been selected', async () => {
      await expect(flyover.acceptAuthenticatedQuote(quoteMock, signatureMock)).rejects.toThrow('You need to select a provider to do this operation')
    })

    test('fail to accept authenticated quote when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
      (flyover as any).config.allowInsecureConnections = false
      const provider = { ...providerMock }
      provider.apiBaseUrl = 'http://localhost:1234'
      flyover.useLiquidityProvider(provider)
      await expect(flyover.acceptAuthenticatedQuote(quoteMock, signatureMock)).rejects.toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
    })
  })

  test('invoke correctly acceptPegoutQuote', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.acceptPegoutQuote(pegoutQuoteMock)
    expect(acceptPegoutQuote).toBeCalledTimes(1)
  })

  describe('acceptAuthenticatedPegoutQuote method should', () => {
    test('invoke correctly acceptAuthenticatedPegoutQuote', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.acceptAuthenticatedPegoutQuote(pegoutQuoteMock, signatureMock)
      expect(acceptAuthenticatedPegoutQuote).toBeCalledTimes(1)
      expect(acceptAuthenticatedPegoutQuote).toBeCalledWith(
        (flyover as any).httpClient,
        (flyover as any).liquidityBridgeContract,
        providerMock,
        pegoutQuoteMock,
        signatureMock
      )
    })

    test('fail to accept authenticated pegout quote if liquidity provider has not been selected', async () => {
      await expect(flyover.acceptAuthenticatedPegoutQuote(pegoutQuoteMock, signatureMock)).rejects.toThrow('You need to select a provider to do this operation')
    })

    test('fail to accept authenticated pegout quote when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
      (flyover as any).config.allowInsecureConnections = false
      const provider = { ...providerMock }
      provider.apiBaseUrl = 'http://localhost:1234'
      flyover.useLiquidityProvider(provider)
      await expect(flyover.acceptAuthenticatedPegoutQuote(pegoutQuoteMock, signatureMock)).rejects.toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
    })
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
    await flyover.connectToRsk(rskConnectionMock)
    await expect(flyover.getQuotes(quoteRequestMock)).rejects
      .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })

  test('fail to get pegout quotes when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
    (flyover as any).config.allowInsecureConnections = false
    const provider = { ...providerMock }
    provider.apiBaseUrl = 'http://localhost:1234'
    flyover.useLiquidityProvider(provider)
    await flyover.connectToRsk(rskConnectionMock)
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
  test('validate correclty if its connected to network', async () => {
    const connected = new Flyover({
      network: 'Regtest',
      rskConnection: rskConnectionMock,
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
      rskConnection: rskConnectionMock,
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
    await flyover.connectToRsk(rskConnectionMock)
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
    await flyover.connectToRsk(rskConnectionMock)
    const amount = BigInt(500)
    await flyover.depositPegout(pegoutQuoteMock, signatureMock, amount)

    expect(depositPegout).toBeCalledTimes(1)
    expect(depositPegout).toBeCalledWith(
      pegoutQuoteMock,
      signatureMock,
      amount,
      expect.objectContaining({
        pegOutContract: expect.any(PegOutContract),
        pegInContract: expect.any(PegInContract),
        discoveryContract: expect.any(DiscoveryContract)
      }),
    )
  })

  test('create LBC instance during depositPegout if not created before', async () => {
    await flyover.connectToRsk(rskConnectionMock)
    const amount = BigInt(500)

    expect(flyover).not.toHaveProperty('liquidityBridgeContract')

    await flyover.depositPegout(pegoutQuoteMock, signatureMock, amount)

    expect(flyover).not.toHaveProperty('liquidityBridgeContract', undefined)
  })

  test('throw error if refundPegout is executed without a RSK connection', async () => {
    await expect(flyover.refundPegout(pegoutQuoteMock)).rejects.toThrow('Not connected to RSK')
  })

  test('execute refund pegout successfully', async () => {
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.refundPegout(pegoutQuoteMock)

    expect(refundPegout).toBeCalledTimes(1)
    expect(refundPegout).toBeCalledWith(pegoutQuoteMock, (flyover as any).getFlyoverContext())
  })

  test('create LBC instance during refundPegout if not created before', async () => {
    await flyover.connectToRsk(rskConnectionMock)

    expect(flyover).not.toHaveProperty('liquidityBridgeContract')

    await flyover.refundPegout(pegoutQuoteMock)

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
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.getMetadata()
    expect(getMetadata).toBeCalledTimes(1)
  })

  test('invoke delete last quotes when provider changes', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
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
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.getQuotes(quoteRequestMock)
    expect((flyover as any).lastPeginQuote).not.toBeNull()
  })

  test('save last pegout quote', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
    await flyover.getPegoutQuotes(pegoutQuoteRequestMock)
    expect((flyover as any).lastPegoutQuote).not.toBeNull()
  })

  test('fail to get metadata if liquidity provider has not been selected', async () => {
    expect.assertions(2)
    try {
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.getMetadata()
    } catch (e: any) {
      expect(e).toBeInstanceOf(FlyoverError)
      expect(e.details).toBe('You need to select a provider to fetch the metadata')
    }
  })

  test('invoke correctly getPeginStatus', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
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
    await flyover.connectToRsk(rskConnectionMock)
    await expect(flyover.getPeginStatus('1234')).rejects
      .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
  })

  test('invoke correctly getPegoutStatus', async () => {
    flyover.useLiquidityProvider(providerMock)
    await flyover.connectToRsk(rskConnectionMock)
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
    await flyover.connectToRsk(rskConnectionMock)
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
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.validatePeginTransaction(params, options)
      expect(validatePeginTransaction).toBeCalledTimes(1)
      expect(validatePeginTransaction).toBeCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            network: 'Regtest',
            allowInsecureConnections: true
          }),
          bridge: expect.any(RskBridge),
          lbc: expect.objectContaining({
            pegOutContract: expect.any(PegOutContract),
            pegInContract: expect.any(PegInContract),
            discoveryContract: expect.any(DiscoveryContract)
          }),
          provider: providerMock
        }),
        params,
        options
      )
    })
    test('fail if LP has not been selected', async () => {
      await flyover.connectToRsk(rskConnectionMock)
      await expect(flyover.validatePeginTransaction(params)).rejects.toThrow('You need to select a provider to do this operation')
    })
    test('create LBC instance if not created before', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      expect(flyover).not.toHaveProperty('liquidityBridgeContract')
      await flyover.validatePeginTransaction(params)
      expect(flyover).not.toHaveProperty('liquidityBridgeContract', undefined)
    })
    test('create RskBridge instance if not created before', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      expect(flyover).not.toHaveProperty('rskBridge')
      await flyover.validatePeginTransaction(params)
      expect(flyover).not.toHaveProperty('rskBridge', undefined)
    })
  })

  describe('isQuotePaid method', () => {
    const MOCK_QUOTE_HASH = 'testQuoteHash'

    test('fail if liquidity provider has not been selected', async () => {
      await flyover.connectToRsk(rskConnectionMock)
      await expect(flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegin'))
        .rejects.toThrow('You need to select a provider to do this operation')
    })

    describe('pegin quotes', () => {
      test('invoke correctly isQuotePaid external function', async () => {
        flyover.useLiquidityProvider(providerMock)
        await flyover.connectToRsk(rskConnectionMock)
        await flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegin')

        expect(isPeginQuotePaid).toBeCalledTimes(1)
        expect(isPeginQuotePaid).toBeCalledWith(
          MOCK_QUOTE_HASH,
          expect.objectContaining({
            httpClient: (flyover as any).httpClient,
            provider: providerMock,
            rskConnection: rskConnectionMock
          })
        )
      })

      test('fail when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
        (flyover as any).config.allowInsecureConnections = false
        const provider = { ...providerMock }
        provider.apiBaseUrl = 'http://localhost:1234'
        flyover.useLiquidityProvider(provider)

        await flyover.connectToRsk(rskConnectionMock)
        await expect(flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegin'))
          .rejects.toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
      })

      test('fail if not connected to RSK', async () => {
        const disconnectedFlyover = new Flyover({
          network: FAKE_NETWORK,
          allowInsecureConnections: true,
          captchaTokenResolver: async () => Promise.resolve('')
        })

        disconnectedFlyover.useLiquidityProvider(providerMock)

        // Connect to RSK with a connection that returns undefined for chain height
        const mockConnectionWithNoHeight = {
          ...rskConnectionMock,
          getChainHeight: jest.fn().mockImplementation(async () => Promise.resolve(undefined))
        } as unknown as BlockchainConnection

        await disconnectedFlyover.connectToRsk(mockConnectionWithNoHeight)

        await expect(disconnectedFlyover.isQuotePaid('testQuoteHash', 'pegin'))
          .rejects.toThrow('Before calling isQuotePaid for pegin quotes, you need to connect to RSK using Flyover.connectToRsk')
      })
    })

    describe('pegout quotes', () => {
      const bitcoinDataSourceMock: BitcoinDataSource = { getTransactionAsHex: jest.fn() } as unknown as BitcoinDataSource

      beforeEach(() => {
        (isPegoutQuotePaid as jest.Mock).mockImplementation(async () => Promise.resolve({ isPaid: true }))
      })

      test('invoke correctly isPegoutQuotePaid external function', async () => {
        flyover.useLiquidityProvider(providerMock)
        flyover.connectToBitcoin(bitcoinDataSourceMock)

        const result = await flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegout')

        expect(result).toEqual({ isPaid: true })
        expect(isPegoutQuotePaid).toBeCalledTimes(1)
        expect(isPegoutQuotePaid).toBeCalledWith(
          MOCK_QUOTE_HASH,
          expect.objectContaining({
            config: expect.anything(),
            provider: providerMock,
            httpClient: (flyover as any).httpClient,
            btcConnection: bitcoinDataSourceMock
          })
        )
      })

      test('fail when bitcoinDataSource is not connected', async () => {
        flyover.useLiquidityProvider(providerMock)

        await expect(flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegout'))
          .rejects
          .toThrow('Before calling isQuotePaid for pegout quotes, you need to connect to Bitcoin using Flyover.connectToBitcoin')
      })

      test('return isPaid true when quote is paid', async () => {
        flyover.useLiquidityProvider(providerMock)
        flyover.connectToBitcoin(bitcoinDataSourceMock)
        ; (isPegoutQuotePaid as jest.Mock).mockImplementation(async () => Promise.resolve({ isPaid: true }))

        const result = await flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegout')

        expect(result).toEqual({ isPaid: true })
      })

      test('return isPaid false when quote is not paid', async () => {
        flyover.useLiquidityProvider(providerMock)
        flyover.connectToBitcoin(bitcoinDataSourceMock)
        ; (isPegoutQuotePaid as jest.Mock).mockImplementation(async () => Promise.resolve({ isPaid: false }))

        const result = await flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegout')

        expect(result).toEqual({ isPaid: false })
      })

      test('handle errors from isPegoutQuotePaid function', async () => {
        flyover.useLiquidityProvider(providerMock)
        flyover.connectToBitcoin(bitcoinDataSourceMock)
        const errorMessage = 'Failed to check quote payment status'
          ; (isPegoutQuotePaid as jest.Mock).mockImplementation(async () => Promise.reject(new Error(errorMessage)))

        await expect(flyover.isQuotePaid(MOCK_QUOTE_HASH, 'pegout'))
          .rejects
          .toThrow(errorMessage)
      })

      test('fail when invalid type of operation is provided', async () => {
        flyover.useLiquidityProvider(providerMock)

        await expect(flyover.isQuotePaid(MOCK_QUOTE_HASH, 'notPeginNotPegoutOperation' as any))
          .rejects
          .toThrow('Invalid type of operation')
      })
    })
  })

  describe('isPegoutRefundable method should', () => {
    test('invoke correctly isPegoutRefundable external function', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.isPegoutRefundable(pegoutQuoteMock)
      expect(isPegoutRefundable).toBeCalledTimes(1)
      expect(isPegoutRefundable).toBeCalledWith(
        pegoutQuoteMock,
        expect.objectContaining({
          config: expect.anything(),
          lbc: expect.objectContaining({
            pegInContract: expect.any(PegInContract),
            pegOutContract: expect.any(PegOutContract),
            discoveryContract: expect.any(DiscoveryContract)
          }),
          provider: providerMock,
          httpClient: expect.anything(),
          rskConnection: rskConnectionMock
        })
      )
    })
    test('fail if liquidity provider has not been selected', async () => {
      await expect(flyover.isPegoutRefundable(pegoutQuoteMock))
        .rejects.toThrow('You need to select a provider to do this operation')
    })
    test('fail to get available liquidity when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
      (flyover as any).config.allowInsecureConnections = false
      const provider = { ...providerMock }
      provider.apiBaseUrl = 'http://localhost:1234'
      flyover.useLiquidityProvider(provider)
      await expect(flyover.isPegoutRefundable(pegoutQuoteMock)).rejects
        .toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
    })
    test('create LBC instance during isPegoutRefundable if not created before', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      expect(flyover).not.toHaveProperty('liquidityBridgeContract')

      await flyover.isPegoutRefundable(pegoutQuoteMock)
      expect(flyover).toHaveProperty('liquidityBridgeContract')
    })
  })

  describe('isPeginRefundable method should', () => {
    const FAKE_BTC_TX_HASH = '675fe4d3f75d879ec1e6c123c7dd643afee60342afa8797233bce8adedac42e4'
    const bitcoinDataSourceMock: BitcoinDataSource = {
      getTransactionAsHex: jest.fn(),
      getBlockFromTransaction: jest.fn()
    } as unknown as BitcoinDataSource

    let params: IsPeginRefundableParams

    beforeEach(() => {
      jest.clearAllMocks()
      ;(isPeginRefundable as jest.Mock).mockImplementation(async () => Promise.resolve({ isRefundable: true }))
      params = {
        quote: quoteMock,
        providerSignature: signatureMock,
        btcTransactionHash: FAKE_BTC_TX_HASH
      }
    })

    test('fail if liquidity provider has not been selected', async () => {
      await expect(flyover.isPeginRefundable(params))
        .rejects.toThrow('You need to select a provider to do this operation')
    })

    test('invoke correctly isPeginRefundable external function', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)

      const result = await flyover.isPeginRefundable(params)

      expect(result).toEqual({ isRefundable: true })
      expect(isPeginRefundable).toBeCalledTimes(1)
      expect(isPeginRefundable).toBeCalledWith({
        quote: quoteMock,
        providerSignature: signatureMock,
        btcTransactionHash: FAKE_BTC_TX_HASH
      },
      (flyover as any).getFlyoverContext())
    })

    test('fail when not connected to RSK', async () => {
      flyover.useLiquidityProvider(providerMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)

      jest.spyOn(flyover, 'isConnected').mockImplementation(async () => Promise.resolve(false))

      await expect(flyover.isPeginRefundable(params))
        .rejects.toThrow('Not connected to RSK')
    })

    test('fail when not connected to Bitcoin', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)

      await expect(flyover.isPeginRefundable(params))
        .rejects.toThrow('Before calling isPeginQuoteRefundable you need to connect to Bitcoin using Flyover.connectToBitcoin')
    })

    test('return isRefundable false when quote is not refundable', async () => {
      const FAKE_RESPONSE = { isRefundable: false, error: { code: 123, message: 'Not refundable' } }
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)

      ;(isPeginRefundable as jest.Mock).mockImplementation(async () => Promise.resolve(FAKE_RESPONSE))

      const result = await flyover.isPeginRefundable(params)

      expect(result).toEqual(FAKE_RESPONSE)
    })

    test('handle errors from isPeginQuoteRefundable function', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)

      const errorMessage = 'Failed to check if quote is refundable'
      ;(isPeginRefundable as jest.Mock).mockImplementation(async () =>
        Promise.reject(new Error(errorMessage)))

      await expect(flyover.isPeginRefundable(params))
        .rejects.toThrow(errorMessage)
    })
  })

  describe('registerPegin method should', () => {
    const FAKE_BTC_TX_HASH = '675fe4d3f75d879ec1e6c123c7dd643afee60342afa8797233bce8adedac42e4'
    const MOCK_TX_HASH = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
    const bitcoinDataSourceMock: BitcoinDataSource = {
      getTransactionAsHex: jest.fn(),
      getBlockFromTransaction: jest.fn()
    } as unknown as BitcoinDataSource

    const registerPeginParams: RegisterPeginParams = {
      quote: quoteMock,
      providerSignature: signatureMock,
      userBtcTransactionHash: FAKE_BTC_TX_HASH
    }

    test('successfully register a pegin and return transaction hash', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)
      ;(registerPegin as jest.Mock).mockImplementation(async () => Promise.resolve(MOCK_TX_HASH))

      const result = await flyover.registerPegin(registerPeginParams)

      expect(result).toBe(MOCK_TX_HASH)
      expect(registerPegin).toHaveBeenCalledTimes(1)
      expect(registerPegin).toHaveBeenCalledWith(
        expect.objectContaining({
          quote: quoteMock,
          providerSignature: signatureMock,
          userBtcTransactionHash: FAKE_BTC_TX_HASH
        }),
        expect.objectContaining({
          httpClient: (flyover as any).httpClient,
          provider: providerMock,
          rskConnection: rskConnectionMock,
          btcConnection: bitcoinDataSourceMock,
          lbc: (flyover as any).liquidityBridgeContract
        })
      )
    })

    test('fail if liquidity provider has not been selected', async () => {
      await expect(flyover.registerPegin(registerPeginParams))
        .rejects.toThrow('You need to select a provider to do this operation')
    })

    test('fail if not connected to RSK', async () => {
      flyover.useLiquidityProvider(providerMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)

      await expect(flyover.registerPegin(registerPeginParams))
        .rejects.toThrow('Not connected to RSK')
    })

    test('fail if not connected to Bitcoin', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)

      await expect(flyover.registerPegin(registerPeginParams))
        .rejects.toThrow('Before calling isPeginQuoteRefundable you need to connect to Bitcoin using Flyover.connectToBitcoin')
    })

    test('create LBC instance if not created before', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)
      ;(registerPegin as jest.Mock).mockImplementation(async () => Promise.resolve(MOCK_TX_HASH))

      expect(flyover).not.toHaveProperty('liquidityBridgeContract')

      await flyover.registerPegin(registerPeginParams)

      expect(flyover).toHaveProperty('liquidityBridgeContract')
    })

    test('handle errors from refundPegin function', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)

      const MOCK_ERROR_MESSAGE = 'Failed to refund pegin'
      ;(registerPegin as jest.Mock).mockImplementation(async () => Promise.reject(new Error(MOCK_ERROR_MESSAGE)))

      await expect(flyover.registerPegin(registerPeginParams))
        .rejects.toThrow(MOCK_ERROR_MESSAGE)
    })

    test('fail when allowInsecureConnections is false and Provider apiBaseUrl is insecure', async () => {
      (flyover as any).config.allowInsecureConnections = false
      const provider = { ...providerMock }
      provider.apiBaseUrl = 'http://localhost:1234'
      flyover.useLiquidityProvider(provider)
      await flyover.connectToRsk(rskConnectionMock)
      flyover.connectToBitcoin(bitcoinDataSourceMock)

      await expect(flyover.registerPegin(registerPeginParams))
        .rejects.toThrow('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
    })
  })

  describe('hashPeginQuote method should', () => {
    const MOCK_HASH = 'mocked-hash-value'

    const mockLiquidityBridgeContract: LiquidityBridgeContract = {
      pegInContract: {
        hashPeginQuote: jest.fn()
      }
    } as unknown as LiquidityBridgeContract

    beforeEach(() => {
      jest.clearAllMocks()

      jest.spyOn(mockLiquidityBridgeContract.pegInContract, 'hashPeginQuote').mockImplementation(async () => Promise.resolve(MOCK_HASH))
      ;(flyover as any).liquidityBridgeContract = mockLiquidityBridgeContract
    })

    test('call liquidityBridgeContract.hashPeginQuote with the correct quote', async () => {
      await flyover.connectToRsk(rskConnectionMock)

      const result = await flyover.hashPeginQuote(quoteMock)

      expect(mockLiquidityBridgeContract.pegInContract.hashPeginQuote).toHaveBeenCalledWith(quoteMock)
      expect(result).toBe(MOCK_HASH)
    })

    test('return the hash computed by the LBC contract', async () => {
      await flyover.connectToRsk(rskConnectionMock)
      jest.spyOn(PegInContract.prototype, 'hashPeginQuote').mockResolvedValue(MOCK_HASH)

      const result = await flyover.hashPeginQuote(quoteMock)

      expect(result).toBe(MOCK_HASH)
    })

    test('throw error if not connected to RSK', async () => {
      await expect(flyover.hashPeginQuote(quoteMock)).rejects.toThrow('Not connected to RSK')
    })

    test('create LBC instance if not created before', async () => {
      flyover = new Flyover({
        network: FAKE_NETWORK,
        allowInsecureConnections: true,
        captchaTokenResolver: async () => Promise.resolve('')
      })

      expect(flyover).not.toHaveProperty('liquidityBridgeContract')

      await flyover.connectToRsk(rskConnectionMock)

      // The result of this call is not important, we just want to check that the LBC instance is created
      try {
        await flyover.hashPeginQuote(quoteMock)
      } finally {
        expect(flyover).toHaveProperty('liquidityBridgeContract')
      }
    })
  })

  describe('hashPegoutQuote method should', () => {
    const MOCK_HASH = 'mocked-pegout-hash-value'

    const mockLiquidityBridgeContract: LiquidityBridgeContract = {
      pegOutContract: {
        hashPegoutQuote: jest.fn()
      }
    } as unknown as LiquidityBridgeContract

    beforeEach(() => {
      jest.clearAllMocks()

      jest.spyOn(mockLiquidityBridgeContract.pegOutContract, 'hashPegoutQuote').mockImplementation(async () => Promise.resolve(MOCK_HASH))
      ;(flyover as any).liquidityBridgeContract = mockLiquidityBridgeContract
    })

    test('call liquidityBridgeContract.hashPegoutQuote with the correct quote', async () => {
      await flyover.connectToRsk(rskConnectionMock)

      const result = await flyover.hashPegoutQuote(pegoutQuoteMock)

      expect(mockLiquidityBridgeContract.pegOutContract.hashPegoutQuote).toHaveBeenCalledWith(pegoutQuoteMock)
      expect(result).toBe(MOCK_HASH)
    })

    test('return the hash computed by the LBC contract', async () => {
      await flyover.connectToRsk(rskConnectionMock)
      jest.spyOn(PegOutContract.prototype, 'hashPegoutQuote').mockResolvedValue(MOCK_HASH)

      const result = await flyover.hashPegoutQuote(pegoutQuoteMock)

      expect(result).toBe(MOCK_HASH)
    })

    test('throw error if not connected to RSK', async () => {
      await expect(flyover.hashPegoutQuote(pegoutQuoteMock)).rejects.toThrow('Not connected to RSK')
    })

    test('create LBC instance if not created before', async () => {
      flyover = new Flyover({
        network: FAKE_NETWORK,
        allowInsecureConnections: true,
        captchaTokenResolver: async () => Promise.resolve('')
      })

      expect(flyover).not.toHaveProperty('liquidityBridgeContract')

      await flyover.connectToRsk(rskConnectionMock)

      // The result of this call is not important, we just want to check that the LBC instance is created
      try {
        await flyover.hashPegoutQuote(pegoutQuoteMock)
      } finally {
        expect(flyover).toHaveProperty('liquidityBridgeContract')
      }
    })
  })

  describe('signQuote method should', () => {
    test('invoke correctly signQuote', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.signQuote(quoteMock)
      expect(signQuote).toBeCalledTimes(1)
      expect(signQuote).toBeCalledWith(
        expect.objectContaining({
          network: 'Regtest',
          allowInsecureConnections: true
        }),
        expect.objectContaining({
          pegInContract: expect.any(PegInContract),
          pegOutContract: expect.any(PegOutContract),
          discoveryContract: expect.any(DiscoveryContract)
        }),
        providerMock,
        quoteMock,
      )
    })
    test('fail if LP has not been selected', async () => {
      await flyover.connectToRsk(rskConnectionMock)
      await expect(flyover.signQuote(quoteMock)).rejects.toThrow('You need to select a provider to do this operation')
    })
    test('create LBC instance if not created before', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      expect(flyover).not.toHaveProperty('liquidityBridgeContract')
      await flyover.signQuote(quoteMock)
      expect(flyover).not.toHaveProperty('liquidityBridgeContract', undefined)
    })
  })

  describe('estimateRecommendedPegin method should', () => {
    const amount = BigInt(100)
    const extraArgs = { data: '0x1122', destinationAddress: '0x03f23ae1917722d5a27a2ea0bcc98725a2a2a49a' }
    test('invoke correctly estimateRecommendedPegin', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.estimateRecommendedPegin(amount, extraArgs)
      expect(estimateRecommendedPegin).toBeCalledTimes(1)
      expect(estimateRecommendedPegin).toBeCalledWith(
        expect.objectContaining({
          httpClient: expect.anything(),
          provider: providerMock,
        }),
        amount,
        extraArgs
      )
    })
    test('fail if LP has not been selected', async () => {
      await expect(flyover.estimateRecommendedPegin(amount, extraArgs)).rejects.toThrow('You need to select a provider to do this operation')
    })
  })

  describe('estimateRecommendedPegout method should', () => {
    const amount = BigInt(100)
    const extraArgs: RecommendedPegoutExtraArgs = { destinationAddressType: 'p2tr' }
    test('invoke correctly estimateRecommendedPegout', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.estimateRecommendedPegout(amount, extraArgs)
      expect(estimateRecommendedPegout).toBeCalledTimes(1)
      expect(estimateRecommendedPegout).toBeCalledWith(
        expect.objectContaining({
          httpClient: expect.anything(),
          provider: providerMock,
        }),
        amount,
        extraArgs
      )
    })
    test('fail if LP has not been selected', async () => {
      await expect(flyover.estimateRecommendedPegout(amount, extraArgs)).rejects.toThrow('You need to select a provider to do this operation')
    })
  })

  describe('getPeginPaymentData method should', () => {
    const acceptedQuoteMock: AcceptedQuote = {
      signature: signatureMock,
      bitcoinDepositAddressHash: '2MvkytopbHAGgTwrpQjpGVM5WZYvujPqf9u'
    }
    const optionsMock = { amountUnit: 'SAT' as const }

    test('invoke correctly getPeginPaymentData', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.getPeginPaymentData(quoteMock, acceptedQuoteMock, optionsMock)
      expect(getPeginPaymentData).toBeCalledTimes(1)
      expect(getPeginPaymentData).toBeCalledWith(
        expect.objectContaining({
          pegInContract: expect.any(PegInContract),
          pegOutContract: expect.any(PegOutContract),
          discoveryContract: expect.any(DiscoveryContract)
        }),
        providerMock,
        quoteMock,
        acceptedQuoteMock,
        optionsMock
      )
    })

    test('forward options to getPeginPaymentData when omitted', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.getPeginPaymentData(quoteMock, acceptedQuoteMock)
      expect(getPeginPaymentData).toBeCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything(),
        expect.anything(),
        undefined
      )
    })

    test('fail if LP has not been selected', async () => {
      await expect(flyover.getPeginPaymentData(quoteMock, acceptedQuoteMock, optionsMock))
        .rejects.toThrow('You need to select a provider to do this operation')
    })

    test('throw error if not connected to RSK', async () => {
      flyover.useLiquidityProvider(providerMock)
      await expect(flyover.getPeginPaymentData(quoteMock, acceptedQuoteMock, optionsMock))
        .rejects.toThrow('Not connected to RSK')
    })
  })

  describe('getPegoutPaymentData method should', () => {
    const acceptedPegoutQuoteMock: AcceptedPegoutQuote = {
      signature: signatureMock,
      lbcAddress: 'any address'
    }

    test('invoke correctly getPegoutPaymentData', async () => {
      flyover.useLiquidityProvider(providerMock)
      await flyover.connectToRsk(rskConnectionMock)
      await flyover.getPegoutPaymentData(pegoutQuoteMock, acceptedPegoutQuoteMock)
      expect(getPegoutPaymentData).toBeCalledTimes(1)
      expect(getPegoutPaymentData).toBeCalledWith(
        expect.objectContaining({
          pegInContract: expect.any(PegInContract),
          pegOutContract: expect.any(PegOutContract),
          discoveryContract: expect.any(DiscoveryContract)
        }),
        providerMock,
        pegoutQuoteMock,
        acceptedPegoutQuoteMock
      )
    })

    test('fail if LP has not been selected', async () => {
      await expect(flyover.getPegoutPaymentData(pegoutQuoteMock, acceptedPegoutQuoteMock))
        .rejects.toThrow('You need to select a provider to do this operation')
    })

    test('throw error if not connected to RSK', async () => {
      flyover.useLiquidityProvider(providerMock)
      await expect(flyover.getPegoutPaymentData(pegoutQuoteMock, acceptedPegoutQuoteMock))
        .rejects.toThrow('Not connected to RSK')
    })
  })
})
