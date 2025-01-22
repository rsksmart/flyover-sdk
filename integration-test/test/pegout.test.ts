import { describe, test, beforeAll, expect } from '@jest/globals'
import { BlockchainConnection } from '@rsksmart/bridges-core-sdk'
import { Flyover, type PegoutQuote, type LiquidityProvider, type AcceptedPegoutQuote, FlyoverUtils } from '@rsksmart/flyover-sdk'
import { readFile } from 'fs/promises'
import { EXTENDED_TIMEOUT, TEST_URL } from './common/constants'

describe('Flyover pegout process should', () => {
  let flyover: Flyover
  let providers: LiquidityProvider[]
  let quotes: PegoutQuote[]
  let selectedQuote: PegoutQuote
  let acceptedQuote: AcceptedPegoutQuote

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

  test('return providers list from LiquidityBridgeContract', async () => {
    providers = await flyover.getLiquidityProviders()
    const provider = providers.at(0)
    expect(providers).toBeTruthy()
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
      expect(provider?.pegin.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegin.minTransactionValue).not.toBeUndefined()
    }
    if (provider?.providerType === 'pegout' || provider?.providerType === 'both') {
      expect(provider?.pegout).not.toBeUndefined()
      expect(provider?.pegout.fee).not.toBeUndefined()
      expect(provider?.pegout.maxTransactionValue).not.toBeUndefined()
      expect(provider?.pegout.minTransactionValue).not.toBeUndefined()
    }
  })

  test('get pegout quotes for a specific provider', async () => {
    const provider = providers[0]! // eslint-disable-line @typescript-eslint/no-non-null-assertion
    flyover.useLiquidityProvider(provider)
    quotes = await flyover.getPegoutQuotes({
      to: 'bcrt1q0tsujvxstk5c38zuyjwlwwf2vue76sul5rkcpu',
      valueToTransfer: BigInt('600000000000000000'),
      rskRefundAddress: '0xa2193A393aa0c94A4d52893496F02B56C61c36A1'
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
    const { detail, status } = await flyover.getPegoutStatus(selectedQuote.quoteHash)

    expect(detail).not.toBeUndefined()
    expect(status).not.toBeUndefined()

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
  }, EXTENDED_TIMEOUT)

  test.skip('[DISABLED: until we have a way to force a quote expiration] execute refungPegout to get back amount', async () => {
    const txHash = await flyover.refundPegout(selectedQuote)
    expect([null, undefined, '']).not.toContain(txHash)
  }, EXTENDED_TIMEOUT)
})
