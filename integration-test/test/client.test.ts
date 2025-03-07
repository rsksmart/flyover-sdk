import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainReadOnlyConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover } from '@rsksmart/flyover-sdk'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver } from './common/utils'

describe('Flyover SDK client should', () => {
  let flyover: Flyover

  beforeAll(async () => {
    flyover = new Flyover({
      network: integrationTestConfig.network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver,
      disableChecksum: true
    })
    const rsk = await BlockchainReadOnlyConnection.createUsingRpc(integrationTestConfig.nodeUrl)
    await flyover.connectToRsk(rsk)
  })

  test('serialize and deserialize BigInt fields correctly', async () => {
    const providers = await flyover.getLiquidityProviders()
    if (providers?.length === 0 || providers.at(0)?.provider === '') {
      throw new Error('invalid providers response')
    }
    const provider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(provider, 'Provider not found')
    flyover.useLiquidityProvider(provider)

    const peginQuotes = await flyover.getQuotes({
      callEoaOrContractAddress: integrationTestConfig.rskAddress,
      callContractArguments: '',
      valueToTransfer: integrationTestConfig.peginAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    })
    if (peginQuotes?.length === 0) {
      throw new Error('invalid getQuote response')
    }
    const peginQuote = peginQuotes.at(0)

    const pegoutQuotes = await flyover.getPegoutQuotes({
      to: integrationTestConfig.btcAddress,
      valueToTransfer: integrationTestConfig.pegoutAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    })
    if (pegoutQuotes?.length === 0) {
      throw new Error('invalid getPegoutQuote response')
    }
    const pegoutQuote = pegoutQuotes.at(0)

    expect(typeof peginQuote?.quote.value).toBe('bigint')
    expect(peginQuote?.quote.value.toString()).toBe(integrationTestConfig.peginAmount.toString())
    expect(typeof peginQuote?.quote.gasLimit).toBe('number')

    expect(typeof pegoutQuote?.quote.value).toBe('bigint')
    expect(pegoutQuote?.quote.value.toString()).toBe(integrationTestConfig.pegoutAmount.toString())
    expect(typeof pegoutQuote?.quote.transferTime).toBe('number')
  })
})
