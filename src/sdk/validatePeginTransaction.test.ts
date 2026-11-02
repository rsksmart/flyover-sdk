import { describe, test, expect, jest } from '@jest/globals'
import { type RskBridge } from '../blockchain/bridge'
import { FlyoverError } from '../client/httpClient'
import { type FlyoverSDKContext } from '../utils/interfaces'
import { validatePeginTransaction, type ValidatePeginTransactionParams } from './validatePeginTransaction'
import { PegInContract } from '../blockchain/pegin'

const mainnetSignedInvalidAmountAddress = '34BuetGGSRPJno8jzFvD3r5rX4okqDifzM'
const mainnetSignedInvalidAmountParams: ValidatePeginTransactionParams = {
  rskAddress: '0xaD0DE1962ab903E06C725A1b343b7E8950a0Ff82',
  expectedAmount: BigInt('8101341211956000'),
  btcTx: '0x010000000148e9e71dafee5a901be4eceb5aca361c083481b70496f4e3da71e5d969add1820000000017160014b88ef07cd7bcc022b6d73c4764ce5db0887d5b05ffffffff02965c0c000000000017a9141b67149e474f0d7757181f4db89257f27a64738387125b01000000000017a914785c3e807e54dc41251d6377da0673123fa87bc88700000000'
}

const regtestSingedInvalidUtxoAddress = '2MxFSyNsUHreQedBqqk63J8qXwJPaswsjrn'
const regtestSingedInvalidUtxoParams: ValidatePeginTransactionParams = {
  rskAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  expectedAmount: BigInt('500100000000000000'),
  btcTx: '0100000001158c3d44784db51e035d28f45720fd72a7df8ddc0fe8e48a999a1dd37d63c2cc000000006a47304402204ee1d8b56ac9d28ef4aa19c641be57457116cbf6f5d68caab1f83e72c142e76002201fead00fe2ef9389c56664c46e9703fe592721a1bce6e51cb911a309d8b8c29301210340848716702fe8db959443ea979468c9299463fa570292939019443beb2e5dccfdffffff03800bb2030000000017a91436e377bd488201af9755d937bf3594273f8fa72a875aa9931e000000001976a9148e4c384f1603bc68210cb52a7f6215603259355088ac7ff0fa020000000017a91436e377bd488201af9755d937bf3594273f8fa72a8700000000'
}

const regtestUnsignedInvalidAmountAddress = '2NB7VRApba3ojf9AU5EoeA314Pja8AF3tFT'
const regtestUnsignedInvalidAmountParams: ValidatePeginTransactionParams = {
  rskAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  expectedAmount: BigInt('500100000000000000'),
  btcTx: '02000000019cd16112e824b3fb35ef6f830b8211f84d40c3c4eb099d79f23c3d2fb6ea143e0100000000fdffffff0280f0fa020000000017a914c3fbd0e26524bef1b6be6a8d9b2ac3af2f56ff3b872d8eeb14000000001976a91463c92dd69936d74d8c9cda5fef8a061a2e5ee71a88ac00000000'
}

const regtestUnsingedInvalidUtxoAddress = '2N9Af51CVjUXPGZN6cTFSFQiy8KAJg5jrkc'
const regtestUnsingedInvalidUtxoParams: ValidatePeginTransactionParams = {
  rskAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  expectedAmount: BigInt('500100000000000000'),
  btcTx: '010000000004002d31010000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae187002d31010000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae187002d31010000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae187801d2c040000000017a914aea4de9f31e6f6db7efefdff05cbdea465458ae18700000000'
}

const regtestSignedValidAddress = '2MvgUfcLzNwozJdUtkBFh3i3wMWuiscQEAw'
const regtestSignedValidParams: ValidatePeginTransactionParams = {
  rskAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  expectedAmount: BigInt('500100000000000000'),
  btcTx: '02000000019cd16112e824b3fb35ef6f830b8211f84d40c3c4eb099d79f23c3d2fb6ea143e010000006a473044022028229dbd1944ad59bfa5465c4b041ae038c1209040406145536c2f43985236e902205195ee92d7eb7bfde58e687f475a2ed23960180d6aec6a2d512e05528f0b42c40121034588339aa679b01d27ad2c5c668e7d75c41f9806abaae33aabc3783c0f89f933fdffffff02adf75214000000001976a914c8c4d053c02183f6aa6d44d60ecadd3ebd61879788ac008793030000000017a91425af076cedeb82ad979548f37d4f99c14b30d2438773020000'
}

const regtestUnsignedValidAddress = '2N4Y94w4j6MfcNiDJYdzdepdPfNnT79t14S'
const regtestUnsignedValidParams: ValidatePeginTransactionParams = {
  rskAddress: '0x79568c2989232dCa1840087D73d403602364c0D4',
  expectedAmount: BigInt('500100000000000000'),
  btcTx: '0200000001745b85d6b1b7cf631c92c92faba180b2a6ce6eca7a9bb7a1e030137bc5cb9cb50000000000fdffffff02008793030000000017a9147bdc591c95c088cfad33356ae044bf1c5fe278c487e65abf10000000001976a914daf6e2bd97024710be556a304acb85462e332c0188ac00000000'
}

function getPeginContractMock (depositAddress: string): Partial<PegInContract> {
  return {
    getDepositAddress: jest.fn<any>().mockImplementation(async (_rskAddress: string) => Promise.resolve(depositAddress))
  }
}

function getErrorCaseAssertions (name: string, context: FlyoverSDKContext, params: ValidatePeginTransactionParams, expectedError: string): void {
  test(name, async () => {
    const result = await validatePeginTransaction(context, params, { throwError: false })
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
}

const mainnetConfig = { network: 'Mainnet', captchaTokenResolver: async () => Promise.resolve('') }
const regtestConfig = { network: 'Regtest', captchaTokenResolver: async () => Promise.resolve('') }
const testnetConfig = { network: 'Testnet', captchaTokenResolver: async () => Promise.resolve('') }

describe('validatePeginTransaction function should', () => {
  getErrorCaseAssertions(
    'validate that the transaction pays the expected value in a signed transaction',
    {
      config: mainnetConfig,
      lbc: { pegInContract: getPeginContractMock(mainnetSignedInvalidAmountAddress) },
      bridge: {}
    } as FlyoverSDKContext,
    mainnetSignedInvalidAmountParams,
    'The amount paid 8101340000000000 is less than the expected value 8101341211956000.'
  )
  getErrorCaseAssertions(
    'validate the deposit address in a signed transaction',
    {
      config: mainnetConfig,
      lbc: { pegInContract: getPeginContractMock('3LxPz39femVBL278mTiBvgzBNMVFqXssoH') }
    } as FlyoverSDKContext,
    mainnetSignedInvalidAmountParams,
    "The transaction doesn't pay the deposit address 3LxPz39femVBL278mTiBvgzBNMVFqXssoH."
  )
  getErrorCaseAssertions(
    'validate that all the UTXOs are above the minimum in a signed transaction',
    {
      config: regtestConfig,
      lbc: { pegInContract: getPeginContractMock(regtestSingedInvalidUtxoAddress) },
      bridge: {
        getMinimumLockTxValue: async () => Promise.resolve(BigInt(50000000))
      }
    } as FlyoverSDKContext,
    regtestSingedInvalidUtxoParams,
    'The transaction has 1 outputs with less than the minimum value 500000000000000000.'
  )
  test('fail on invalid raw transaction', async () => {
    const context = {
      config: regtestConfig,
      lbc: { pegInContract: getPeginContractMock(regtestSingedInvalidUtxoAddress) },
      bridge: {}
    } as FlyoverSDKContext
    const invalidValues: string[] = ['invalid', '01', '0xinvalid', '0x', '0x17']
    expect.assertions(4 * invalidValues.length)
    for (const invalidValue of invalidValues) {
      const invalidTxParams = { ...regtestSingedInvalidUtxoParams, btcTx: invalidValue }
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
  getErrorCaseAssertions(
    'validate that the transaction pays the expected value in a unsigned transaction',
    {
      config: testnetConfig,
      lbc: { pegInContract: getPeginContractMock(regtestUnsignedInvalidAmountAddress) },
      bridge: {}
    } as FlyoverSDKContext,
    regtestUnsignedInvalidAmountParams,
    'The amount paid 500000000000000000 is less than the expected value 500100000000000000.'
  )
  getErrorCaseAssertions(
    'validate the deposit address in a unsigned transaction',
    {
      config: testnetConfig,
      lbc: { pegInContract: getPeginContractMock('2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p') }
    } as FlyoverSDKContext,
    regtestUnsignedInvalidAmountParams,
    "The transaction doesn't pay the deposit address 2N5muMepJizJE1gR7FbHJU6CD18V3BpNF9p."
  )
  getErrorCaseAssertions(
    'validate that all the UTXOs are above the minimum in a unsigned transaction',
    {
      config: regtestConfig,
      lbc: { pegInContract: getPeginContractMock(regtestUnsingedInvalidUtxoAddress) },
      bridge: {
        getMinimumLockTxValue: async () => Promise.resolve(BigInt(30000000))
      }
    } as FlyoverSDKContext,
    regtestUnsingedInvalidUtxoParams,
    'The transaction has 3 outputs with less than the minimum value 300000000000000000.'
  )
  test('accept a valid transaction', async () => {
    const bridge = {
      getMinimumLockTxValue: jest.fn<any>().mockImplementation(async () => Promise.resolve(BigInt(50000000)))
    } as Partial<RskBridge>
    const signedContract = getPeginContractMock(regtestSignedValidAddress)
    const unsignedContract = getPeginContractMock(regtestUnsignedValidAddress)

    const signedResult = await validatePeginTransaction({
      config: regtestConfig,
      lbc: { pegInContract: signedContract },
      bridge
    } as FlyoverSDKContext, regtestSignedValidParams, { throwError: true })
    const unsignedResult = await validatePeginTransaction({
      config: regtestConfig,
      lbc: { pegInContract: unsignedContract },
      bridge
    } as FlyoverSDKContext, regtestUnsignedValidParams, { throwError: true })

    expect(signedResult).toBe('')
    expect(unsignedResult).toBe('')
    expect(signedContract.getDepositAddress).toHaveBeenCalledWith(regtestSignedValidParams.rskAddress)
    expect(unsignedContract.getDepositAddress).toHaveBeenCalledWith(regtestUnsignedValidParams.rskAddress)
    expect(bridge.getMinimumLockTxValue).toBeCalledTimes(2)
  })
})
