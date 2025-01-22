import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover } from '@rsksmart/flyover-sdk'
import { readFile } from 'fs/promises'
import { TEST_URL } from './common/constants'

describe('Flyover SDK client should', () => {
  let flyover: Flyover

  beforeAll(async () => {
    flyover = new Flyover({
      network: 'Regtest',
      allowInsecureConnections: true,
      captchaTokenResolver: async () => Promise.resolve(''),
      disableChecksum: true
    })
    const buffer = await readFile('fake-credentials.json')
    const credentials: { encryptedJson: any, password: string } = JSON.parse(buffer.toString())
    const rsk = await BlockchainConnection.createUsingEncryptedJson(credentials.encryptedJson, credentials.password, TEST_URL)
    await flyover.connectToRsk(rsk)
  })

  test('serialize and deserialize BigInt fields correctly', async () => {
    const providers = await flyover.getLiquidityProviders()
    if (providers?.length === 0 || providers.at(0)?.provider === '') {
      throw new Error('invalid providers response')
    }
    const provider = providers.at(0)! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    flyover.useLiquidityProvider(provider)

    const peginQuotes = await flyover.getQuotes({
      callEoaOrContractAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1',
      callContractArguments: '',
      valueToTransfer: BigInt('600000000000000000'),
      rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1'
    })
    if (peginQuotes?.length === 0) {
      throw new Error('invalid getQuote response')
    }
    const peginQuote = peginQuotes.at(0)

    const pegoutQuotes = await flyover.getPegoutQuotes({
      to: 'miMRxGvjQCqWZtdyJCEZ6h8GsTXBtJjNo6',
      valueToTransfer: BigInt('600000000000000000'),
      rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1'
    })
    if (pegoutQuotes?.length === 0) {
      throw new Error('invalid getPegoutQuote response')
    }
    const pegoutQuote = pegoutQuotes.at(0)

    expect(typeof peginQuote?.quote.value).toBe('bigint')
    expect(peginQuote?.quote.value.toString()).toBe('600000000000000000')
    expect(typeof peginQuote?.quote.gasLimit).toBe('number')

    expect(typeof pegoutQuote?.quote.value).toBe('bigint')
    expect(pegoutQuote?.quote.value.toString()).toBe('600000000000000000')
    expect(typeof pegoutQuote?.quote.transferTime).toBe('number')
  })
})
