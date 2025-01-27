import { describe, test, expect, jest } from '@jest/globals'
import { type Quote } from '../api'
import { type RskBridge } from '../blockchain/bridge'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { validatePeginTransaction, type ValidatePeginTransactionParams } from './validatePeginTransaction'

const mainnetSignedInvalidAmountParams: ValidatePeginTransactionParams = {
  quoteInfo: {
    quote: {
      fedBTCAddr: '3LxPz39femVBL278mTiBvgzBNMVFqXssoH',
      lbcAddr: '0xAA9cAf1e3967600578727F975F283446A3Da6612',
      lpRSKAddr: '0x4202bac9919c3412fc7c8be4e678e26279386603',
      btcRefundAddr: '171gGjg8NeLUonNSrFmgwkgT1jgqzXR6QX',
      rskRefundAddr: '0xaD0DE1962ab903E06C725A1b343b7E8950a0Ff82',
      lpBTCAddr: '17kksixYkbHeLy9okV16kr4eAxVhFkRhP',
      callFee: BigInt('100000000000000'),
      penaltyFee: BigInt('10000000000000'),
      contractAddr: '0xaD0DE1962ab903E06C725A1b343b7E8950a0Ff82',
      data: '',
      gasLimit: 21000,
      nonce: BigInt('8373381263192041574'),
      value: BigInt('8000000000000000'),
      agreementTimestamp: 1727298699,
      timeForDeposit: 3600,
      lpCallTime: 7200,
      confirmations: 2,
      callOnRegister: false,
      gasFee: BigInt('1341211956000'),
      productFeeAmount: BigInt(0)
    },
    quoteHash: 'some-hash'
  },
  acceptInfo: {
    signature: '0x8ccd018b5c1fb7eceba2a13f8c977ae362c0daccafa6d77a5eb740527dd177620bb6c2d072d68869b3a08b193b1356de564e73233ea1c2686078bf87e3c909a31c',
    bitcoinDepositAddressHash: '34BuetGGSRPJno8jzFvD3r5rX4okqDifzM'
  },
  btcTx: '0x010000000148e9e71dafee5a901be4eceb5aca361c083481b70496f4e3da71e5d969add1820000000017160014b88ef07cd7bcc022b6d73c4764ce5db0887d5b05ffffffff02965c0c000000000017a9141b67149e474f0d7757181f4db89257f27a64738387125b01000000000017a914785c3e807e54dc41251d6377da0673123fa87bc88700000000'
}

const regtestSingedInvalidUtxoParams: ValidatePeginTransactionParams = {
  quoteInfo: {
    quote: {
      fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
      lbcAddr: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
      lpRSKAddr: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      btcRefundAddr: 'n1zjV3WxJgA4dBfS5aMiEHtZsjTUvAL7p7',
      rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      lpBTCAddr: 'n1jGDaxCW6jemLZyd9wmDHddseZwEMV9C6',
      callFee: BigInt('100000000000000'),
      penaltyFee: BigInt('10000000000000'),
      contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      data: '',
      gasLimit: 21000,
      nonce: BigInt('426885195519052333'),
      value: BigInt('500000000000000000'),
      agreementTimestamp: 1730815009,
      timeForDeposit: 3600,
      lpCallTime: 7200,
      confirmations: 10,
      callOnRegister: false,
      gasFee: BigInt('0'),
      productFeeAmount: BigInt(0)
    },
    quoteHash: '9bf66366ea7a20d55365549213caddf2b156f9eb432dc55b7a8c87d684549113'
  },
  acceptInfo: {
    signature: '55414d8d187ee782bcb6be603e00fccace0d9eb2bee21a9d77b80169b184f39240c0a0afc52d76e0139d07ba822880bf497fb8dad5b2a202fcf902b3b97ce99d1c',
    bitcoinDepositAddressHash: '2MxFSyNsUHreQedBqqk63J8qXwJPaswsjrn'
  },
  btcTx: '0100000001158c3d44784db51e035d28f45720fd72a7df8ddc0fe8e48a999a1dd37d63c2cc000000006a47304402204ee1d8b56ac9d28ef4aa19c641be57457116cbf6f5d68caab1f83e72c142e76002201fead00fe2ef9389c56664c46e9703fe592721a1bce6e51cb911a309d8b8c29301210340848716702fe8db959443ea979468c9299463fa570292939019443beb2e5dccfdffffff03800bb2030000000017a91436e377bd488201af9755d937bf3594273f8fa72a875aa9931e000000001976a9148e4c384f1603bc68210cb52a7f6215603259355088ac7ff0fa020000000017a91436e377bd488201af9755d937bf3594273f8fa72a8700000000'
}

const regtestUnsignedInvalidAmountParams: ValidatePeginTransactionParams = {
  quoteInfo: {
    quote: {
      fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
      lbcAddr: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
      lpRSKAddr: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      btcRefundAddr: 'n1zjV3WxJgA4dBfS5aMiEHtZsjTUvAL7p7',
      rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      lpBTCAddr: 'n1jGDaxCW6jemLZyd9wmDHddseZwEMV9C6',
      callFee: BigInt('100000000000000'),
      penaltyFee: BigInt('10000000000000'),
      contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      data: '',
      gasLimit: 21000,
      nonce: BigInt('5128835139217059423'),
      value: BigInt('500000000000000000'),
      agreementTimestamp: 1731064807,
      timeForDeposit: 3600,
      lpCallTime: 7200,
      confirmations: 10,
      callOnRegister: false,
      gasFee: BigInt(0),
      productFeeAmount: BigInt(0)
    },
    quoteHash: '65f1199e7a1f46469339d94d64d0c8fd933811313230f032b8198c0afead1645'
  },
  acceptInfo: {
    signature: '81ee01af2d1d83c5eed6b6b0f1f8be0226483b616bdbc492aeabaf7b96cfe17f7df530fc12273feacea6ed5a1e3fa9e5522471895cf4a9e9da508f5aed2c3ca31c',
    bitcoinDepositAddressHash: '2NB7VRApba3ojf9AU5EoeA314Pja8AF3tFT'
  },
  btcTx: '02000000019cd16112e824b3fb35ef6f830b8211f84d40c3c4eb099d79f23c3d2fb6ea143e0100000000fdffffff0280f0fa020000000017a914c3fbd0e26524bef1b6be6a8d9b2ac3af2f56ff3b872d8eeb14000000001976a91463c92dd69936d74d8c9cda5fef8a061a2e5ee71a88ac00000000'
}

const regtestUnsingedInvalidUtxoParams: ValidatePeginTransactionParams = {
  quoteInfo: {
    quote: {
      fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
      lbcAddr: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
      lpRSKAddr: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      btcRefundAddr: 'n1zjV3WxJgA4dBfS5aMiEHtZsjTUvAL7p7',
      rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      lpBTCAddr: 'n1jGDaxCW6jemLZyd9wmDHddseZwEMV9C6',
      callFee: BigInt('100000000000000'),
      penaltyFee: BigInt('10000000000000'),
      contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      data: '',
      gasLimit: 21000,
      nonce: BigInt('1942393199467323721'),
      value: BigInt('500000000000000000'),
      agreementTimestamp: 1731067882,
      timeForDeposit: 3600,
      lpCallTime: 7200,
      confirmations: 10,
      callOnRegister: false,
      gasFee: BigInt(0),
      productFeeAmount: BigInt(0)
    },
    quoteHash: 'd24d8c6ffce10f06f5f99e30f78b689356f5a4b7bdea1be87cb2aba54b5993f1'
  },
  acceptInfo: {
    signature: '8c4a7772c0fad0d867c5e82cf6c0935c968be9892f7e4c3ec4cfa049e2b9c8da72c14814a494eafc5590282d9034894479b91c0b65b32f80d0cb3c42648e16bc1b',
    bitcoinDepositAddressHash: '2N9Af51CVjUXPGZN6cTFSFQiy8KAJg5jrkc'
  },
  btcTx: '010000000004002d31010000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae187002d31010000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae187002d31010000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae187801d2c040000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae18700000000'
}

const regtestSignedValidParams: ValidatePeginTransactionParams = {
  quoteInfo: {
    quote: {
      fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
      lbcAddr: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
      lpRSKAddr: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      btcRefundAddr: 'n1zjV3WxJgA4dBfS5aMiEHtZsjTUvAL7p7',
      rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      lpBTCAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      callFee: BigInt('100000000000000'),
      penaltyFee: BigInt('10000000000000'),
      contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      data: '',
      gasLimit: 21000,
      nonce: BigInt('4294051270222581671'),
      value: BigInt('500000000000000000'),
      agreementTimestamp: 1731073120,
      timeForDeposit: 3600,
      lpCallTime: 7200,
      confirmations: 10,
      callOnRegister: false,
      gasFee: BigInt(0),
      productFeeAmount: BigInt(0)
    },
    quoteHash: 'a1e4682de734710a08461bc40b4c42b0ed821342903f11e8a0d71e9a76c698a2'
  },
  acceptInfo: {
    signature: '182a6576f74f0c8a76c9446789e6c0227e7a68874eca88149e0d465a395bbc8f146186c281014829202c4edd23d25fdd202cf02bf62b04be71f77c0b093ade521c',
    bitcoinDepositAddressHash: '2MvgUfcLzNwozJdUtkBFh3i3wMWuiscQEAw'
  },
  btcTx: '02000000019cd16112e824b3fb35ef6f830b8211f84d40c3c4eb099d79f23c3d2fb6ea143e010000006a473044022028229dbd1944ad59bfa5465c4b041ae038c1209040406145536c2f43985236e902205195ee92d7eb7bfde58e687f475a2ed23960180d6aec6a2d512e05528f0b42c40121034588339aa679b01d27ad2c5c668e7d75c41f9806abaae33aabc3783c0f89f933fdffffff02adf75214000000001976a914c8c4d053c02183f6aa6d44d60ecadd3ebd61879788ac008793030000000017a91425af076cedeb82ad979548f37d4f99c14b30d2438773020000'
}

const regtestUnsignedValidParams: ValidatePeginTransactionParams = {
  quoteInfo: {
    quote: {
      fedBTCAddr: '2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p',
      lbcAddr: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
      lpRSKAddr: '0x9d93929a9099be4355fc2389fbf253982f9df47c',
      btcRefundAddr: 'n1zjV3WxJgA4dBfS5aMiEHtZsjTUvAL7p7',
      rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      lpBTCAddr: 'n1jGDaxCW6jemLZyd9wmDHddseZwEMV9C6',
      callFee: BigInt('100000000000000'),
      penaltyFee: BigInt('10000000000000'),
      contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
      data: '',
      gasLimit: 21000,
      nonce: BigInt('6039955214355930584'),
      value: BigInt('500000000000000000'),
      agreementTimestamp: 1731081245,
      timeForDeposit: 3600,
      lpCallTime: 7200,
      confirmations: 10,
      callOnRegister: false,
      gasFee: BigInt(0),
      productFeeAmount: BigInt(0)
    },
    quoteHash: 'e0eb23644710c5ef8f218d9fa7dd4416471655660f2a2ba6b559059486c50ebb'
  },
  acceptInfo: {
    signature: '954a34b63f85151703e87e5d61ccc3acefa340b0dbe943bd20787e868c89bd6818835ef6073d0cd133b84b3d56151b31a9e1a4fbdb6e585cf04539a5216265751c',
    bitcoinDepositAddressHash: '2N4Y94w4j6MfcNiDJYdzdepdPfNnT79t14S'
  },
  btcTx: '0200000001745b85d6b1b7cf631c92c92faba180b2a6ce6eca7a9bb7a1e030137bc5cb9cb50000000000fdffffff02008793030000000017a9147bdc591c95c088cfad33356ae044bf1c5fe278c487e65abf10000000001976a914daf6e2bd97024710be556a304acb85462e332c0188ac00000000'
}

function getLbcMock (validAddressResult: boolean): Partial<LiquidityBridgeContract> {
  return {
    validatePeginDepositAddress: jest.fn<any>().mockImplementation(async (_quote: Quote, _depositAddress: string) => Promise.resolve(validAddressResult))
  }
}

describe('validatePeginTransaction function should', () => {
  test('validate that the quote has the correct value in a signed transaction', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = {
      config: { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') },
      lbc: getLbcMock(true),
      provider: {},
      bridge: {}
    } as FlyoverSDKContext

    const now = Date.now() / 1000
    const params = structuredClone(mainnetSignedInvalidAmountParams)
    params.quoteInfo.quote.agreementTimestamp = now

    const result = await validatePeginTransaction(context, params, { throwError: false })
    const expectedError = 'The amount paid 8101340000000000 is less than the expected value 8101341211956000.'
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, params, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('validate expiration time on signed transaction', async () => {
    const context = {} as FlyoverSDKContext // eslint-disable-line @typescript-eslint/consistent-type-assertions
    const result = await validatePeginTransaction(context, mainnetSignedInvalidAmountParams, { throwError: false })
    const expectedError = 'The quote some-hash was expired at 1727302299.'
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, mainnetSignedInvalidAmountParams, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('validate the deposit address in a signed transaction', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = {
      lbc: getLbcMock(false),
      provider: { apiBaseUrl: 'http://url.com' }
    } as FlyoverSDKContext

    const now = Date.now() / 1000
    const params = structuredClone(mainnetSignedInvalidAmountParams)
    params.quoteInfo.quote.agreementTimestamp = now

    const result = await validatePeginTransaction(context, params, { throwError: false })
    const expectedError = `Address 34BuetGGSRPJno8jzFvD3r5rX4okqDifzM doesn't belong to the expected receiver.
        http://url.com is potentially a malicious liquidity provider.`
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, params, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('validate that all the UTXOs are above the minimum in a signed transaction', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = {
      config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') },
      lbc: getLbcMock(true),
      provider: {},
      bridge: {
        getMinimumLockTxValue: async () => Promise.resolve(BigInt(50000000))
      }
    } as FlyoverSDKContext

    const now = Date.now() / 1000
    const params = structuredClone(regtestSingedInvalidUtxoParams)
    params.quoteInfo.quote.agreementTimestamp = now

    const result = await validatePeginTransaction(context, params, { throwError: false })
    const expectedError = 'The transaction has 1 outputs with less than the minimum value 500000000000000000.'
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, params, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('fail on invalid raw transaction', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = {
      config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') },
      lbc: getLbcMock(true),
      provider: {},
      bridge: {}
    } as FlyoverSDKContext
    const invalidValues: string[] = ['invalid', '', '01', '0xinvalid', '0x', '0x17']
    expect.assertions(4 * invalidValues.length)
    const now = Date.now() / 1000
    const params = structuredClone(regtestSingedInvalidUtxoParams)
    params.quoteInfo.quote.agreementTimestamp = now
    for (const invalidValue of invalidValues) {
      const invalidTxParams = { ...params, btcTx: invalidValue }
      const result = await validatePeginTransaction(context, invalidTxParams, { throwError: false })
      const expectedError = 'Invalid transaction: '
      expect(result).toContain(expectedError)
      try {
        await validatePeginTransaction(context, invalidTxParams, { throwError: true })
      } catch (error: any) {
        expect(error).toBeInstanceOf(FlyoverError)
        expect(error.message).toBe('Flyover error')
        expect(error.details).toContain(expectedError)
      }
    }
  })
  test('validate that the quote has the correct value in a unsigned transaction', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = {
      config: { network: 'Testnet', captchaTokenResolver: async () => Promise.resolve('') },
      lbc: getLbcMock(true),
      provider: {},
      bridge: {}
    } as FlyoverSDKContext

    const now = Date.now() / 1000
    const params = structuredClone(regtestUnsignedInvalidAmountParams)
    params.quoteInfo.quote.agreementTimestamp = now

    const result = await validatePeginTransaction(context, params, { throwError: false })
    const expectedError = 'The amount paid 500000000000000000 is less than the expected value 500100000000000000.'
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, params, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('validate expiration time on unsigned transaction', async () => {
    const context = {} as FlyoverSDKContext // eslint-disable-line @typescript-eslint/consistent-type-assertions
    const result = await validatePeginTransaction(context, regtestUnsignedInvalidAmountParams, { throwError: false })
    const expectedError = 'The quote 65f1199e7a1f46469339d94d64d0c8fd933811313230f032b8198c0afead1645 was expired at 1731068407.'
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, regtestUnsignedInvalidAmountParams, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('validate the deposit address in a unsigned transaction', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = {
      lbc: getLbcMock(false),
      provider: { apiBaseUrl: 'http://url.com' }
    } as FlyoverSDKContext

    const now = Date.now() / 1000
    const params = structuredClone(regtestUnsignedInvalidAmountParams)
    params.quoteInfo.quote.agreementTimestamp = now

    const result = await validatePeginTransaction(context, params, { throwError: false })
    const expectedError = `Address 2NB7VRApba3ojf9AU5EoeA314Pja8AF3tFT doesn't belong to the expected receiver.
        http://url.com is potentially a malicious liquidity provider.`
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, params, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('validate that all the UTXOs are above the minimum in a unsigned transaction', async () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const context = {
      config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') },
      lbc: getLbcMock(true),
      provider: {},
      bridge: {
        getMinimumLockTxValue: async () => Promise.resolve(BigInt(30000000))
      }
    } as FlyoverSDKContext

    const now = Date.now() / 1000
    const params = structuredClone(regtestUnsingedInvalidUtxoParams)
    params.quoteInfo.quote.agreementTimestamp = now

    const result = await validatePeginTransaction(context, params, { throwError: false })
    const expectedError = 'The transaction has 3 outputs with less than the minimum value 300000000000000000.'
    expect.assertions(4)
    expect(result).toBe(expectedError)
    try {
      await validatePeginTransaction(context, params, { throwError: true })
    } catch (error: any) {
      expect(error).toBeInstanceOf(FlyoverError)
      expect(error.message).toBe('Flyover error')
      expect(error.details).toBe(expectedError)
    }
  })
  test('accept a valid transaction', async () => {
    /* eslint-disable @typescript-eslint/consistent-type-assertions */
    const context = {
      config: { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') },
      lbc: getLbcMock(true),
      provider: {},
      bridge: {
        getMinimumLockTxValue: jest.fn<any>().mockImplementation(async () => Promise.resolve(BigInt(50000000)))
      } as Partial<RskBridge>
    } as FlyoverSDKContext
    /* eslint-enable @typescript-eslint/consistent-type-assertions */

    const now = Date.now() / 1000

    const signedParams = structuredClone(regtestSignedValidParams)
    signedParams.quoteInfo.quote.agreementTimestamp = now
    const signedResult = await validatePeginTransaction(context, signedParams, { throwError: true })

    const unsignedParams = structuredClone(regtestUnsignedValidParams)
    unsignedParams.quoteInfo.quote.agreementTimestamp = now
    const unsignedResult = await validatePeginTransaction(context, unsignedParams, { throwError: true })

    expect(signedResult).toBe('')
    expect(unsignedResult).toBe('')
    expect(context.lbc.validatePeginDepositAddress).toBeCalledTimes(2)
    expect(context.bridge.getMinimumLockTxValue).toBeCalledTimes(2)
    expect(context.lbc.validatePeginDepositAddress).toHaveBeenNthCalledWith(1, signedParams.quoteInfo, signedParams.acceptInfo.bitcoinDepositAddressHash)
    expect(context.lbc.validatePeginDepositAddress).toHaveBeenNthCalledWith(2, unsignedParams.quoteInfo, unsignedParams.acceptInfo.bitcoinDepositAddressHash)
  })
})
