import { describe, test, beforeAll, expect } from '@jest/globals'
import { Flyover, type Quote, PeginQuoteRequest, AcceptedQuote } from '@rsksmart/flyover-sdk'
import { assertTruthy, BlockchainConnection, Network } from '@rsksmart/bridges-core-sdk'
import { integrationTestConfig } from '../config'
import { fakeTokenResolver } from './common/utils'

/**
 * In order to run this test, a trusted account must be created in the database of the LPS.
 * For local testing, the LPS has a parameter and a script that does the insertion. Change that parameter and run the script.
 * Another option is to use the management console of the LPS.
 * The recommended locking caps are 3 BTC and 3 RBTC to be able to test the locking cap exceeded error in a more visible way.
 * The inserted address for that trusted account must be under control of the tester and the mnemonic must be provided
 * as a parameter in the /integration-test/.env file.
 * After a full execution of the test, the documents created in retainedPeginQuote in the database must be deleted to
 * have locking cap reset for the next test execution.
 */
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

        const signedQuote = await flyover.signQuote(quote)

        const acceptedQuote = await flyover.acceptAuthenticatedQuote(quote, signedQuote)
        expect(acceptedQuote.signature).not.toBeUndefined()
        expect(acceptedQuote.bitcoinDepositAddressHash).not.toBeUndefined()
    })

    test('fail to accept tampered signature', async () => {
        const providers = await flyover.getLiquidityProviders()

        const provider = providers.find(p => p.id === integrationTestConfig.providerId)
        assertTruthy(provider, 'Provider not found')
        flyover.useLiquidityProvider(provider)

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

        const signedQuote = await flyover.signQuote(quote)
        const tamperedSignedQuote = signedQuote.slice(0, -1) + (signedQuote.slice(-1) === 'a' ? 'b' : 'a')
        assertTruthy(tamperedSignedQuote !== signedQuote, 'Tampered signed quote is the same as the original')

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

        const request: PeginQuoteRequest = {
            callEoaOrContractAddress: integrationTestConfig.rskAddress,
            callContractArguments: '',
            valueToTransfer: integrationTestConfig.peginAmount,
            rskRefundAddress: integrationTestConfig.rskAddress
        }
        let acceptedQuote: AcceptedQuote = {} as AcceptedQuote

        let lockinCapExceeded = false
        while (!lockinCapExceeded) {
            quotes = await flyover.getQuotes(request)

            expect(quotes.length).toBeGreaterThan(0)
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            quote = quotes[0]!

            const signedQuote = await flyover.signQuote(quote)

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

                // The error message format is something like this:
                // details: {
                //     error: 'AcceptPeginQuote: locking cap exceeded. Args: {"address":"0x1538283abbD198DcD966f43230363A68108c6373","currentLocked":"2400269000000000000","lockingCap":"3000000000000000000"}'
                // },
                // Extract JSON from error message
                const errorMessage = (error as any).details.error
                const jsonMatch = errorMessage.match(/Args: ({.*})/)
                expect(jsonMatch).not.toBeNull()

                const lockingData = JSON.parse(jsonMatch[1])

                const currentLocked = BigInt(lockingData.currentLocked)
                const lockingCap = BigInt(lockingData.lockingCap)
                const quoteValue = BigInt(quote.quote.value)
                const quoteGasFee = BigInt(quote.quote.gasFee)

                // Assert that currentLocked + quote.value + quote.gasFee > lockingCap
                const totalRequired = currentLocked + quoteValue + quoteGasFee

                expect(totalRequired).toBeGreaterThan(lockingCap)

                lockinCapExceeded = true
            }
        }
    })
})
