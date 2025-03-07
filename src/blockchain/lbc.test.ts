import { describe, test, jest, expect, beforeAll } from '@jest/globals'
import * as ethers from 'ethers'
import { type Quote as PeginQuote, type PegoutQuote } from '../api'
import { FlyoverNetworks } from '../constants/networks'
import { LiquidityBridgeContract } from './lbc'
import lbcAbi from './lbc-abi'
import { type QuotesV2 as Quotes } from './bindings/Lbc'
import JSONbig from 'json-bigint'
import { readFile } from 'fs/promises'
import { type RegisterPeginParams } from '../sdk/registerPegin'
import { BridgeError, type FlyoverConfig, type BlockchainConnection } from '@rsksmart/bridges-core-sdk'

const serializer = JSONbig({ useNativeBigInt: true })

jest.mock('ethers')

const signerMock = jest.mocked({})
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
const connectionMock = jest.mocked({
  getChainHeight: async () => Promise.resolve(1),
  get signer () {
    return signerMock
  }
} as BlockchainConnection)

const pegoutQuoteMock: PegoutQuote = {
  quote: {
    lbcAddress: '0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4',
    liquidityProviderRskAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    btcRefundAddress: 'mxqk28jvEtvjxRN8k7W9hFEJfWz5VcUgHW',
    rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
    lpBtcAddr: 'mnYcQxCZBbmLzNfE9BhV7E8E2u7amdz5y6',
    callFee: BigInt(1000),
    penaltyFee: BigInt(1000000),
    nonce: BigInt(5),
    depositAddr: 'miMRxGvjQCqWZtdyJCEZ6h8GsTXBtJjNo6',
    gasFee: BigInt(44000),
    value: BigInt('500000000000000'),
    agreementTimestamp: 1683115298,
    depositDateLimit: 3600,
    depositConfirmations: 10,
    transferConfirmations: 1,
    transferTime: 3600,
    expireDate: 1683118898,
    expireBlocks: 5023,
    productFeeAmount: BigInt(600000000000000000)
  },
  quoteHash: 'c73b616363ef74017a085c60acb96de88b57268708d06ed6a5d21fbf5f08b69b'
}

const parsedPegoutQuoteMock: Quotes.PegOutQuoteStruct = {
  lbcAddress: '0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4',
  lpRskAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  btcRefundAddress: new Uint8Array([
    111, 190, 7, 203, 157, 253,
    199, 223, 168, 132, 54, 250,
    65, 40, 65, 14, 33, 38,
    214, 151, 150
  ]),
  rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
  lpBtcAddress: new Uint8Array([
    111, 77, 25, 29, 213, 89,
    98, 105, 251, 153, 254, 72,
    87, 69, 181, 236, 217, 126,
    72, 185, 152
  ]),
  callFee: 1000,
  penaltyFee: 1000000,
  nonce: BigInt(5),
  deposityAddress: new Uint8Array([
    111, 31, 27, 78, 105, 91, 54,
    222, 82, 124, 30, 93, 183, 113,
    159, 75, 38, 86, 7, 222, 133
  ]),
  value: BigInt(500000000000000),
  agreementTimestamp: 1683115298,
  depositDateLimit: 3600,
  depositConfirmations: 10,
  transferConfirmations: 1,
  transferTime: 3600,
  expireDate: 1683118898,
  expireBlock: 5023,
  productFeeAmount: BigInt(600000000000000000),
  gasFee: BigInt(44000)
}

const peginQuoteMock: PeginQuote = {
  quote: {
    fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
    lbcAddr: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
    lpRSKAddr: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    btcRefundAddr: 'mg1A4mgNu5DDovXGtwMBkf9AcZFLBxvhzq',
    rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
    lpBTCAddr: 'mnYcQxCZBbmLzNfE9BhV7E8E2u7amdz5y6',
    callFee: BigInt(1000000000000000),
    penaltyFee: BigInt(1000000),
    contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
    data: '0x1a1b1c',
    gasLimit: 46000,
    nonce: BigInt('7591081102472764799'),
    value: BigInt(600000000000000000),
    agreementTimestamp: 1690985578,
    timeForDeposit: 3600,
    lpCallTime: 7200,
    confirmations: 10,
    callOnRegister: false,
    gasFee: BigInt(600000000000000),
    productFeeAmount: BigInt(600000000000000000)
  },
  quoteHash: '20be065f497b9b7250a13641f829f1f5466a9c1036d5843e46cb90e278b45f9b'
}

const parsedPeginQuoteMock: Quotes.PeginQuoteStruct = {
  fedBtcAddress: new Uint8Array([
    137, 110, 217, 243, 68, 109, 81,
    181, 81, 15, 127, 11, 110, 248,
    27, 43, 222, 85, 20, 14
  ]),
  lbcAddress: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
  liquidityProviderRskAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  btcRefundAddress: new Uint8Array([
    111, 5, 85, 121, 12, 236, 37, 72,
    190, 221, 46, 76, 178, 48, 57, 241,
    4, 240, 40, 33, 134
  ]),
  rskRefundAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  liquidityProviderBtcAddress: new Uint8Array([
    111, 77, 25, 29, 213, 89, 98, 105,
    251, 153, 254, 72, 87, 69, 181,
    236, 217, 126, 72, 185, 152
  ]),
  callFee: BigInt(1000000000000000),
  penaltyFee: 1000000,
  contractAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  data: '0x1a1b1c',
  gasLimit: 46000,
  nonce: BigInt('7591081102472764799'),
  value: BigInt(600000000000000000),
  agreementTimestamp: 1690985578,
  timeForDeposit: 3600,
  callTime: 7200,
  depositConfirmations: 10,
  callOnRegister: false,
  productFeeAmount: BigInt(600000000000000000),
  gasFee: BigInt(600000000000000)
}

describe('LiquidityBridgeContract class should', () => {
  let registerPeginParams: RegisterPeginParams
  let btcTxMock: any

  beforeAll(async () => {
    btcTxMock = await readFile('src/blockchain/mocks/btcTxMock.json').then(buffer => JSON.parse(buffer.toString()))
    const quote = peginQuoteMock
    const signature = '07cea1bed6da0994f7ae2f0669b82a033e1b519b964b8f7620a1d65c0c40d3500a8b2eab708c7601eb1bc32de9739f4a2865f72c6b58abbdbf793c5a4e7f64641c'
    const btcRawTransaction = btcTxMock.rawTx
    const height = 501
    const partialMerkleTree = '0200000002a2e4c3ee20febe6276705eac0df30e0457215069e058b2c1a2e771f0a70892f6a0025d9a02e5990ac75f3d3a8515aecf723fd53e57fcf8ae2f95951df9b483fc0105'
    registerPeginParams = { quote, signature, btcRawTransaction, height, partialMerkleTree }
  })

  test('initialize correctly', () => {
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)
    expect(ethers.Contract).toBeCalled()
    expect(lbc).toHaveProperty('liquidityBridgeContract', expect.anything())
  })
  test('use regtest custom lbc address only for regtest', async () => {
    const contractSpy = jest.spyOn(ethers, 'Contract')
    const customAddress = '0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4'
    const regtestConfig: FlyoverConfig = {
      network: 'Regtest',
      customLbcAddress: customAddress,
      captchaTokenResolver: async () => Promise.resolve('')
    }
    const testnetConfig: FlyoverConfig = { network: 'Testnet', captchaTokenResolver: async () => Promise.resolve('') }

    const regtestContract = new LiquidityBridgeContract(connectionMock, regtestConfig)
    const testnetContract = new LiquidityBridgeContract(connectionMock, testnetConfig)

    expect(regtestContract).not.toBeUndefined()
    expect(testnetContract).not.toBeUndefined()

    expect(contractSpy.mock.calls.at(0)).toEqual([customAddress, lbcAbi, signerMock])
    expect(contractSpy.mock.calls.at(1)).toEqual([FlyoverNetworks.Testnet.lbcAddress, lbcAbi, signerMock])
  })

  test('execute depositPegout correctly', async () => {
    const receiptMock = { status: 1, hash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }
    const contractMock = {
      depositPegout: jest.fn().mockImplementation(async () => {
        return Promise.resolve(
          {
            wait: async () => Promise.resolve(receiptMock)
          }
        )
      })
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })
    const amount = BigInt(500)

    const signature = '8cf4893bc89a84486e6f5c57d3d3881796f6eda5d217dfa2a6c49f4c5781d9c6'
    const encodedSignature = [
      140, 244, 137, 59, 200, 154, 132, 72, 110,
      111, 92, 87, 211, 211, 136, 23, 150,
      246, 237, 165, 210, 23, 223, 162, 166,
      196, 159, 76, 87, 129, 217, 198
    ]

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)

    await lbc.depositPegout(pegoutQuoteMock, signature, amount)

    const normalArrayBytes = Array.from(contractMock.depositPegout.mock.calls.at(0)?.at(1) as any)
    const normalizedQuote = parsedPegoutQuoteMock
    normalizedQuote.lbcAddress = (normalizedQuote.lbcAddress as string).toLowerCase()
    normalizedQuote.rskRefundAddress = (normalizedQuote.rskRefundAddress as string).toLowerCase()
    normalizedQuote.lpRskAddress = (normalizedQuote.lpRskAddress as string).toLowerCase()
    expect(normalArrayBytes).toEqual(encodedSignature)
    expect(contractMock.depositPegout).toBeCalledTimes(1)
    expect(serializer.stringify(contractMock.depositPegout.mock.calls.at(0)?.at(0)))
      .toEqual(serializer.stringify(normalizedQuote))
    expect(contractMock.depositPegout.mock.calls.at(0)?.at(2)).toEqual({ value: amount })
  })

  test('throw FlyoverError on depositPegout error', async () => {
    const contractMock = {
      depositPegout: jest.fn().mockImplementation(async () => {
        throw new Error('some error')
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const amount = BigInt(500)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)

    const signature = '8cf4893bc89a84486e6f5c57d3d3881796f6eda5d217dfa2a6c49f4c5781d9c6'

    expect.assertions(2)
    await lbc.depositPegout(pegoutQuoteMock, signature, amount).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing function depositPegout')
    })
  })

  test('execute refundUserPegOut correctly', async () => {
    const receiptMock = { status: 1, hash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }
    const contractMock = {
      refundUserPegOut: jest.fn().mockImplementation(async () => {
        return Promise.resolve(
          {
            wait: async () => Promise.resolve(receiptMock)
          }
        )
      })
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)

    await lbc.refundPegout(pegoutQuoteMock)

    const encodeQuoteHash = [
      199, 59, 97, 99, 99, 239, 116, 1,
      122, 8, 92, 96, 172, 185, 109, 232,
      139, 87, 38, 135, 8, 208, 110, 214,
      165, 210, 31, 191, 95, 8, 182, 155
    ]
    expect(contractMock.refundUserPegOut).toBeCalledTimes(1)
    expect(Array.from(contractMock.refundUserPegOut.mock.calls.at(0)?.at(0) as any)).toEqual(encodeQuoteHash)
  })

  test('throw FlyoverError on refundUserPegOut error', async () => {
    const contractMock = {
      refundUserPegOut: jest.fn().mockImplementation(async () => {
        throw new Error('some error')
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)

    expect.assertions(2)
    await lbc.refundPegout(pegoutQuoteMock).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing function refundUserPegOut')
    })
  })

  test('execute registerPegin correctly', async () => {
    const receiptMock = { status: 1, hash: '0x9fafb16acfcc8533a6b249daa01111e381a1d386f7f46fd1932c3cd86b6eb320' }
    const contractMock = {
      registerPegIn: jest.fn().mockImplementation(async () => {
        return Promise.resolve(
          {
            wait: async () => Promise.resolve(receiptMock)
          }
        )
      })
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)
    const { quote, signature, btcRawTransaction, partialMerkleTree, height } = registerPeginParams
    await lbc.registerPegin(quote, signature, btcRawTransaction, partialMerkleTree, height)

    const encodedSignature = [
      7, 206, 161, 190, 214, 218, 9, 148,
      247, 174, 47, 6, 105, 184, 42, 3,
      62, 27, 81, 155, 150, 75, 143, 118,
      32, 161, 214, 92, 12, 64, 211, 80,
      10, 139, 46, 171, 112, 140, 118, 1,
      235, 27, 195, 45, 233, 115, 159, 74,
      40, 101, 247, 44, 107, 88, 171, 189,
      191, 121, 60, 90, 78, 127, 100, 100,
      28
    ]

    const encodedPmt = [
      2, 0, 0, 0, 2, 162, 228, 195, 238,
      32, 254, 190, 98, 118, 112, 94,
      172, 13, 243, 14, 4, 87, 33, 80,
      105, 224, 88, 178, 193, 162, 231,
      113, 240, 167, 8, 146, 246, 160, 2,
      93, 154, 2, 229, 153, 10, 199, 95,
      61, 58, 133, 21, 174, 207, 114, 63,
      213, 62, 87, 252, 248, 174, 47, 149,
      149, 29, 249, 180, 131, 252, 1, 5
    ]

    const normalizedQuote = parsedPeginQuoteMock
    normalizedQuote.lbcAddress = (normalizedQuote.lbcAddress as string).toLowerCase()
    normalizedQuote.rskRefundAddress = (normalizedQuote.rskRefundAddress as string).toLowerCase()
    normalizedQuote.contractAddress = (normalizedQuote.contractAddress as string).toLowerCase()
    normalizedQuote.liquidityProviderRskAddress = (normalizedQuote.liquidityProviderRskAddress as string).toLowerCase()
    expect(contractMock.registerPegIn).toBeCalledTimes(1)
    expect(serializer.stringify(contractMock.registerPegIn.mock.calls.at(0)?.at(0))).toEqual(serializer.stringify(normalizedQuote))
    expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(1) as any)).toEqual(encodedSignature)
    expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(2) as any)).toEqual(btcTxMock.encodedRawTx)
    expect(Array.from(contractMock.registerPegIn.mock.calls.at(0)?.at(3) as any)).toEqual(encodedPmt)
    expect(contractMock.registerPegIn.mock.calls.at(0)?.at(4)).toEqual(501)
  })

  test('throw FlyoverError on registerPegin error', async () => {
    const contractMock = {
      registerPegIn: jest.fn().mockImplementation(async () => {
        throw new Error('some error')
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)
    const { quote, signature, btcRawTransaction, partialMerkleTree, height } = registerPeginParams
    expect.assertions(2)
    await lbc.registerPegin(quote, signature, btcRawTransaction, partialMerkleTree, height).catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing function registerPegIn')
    })
  })

  test('throw error on invalid address', () => {
    const customAddress = 'asdasdasvnwl'
    const regtestConfig: FlyoverConfig = {
      network: 'Regtest',
      customLbcAddress: customAddress,
      captchaTokenResolver: async () => Promise.resolve('')
    }
    expect(() => new LiquidityBridgeContract(connectionMock, regtestConfig)).toThrow('invalid address')
  })

  test('execute validatePeginDepositAddress correctly', async () => {
    const contractMock = {
      validatePeginDepositAddress: jest.fn().mockImplementation(async () => {
        return Promise.resolve(true)
      })
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    jest.spyOn(ethers.utils, 'arrayify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.arrayify(arg)
    })

    const config: FlyoverConfig = {
      network: 'Regtest',
      captchaTokenResolver: async () => Promise.resolve('')
    }
    const lbc = new LiquidityBridgeContract(connectionMock, config)
    jest.spyOn(ethers.utils.base58, 'decode').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.base58.decode(arg)
    })

    await lbc.validatePeginDepositAddress(peginQuoteMock, '2NB9Rp6DxS4WXefGoyNLa5rQWkcQtUM1FmF')

    const decodedAddress = [
      196, 196, 89, 163, 131, 210, 22, 251, 195,
      243, 191, 43, 188, 17, 192, 94, 140, 234,
      13, 179, 0, 100, 171, 220, 94
    ]

    const normalizedQuote = parsedPeginQuoteMock
    normalizedQuote.lbcAddress = (normalizedQuote.lbcAddress as string).toLowerCase()
    normalizedQuote.rskRefundAddress = (normalizedQuote.rskRefundAddress as string).toLowerCase()
    normalizedQuote.contractAddress = (normalizedQuote.contractAddress as string).toLowerCase()
    normalizedQuote.liquidityProviderRskAddress = (normalizedQuote.liquidityProviderRskAddress as string).toLowerCase()
    expect(contractMock.validatePeginDepositAddress).toBeCalledTimes(1)
    expect(serializer.stringify(contractMock.validatePeginDepositAddress.mock.calls.at(0)?.at(0))).toEqual(serializer.stringify(normalizedQuote))
    expect(Array.from(contractMock.validatePeginDepositAddress.mock.calls.at(0)?.at(1) as any)).toEqual(decodedAddress)
  })

  test('throw FlyoverError on validatePeginDepositAddress error', async () => {
    const contractMock = {
      validatePeginDepositAddress: jest.fn().mockImplementation(async () => {
        throw new Error('some error')
      })
    }
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)
    expect.assertions(2)
    await lbc.validatePeginDepositAddress(peginQuoteMock, '2NB9Rp6DxS4WXefGoyNLa5rQWkcQtUM1FmF').catch(e => {
      expect(e).toBeInstanceOf(BridgeError)
      expect(e.message).toBe('error executing view validatePeginDepositAddress')
    })
  })

  test('execute getProviders correctly', async () => {
    const realEthers = jest.requireActual<typeof ethers>('ethers')
    const contractProviders: any[] = [
      {
        apiBaseUrl: 'any url',
        id: realEthers.BigNumber.from(1),
        name: 'mock 1',
        provider: 'address 1',
        providerType: 'pegin',
        status: true
      },
      {
        apiBaseUrl: 'any url',
        id: realEthers.BigNumber.from(2),
        name: 'mock 2',
        provider: 'address 2',
        providerType: 'pegout',
        status: false
      }
    ]

    const contractMock = {
      getProviders: jest.fn().mockImplementation(async () => Promise.resolve(contractProviders))
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)

    const result = await lbc.getProviders()

    expect(contractMock.getProviders).toBeCalledTimes(1)
    expect(contractMock.getProviders).toBeCalledWith()
    // to validate the contract parsing
    contractProviders.forEach(provider => { provider.id = provider.id.toNumber() })
    expect(result).toEqual(contractProviders)
  })

  test('get productFeePercentage correctly', async () => {
    const contractMock = {
      productFeePercentage: jest.fn().mockImplementation(async () => Promise.resolve(2))
    }

    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)

    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)

    const result = await lbc.getProductFeePercentage()

    expect(contractMock.productFeePercentage).toBeCalledTimes(1)
    expect(result).toEqual(2)
  })

  test('normalize 0x prefix when parsing pegin quote', async () => {
    const contractMock = {
      hashQuote: jest.fn().mockReturnValue(Promise.resolve([0x01, 0x05, 0x07]))
    }
    jest.spyOn(ethers.utils, 'hexlify').mockImplementation((arg) => {
      const { utils } = jest.requireActual<typeof ethers>('ethers')
      return utils.hexlify(arg)
    })
    const contractClassMock = jest.mocked(ethers.Contract)
    contractClassMock.mockImplementation(() => contractMock as any)
    const config: FlyoverConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
    const lbc = new LiquidityBridgeContract(connectionMock, config)
    const prefixedMock = peginQuoteMock
    const notPrefixedMock = structuredClone(peginQuoteMock)
    notPrefixedMock.quote.data = notPrefixedMock.quote.data.slice(2)
    await expect(lbc.hashPeginQuote(prefixedMock)).resolves.not.toThrow()
    await expect(lbc.hashPeginQuote(notPrefixedMock)).resolves.not.toThrow()
    expect(serializer.stringify(contractMock.hashQuote.mock.calls[0]?.[0])).toBe(serializer.stringify(parsedPeginQuoteMock))
    expect(serializer.stringify(contractMock.hashQuote.mock.calls[1]?.[0])).toBe(serializer.stringify(parsedPeginQuoteMock))
  })
})
