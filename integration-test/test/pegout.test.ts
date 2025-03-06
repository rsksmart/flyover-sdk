import { describe, test, beforeAll, expect } from '@jest/globals'
import { assertTruthy, BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover, type PegoutQuote, type LiquidityProvider, type AcceptedPegoutQuote, FlyoverUtils } from '@rsksmart/flyover-sdk'
import { integrationTestConfig } from '../config'
import { EXTENDED_TIMEOUT } from './common/constants'
import { fakeTokenResolver } from './common/utils'

describe('Flyover pegout process should', () => {
  let flyover: Flyover
  let provider: LiquidityProvider
  let quotes: PegoutQuote[]
  let selectedQuote: PegoutQuote
  let acceptedQuote: AcceptedPegoutQuote

  beforeAll(async () => {
    flyover = new Flyover({
      network: integrationTestConfig.network,
      allowInsecureConnections: true,
      captchaTokenResolver: fakeTokenResolver,
      disableChecksum: true
    })
    const rsk = await BlockchainConnection.createUsingPassphrase(
      integrationTestConfig.testMnemonic,
      integrationTestConfig.nodeUrl
    )
    await flyover.connectToRsk(rsk)
  })

  test('return providers list from LiquidityBridgeContract', async () => {
    const providers = await flyover.getLiquidityProviders()
    const selectedProvider = providers.find(p => p.id === integrationTestConfig.providerId)
    assertTruthy(selectedProvider, 'Provider not found')
    provider = selectedProvider
    expect(providers.length).toBeGreaterThan(0)
    expect(provider?.apiBaseUrl).not.toBeUndefined()
    expect(provider?.id).not.toBeUndefined()
    expect(provider?.provider).not.toBeUndefined()
    expect(provider?.name).not.toBeUndefined()
    expect(provider?.status).not.toBeUndefined()
    expect(provider?.siteKey).not.toBeUndefined()
    expect(provider?.liquidityCheckEnabled).not.toBeUndefined()
    expect(provider?.providerType).not.toBeUndefined()
    if (provider?.providerType === 'pegin' || provider?.providerType === 'both') {
      expect(provider?.pegin).not.toBeUndefined()
      expect(provider?.pegin.fee).not.toBeUndefined()
      expect(provider?.pegin.feePercentage).not.toBeUndefined()
      expect(provider?.pegin.fixedFee).not.toBeUndefined()
      expect(provider?.pegin.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegin.minTransactionValue).not.toBeUndefined()
      expect(provider?.pegin.fixedFee).toBe(provider?.pegin.fee)
    }
    if (provider?.providerType === 'pegout' || provider?.providerType === 'both') {
      expect(provider?.pegout).not.toBeUndefined()
      expect(provider?.pegout.fee).not.toBeUndefined()
      expect(provider?.pegout.feePercentage).not.toBeUndefined()
      expect(provider?.pegout.fixedFee).not.toBeUndefined()
      expect(provider?.pegout.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegout.minTransactionValue).not.toBeUndefined()
      expect(provider?.pegout.fixedFee).toBe(provider?.pegout.fee)
    }
  })

  test('get pegout quotes for a specific provider', async () => {
    flyover.useLiquidityProvider(provider)
    quotes = await flyover.getPegoutQuotes({
      to: integrationTestConfig.btcAddress,
      valueToTransfer: integrationTestConfig.pegoutAmount,
      rskRefundAddress: integrationTestConfig.rskAddress
    })

    expect(quotes).toBeTruthy()
    expect(quotes.length).toBeGreaterThan(0)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { quote, quoteHash } = selectedQuote = quotes[0]!
    expect(quoteHash).not.toBeUndefined()
    expect(quote.agreementTimestamp).not.toBeUndefined()
    expect(quote.btcRefundAddress).not.toBeUndefined()
    expect(quote.callFee).not.toBeUndefined()
    expect(quote.depositAddr).not.toBeUndefined()
    expect(quote.depositConfirmations).not.toBeUndefined()
    expect(quote.depositDateLimit).not.toBeUndefined()
    expect(quote.expireBlocks).not.toBeUndefined()
    expect(quote.expireDate).not.toBeUndefined()
    expect(quote.gasFee).not.toBeUndefined()
    expect(quote.lbcAddress).not.toBeUndefined()
    expect(quote.liquidityProviderRskAddress).not.toBeUndefined()
    expect(quote.lpBtcAddr).not.toBeUndefined()
    expect(quote.nonce).not.toBeUndefined()
    expect(quote.penaltyFee).not.toBeUndefined()
    expect(quote.rskRefundAddress).not.toBeUndefined()
    expect(quote.transferConfirmations).not.toBeUndefined()
    expect(quote.transferTime).not.toBeUndefined()
    expect(quote.value).not.toBeUndefined()
    expect(quote.productFeeAmount).not.toBeUndefined()
  })

  test('accept specific quote', async () => {
    const quote = quotes[0]! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    acceptedQuote = await flyover.acceptPegoutQuote(quote)

    expect(acceptedQuote.signature).not.toBeUndefined()
    expect(acceptedQuote.lbcAddress).not.toBeUndefined()
  })

  test('deposit amount to lbc for accepted quote', async () => {
    const txHash = await flyover.depositPegout(selectedQuote, acceptedQuote.signature, FlyoverUtils.getQuoteTotal(selectedQuote))
    expect([null, undefined, '']).not.toContain(txHash)
  }, EXTENDED_TIMEOUT)

  test('get status of the accepted quote', async () => {
    const { detail, status, creationData } = await flyover.getPegoutStatus(selectedQuote.quoteHash)

    expect(detail).not.toBeUndefined()
    expect(status).not.toBeUndefined()
    expect(creationData).not.toBeUndefined()

    expect(detail.agreementTimestamp).not.toBeUndefined()
    expect(detail.btcRefundAddress).not.toBeUndefined()
    expect(detail.callFee).not.toBeUndefined()
    expect(detail.depositAddr).not.toBeUndefined()
    expect(detail.depositConfirmations).not.toBeUndefined()
    expect(detail.depositDateLimit).not.toBeUndefined()
    expect(detail.expireBlocks).not.toBeUndefined()
    expect(detail.expireDate).not.toBeUndefined()
    expect(detail.gasFee).not.toBeUndefined()
    expect(detail.lbcAddress).not.toBeUndefined()
    expect(detail.liquidityProviderRskAddress).not.toBeUndefined()
    expect(detail.lpBtcAddr).not.toBeUndefined()
    expect(detail.nonce).not.toBeUndefined()
    expect(detail.penaltyFee).not.toBeUndefined()
    expect(detail.productFeeAmount).not.toBeUndefined()
    expect(detail.rskRefundAddress).not.toBeUndefined()
    expect(detail.transferConfirmations).not.toBeUndefined()
    expect(detail.transferTime).not.toBeUndefined()
    expect(detail.value).not.toBeUndefined()

    expect(status.bridgeRefundTxHash).not.toBeUndefined()
    expect(status.depositAddress).not.toBeUndefined()
    expect(status.lpBtcTxHash).not.toBeUndefined()
    expect(status.quoteHash).not.toBeUndefined()
    expect(status.refundPegoutTxHash).not.toBeUndefined()
    expect(status.requiredLiquidity).not.toBeUndefined()
    expect(status.signature).not.toBeUndefined()
    expect(status.state).not.toBeUndefined()
    expect(status.userRskTxHash).not.toBeUndefined()

    expect(creationData.fixedFee).not.toBeUndefined()
    expect(creationData.gasPrice).not.toBeUndefined()
    expect(creationData.feePercentage).not.toBeUndefined()
    expect(creationData.feeRate).not.toBeUndefined()
  }, EXTENDED_TIMEOUT)

  test.skip('[DISABLED: until we have a way to force a quote expiration] execute refungPegout to get back amount', async () => {
    const txHash = await flyover.refundPegout(selectedQuote)
    expect([null, undefined, '']).not.toContain(txHash)
  }, EXTENDED_TIMEOUT)
})
