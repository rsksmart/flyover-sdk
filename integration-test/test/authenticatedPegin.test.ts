import { describe, test, beforeAll, expect } from '@jest/globals'
import { Flyover, type Quote, PeginQuoteRequest, AcceptedQuote } from '@rsksmart/flyover-sdk'
import { assertTruthy, BlockchainConnection, Network } from '@rsksmart/bridges-core-sdk'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver } from './common/utils'

describe('Flyover authenticated pegin process should', () => {
    let flyover: Flyover
    let quotes: Quote[]
    let quote: Quote

    beforeAll(async () => {
        flyover = new Flyover({
            network: integrationTestConfig.network as Network,
            allowInsecureConnections: true,
            captchaTokenResolver: fakeTokenResolver,
            disableChecksum: true
        })

        const rskConnection = await BlockchainConnection.createUsingPassphrase(
            integrationTestConfig.testMnemonic,
            integrationTestConfig.nodeUrl
        )

        await flyover.connectToRsk(rskConnection)
    })

    test('accept authenticated quote', async () => {
        const providers = await flyover.getLiquidityProviders()

        const provider = providers.find(p => p.id === integrationTestConfig.providerId)
        assertTruthy(provider, 'Provider not found')
        flyover.useLiquidityProvider(provider)
        console.info(`Provider selected. Id: ${provider.id}, name: ${provider.name}`)

        // Get quote
        const request: PeginQuoteRequest = {
            callEoaOrContractAddress: integrationTestConfig.rskAddress,
            callContractArguments: '',
            valueToTransfer: integrationTestConfig.peginAmount,
            rskRefundAddress: integrationTestConfig.rskAddress
        }
        quotes = await flyover.getQuotes(request)

        expect(quotes.length).toBeGreaterThan(0)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        quote = quotes[0]!

        console.log('48 selected quote', quote)

        const signedQuote = await flyover.signQuote(quote)

        console.log('51 signed quote', signedQuote)

        const acceptedQuote = await flyover.acceptAuthenticatedQuote(quote, signedQuote)
        expect(acceptedQuote.signature).not.toBeUndefined()
        expect(acceptedQuote.bitcoinDepositAddressHash).not.toBeUndefined()

        console.log('51 accepted quote', acceptedQuote)
    })

    test('fail to accept tampered signature', async () => {
        const providers = await flyover.getLiquidityProviders()

        const provider = providers.find(p => p.id === integrationTestConfig.providerId)
        assertTruthy(provider, 'Provider not found')
        flyover.useLiquidityProvider(provider)
        console.info(`Provider selected. Id: ${provider.id}, name: ${provider.name}`)

        // Get quote
        const request: PeginQuoteRequest = {
            callEoaOrContractAddress: integrationTestConfig.rskAddress,
            callContractArguments: '',
            valueToTransfer: integrationTestConfig.peginAmount,
            rskRefundAddress: integrationTestConfig.rskAddress
        }
        quotes = await flyover.getQuotes(request)

        expect(quotes.length).toBeGreaterThan(0)
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        quote = quotes[0]!

        console.log('48 selected quote', quote)

        const signedQuote = await flyover.signQuote(quote)
        const tamperedSignedQuote = signedQuote.slice(0, -1) + (signedQuote.slice(-1) === 'a' ? 'b' : 'a')
        assertTruthy(tamperedSignedQuote !== signedQuote, 'Tampered signed quote is the same as the original')

        console.log('51 signed quote', signedQuote)

        await expect(flyover.acceptAuthenticatedQuote(quote, tamperedSignedQuote))
            .rejects
            .toMatchObject({
                details: {
                    error: expect.stringContaining('invalid signature')
                },
                recoverable: false
            })
    })

    test('fail when lockingcap has been exceeded', async () => {
        const providers = await flyover.getLiquidityProviders()

        const provider = providers.find(p => p.id === integrationTestConfig.providerId)
        assertTruthy(provider, 'Provider not found')
        flyover.useLiquidityProvider(provider)
        console.info(`Provider selected. Id: ${provider.id}, name: ${provider.name}`)

        const request: PeginQuoteRequest = {
            callEoaOrContractAddress: integrationTestConfig.rskAddress,
            callContractArguments: '',
            valueToTransfer: integrationTestConfig.peginAmount,
            rskRefundAddress: integrationTestConfig.rskAddress
        }

        let lockinCapExceeded = false
        let acceptedQuote: AcceptedQuote = {} as AcceptedQuote
        while (!lockinCapExceeded) {
            quotes = await flyover.getQuotes(request)

            expect(quotes.length).toBeGreaterThan(0)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            quote = quotes[0]!

            const signedQuote = await flyover.signQuote(quote)

            console.log('51 signed quote', signedQuote)

            try {
                acceptedQuote = await flyover.acceptAuthenticatedQuote(quote, signedQuote)
                expect(acceptedQuote.signature).not.toBeUndefined()
                expect(acceptedQuote.bitcoinDepositAddressHash).not.toBeUndefined()
            } catch (error) {
                expect(error).toMatchObject({
                    details: {
                        error: expect.stringContaining('locking cap exceeded')
                    }
                })
                lockinCapExceeded = true
            }

            console.log('51 accepted quote', acceptedQuote)
        }
    })
})