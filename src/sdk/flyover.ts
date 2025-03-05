import { getQuote } from './getQuote'
import { getProviders } from './getProviders'
import { acceptQuote } from './acceptQuote'
import {
  type AcceptedQuote, type Quote, type PeginQuoteRequest,
  type LiquidityProvider, type PegoutQuoteRequest, type PegoutQuote,
  type AcceptedPegoutQuote,
  type DepositEvent,
  type PeginQuoteStatus,
  type PegoutQuoteStatus,
  type AvailableLiquidity
} from '../api'
import { getPegoutQuote } from './getPegoutQuote'
import { acceptPegoutQuote } from './acceptPegoutQuote'
import { toDataURL } from 'qrcode'
import { LiquidityBridgeContract } from '../blockchain/lbc'
import { depositPegout } from './depositPegout'
import { refundPegout } from './refundPegout'
import { getUserQuotes } from './getUserQuotes'
import { processError } from '../utils/errorHandling'
import { registerPegin, type RegisterPeginParams } from './registerPegin'
import {
  type CaptchaTokenResolver, type FlyoverConfig,
  getHttpClient, type HttpClient, isBtcAddress, isRskAddress, isSecureUrl,
  type Network, type BlockchainConnection, type Bridge, type BridgeMetadata
} from '@rsksmart/bridges-core-sdk'
import { FlyoverError } from '../client/httpClient'
import { getMetadata } from './getMetadata'
import { supportsConversion } from './supportsConversion'
import { getPeginStatus } from './getPeginStatus'
import { getPegoutStatus } from './getPegoutStatus'
import { FlyoverNetworks, type FlyoverSupportedNetworks } from '../constants/networks'
import { getAvailableLiquidity } from './getAvailableLiquidity'
import { RskBridge } from '../blockchain/bridge'
import { validatePeginTransaction, type ValidatePeginTransactionOptions, type ValidatePeginTransactionParams } from './validatePeginTransaction'
import { type IsQuotePaidResponse, isQuotePaid, type TypeOfOperation } from './isQuotePaid'

/** Class that represents the entrypoint to the Flyover SDK */
export class Flyover implements Bridge {
  private liquidityProvider?: LiquidityProvider
  private liquidityBridgeContract?: LiquidityBridgeContract
  private rskBridge?: RskBridge
  private readonly httpClient: HttpClient
  private lastPeginQuote: Quote | null
  private lastPegoutQuote: PegoutQuote | null

  /**
   * Create a Flyover client instance.
   *
   * @param { FlyoverConfig } config Object that holds the connection configuration
   */
  constructor (
    private readonly config: FlyoverConfig
  ) {
    config.allowInsecureConnections ??= false
    config.disableChecksum ??= false
    this.httpClient = getHttpClient(config.captchaTokenResolver)
    this.lastPeginQuote = null
    this.lastPegoutQuote = null
  }

  static createForNetwork (network: Network, captchaResolver: CaptchaTokenResolver, provider?: LiquidityProvider): Flyover {
    const flyover = new Flyover({ network, captchaTokenResolver: captchaResolver })
    if (provider !== undefined) {
      flyover.useLiquidityProvider(provider)
    }
    return flyover
  }

  /**
   * Get list of liquidity providers that can be set to the client. For executing this method
   * is required to have an active connection to RSK network. It can be provided on initial
   * configuration or using {@link Flyover.connectToRsk}
   *
   * @returns { LiquidityProvider[] } Providers list
   */
  async getLiquidityProviders (): Promise<LiquidityProvider[]> {
    this.checkLbc()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getProviders(this.httpClient, this.liquidityBridgeContract!)
  }

  /**
   * Get available quotes for given parameters
   *
   * @param { QuoteRequest } quoteRequest Quote request to compute available quotes
   *
   * @returns { Quote[] } List of available quotes
   *
   * @throws { Error } When provider has not been set in the Flyover instance
   *
   * @throws { Error } When quoteRequest has missing fields
   *
   * @example
   *
   * flyover.useProvider(provider)
   * await flyover.getQuotes(quoteRequest)
   */
  async getQuotes (quoteRequest: PeginQuoteRequest): Promise<Quote[]> {
    this.checkLiquidityProvider()
    this.checkLbc()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const quotes = await getQuote(this.config, this.httpClient, this.liquidityBridgeContract!, this.liquidityProvider!, quoteRequest)
    this.lastPeginQuote = quotes.at(0) ?? null
    return quotes
  }

  /**
   * Accept a specific pegin quote
   *
   * @param { Quote } quote Quote to be accepted
   *
   * @returns { AcceptedQuote } Accepted quote with confirmation data
   *
   * @throws { Error } When provider has not been set in the Flyover instance
   *
   * @throws { Error } When quote has missing fields
   *
   * @example
   *
   * flyover.useProvider(provider)
   * const quotes = await flyover.getQuotes(quoteRequest)
   * await flyover.acceptQuote(quotes[0])
   */
  async acceptQuote (quote: Quote): Promise<AcceptedQuote> {
    this.checkLiquidityProvider()
    this.checkLbc()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return acceptQuote(this.httpClient, this.liquidityBridgeContract!, this.liquidityProvider!, quote)
  }

  /**
   * Get available pegout quotes for given parameters
   *
   * @param { PegoutQuoteRequest } quoteRequest Quote request to compute available quotes
   *
   * @returns { PegoutQuote[] } List of available quotes
   *
   * @throws { Error } When provider has not been set in the Flyover instance
   *
   * @throws { Error } When quoteRequest has missing fields
   *
   * @example
   *
   * flyover.useProvider(provider)
   * await flyover.getPegoutQuotes(quoteRequest)
   */
  async getPegoutQuotes (quoteRequest: PegoutQuoteRequest): Promise<PegoutQuote[]> {
    this.checkLiquidityProvider()
    this.checkLbc()
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const quotes = await getPegoutQuote(this.config, this.httpClient, this.liquidityBridgeContract!, this.liquidityProvider!, quoteRequest)
      this.lastPegoutQuote = quotes.at(0) ?? null
      return quotes
    } catch (e) {
      return processError(e)
    }
  }

  /**
     * Accept a specific pegout quote
     *
     * @param { PegoutQuote } quote Pegout quote to be accepted
     *
     * @returns { AcceptedPegoutQuote } Accepted quote with confirmation data
     *
     * @throws { Error } When provider has not been set in the Flyover instance
     *
     * @throws { Error } When quote has missing fields
     *
     * @example
     *
     * flyover.useProvider(provider)
     * const quotes = await flyover.getPegoutQuotes(quoteRequest)
     * await flyover.acceptPegoutQuote(quotes[0])
     */
  async acceptPegoutQuote (quote: PegoutQuote): Promise<AcceptedPegoutQuote> {
    this.checkLiquidityProvider()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return acceptPegoutQuote(this.httpClient, this.liquidityProvider!, quote)
  }

  /**
   * Set provider whose LPS will be used to get/accept quotes
   *
   * @param { LiquidityProvider } provider Provider to use its apiBaseUrl
   */
  useLiquidityProvider (provider: LiquidityProvider): void {
    this.liquidityProvider = provider
    this.lastPeginQuote = null
    this.lastPegoutQuote = null
  }

  /**
   * Change client network after instantiating it. Useful if plan to switch networks between operations
   *
   * @param { Network } network New network to use
   */
  setNetwork (network: Network): void {
    if (FlyoverNetworks[network as FlyoverSupportedNetworks] === undefined) {
      throw FlyoverError.withReason('unsupported network')
    }
    this.config.network = network
  }

  /**
   * Generate QR code for given address. The supported networks are Bitcoin and RSK
   *
   * @param { string } address Adrress to generate QR code from
   * @param { string } amount Amount to use ex. "1.405"
   * @param { string } blockchain Blockchain to use for QR code
   *
   */
  async generateQrCode (
    address: string,
    amount: string,
    blockchain: string
  ): Promise<string> {
    if (!(isRskAddress(address) || isBtcAddress(address))) {
      throw new Error('Only Bitcoin and RSK addresses are supported')
    }
    let text = `${blockchain}:${address}`

    const encodedAmount = encodeURIComponent(amount.toString())
    text += `?amount=${encodedAmount}`

    try {
      const qrCodeUrl = await toDataURL(text.toString())
      return qrCodeUrl
    } catch (err) {
      throw new Error('Error generating QR code')
    }
  }

  /**
   * Checks if Flyover object has an active connection with the RSK network
   * @returns boolean
   */
  async isConnected (): Promise<boolean> {
    const height = await this.config.rskConnection?.getChainHeight()
    return height !== undefined && height !== 0
  }

  /**
   * Connects Flyover to RSK network. It is useful if connetion wasn't provided on initial configuration
   *
   * @param { BlockchainConnection } rskConnection object representing connection to the network
   * @throws { Error } If Flyover already has a connection to the network
   */
  async connectToRsk (rskConnection: BlockchainConnection): Promise<void> {
    if (this.config.rskConnection !== undefined) {
      throw new Error('already connected to Rsk network')
    }
    this.config.rskConnection = rskConnection
  }

  /**
   * Executes the depositPegout function of Liquidity Bridge Contract. For executing this method is required to have an active
   * connection to RSK network. It can be provided on initial configuration or using {@link Flyover.connectToRsk}
   *
   * @param { PegoutQuote } quote the quote of the pegout that is going to be deposited
   * @param { string } signature accepted quote signed by liquidity provider
   * @param { bigint } amount the amount to deposit. Should be the sum of the value to pegout plus all the fees
   *
   * @throws { Error } If not connected to RSK
   *
   * @returns string the transaction hash
   */
  async depositPegout (quote: PegoutQuote, signature: string, amount: bigint): Promise<string> {
    this.checkLbc()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return processError(depositPegout(quote, signature, amount, this.liquidityBridgeContract!))
  }

  /**
   * Executes the refundUserPegout function of Liquidity Bridge Contract. For executing this method is required to have an active
   * connection to RSK network. It can be provided on initial configuration or using {@link Flyover.connectToRsk}
   *
   * @param { PegoutQuote } quote the quote of the pegout that is being refunded
   *
   * @throws { Error } If not connected to RSK
   *
   * @returns string the transaction hash
   */
  async refundPegout (quote: PegoutQuote): Promise<string> {
    this.checkLbc()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return processError(refundPegout(quote, this.liquidityBridgeContract!))
  }

  /**
   * Registers a peg-in transaction with the bridge and pays to the involved parties
   * @param { RegisterPeginParams } params Object with all parameters required by the contract
   *
   * @throws { Error } If not connected to RSK
   * @throws { FlyoverError } If there was an error during transaction execution
   *
   * @returns string the transaction hash
   */
  async registerPegin (params: RegisterPeginParams): Promise<string> {
    this.checkLbc()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return processError(registerPegin(params, this.liquidityBridgeContract!))
  }

  /**
   * Disconnects from RSK network, removing BlockchainConnection object from Flyover and also current LiquidityProvider
   */
  disconnectFromRsk (): void {
    this.liquidityBridgeContract = undefined
    this.config.rskConnection = undefined
    this.liquidityProvider = undefined
  }

  private checkLiquidityProvider (): void {
    if (this.liquidityProvider === undefined) {
      throw new Error('You need to select a provider to do this operation')
    } else if (this.config.allowInsecureConnections !== true && !isSecureUrl(this.liquidityProvider.apiBaseUrl)) {
      throw new Error('Provider API base URL is not secure. Please enable insecure connections on Flyover configuration')
    }
  }

  private checkLbc (): void {
    if (this.config.rskConnection === undefined) {
      throw new Error('Not connected to RSK')
    } else if (this.liquidityBridgeContract === undefined) {
      this.liquidityBridgeContract = new LiquidityBridgeContract(this.config.rskConnection, this.config)
    }
  }

  private ensureRskBridge (): void {
    if (this.config.rskConnection === undefined) {
      throw new Error('Not connected to RSK')
    } else if (this.rskBridge === undefined) {
      this.rskBridge = new RskBridge(this.config.rskConnection)
    }
  }

  /**
   * Returns array of all users quotes with deposits. Requires a provider to be selected, and user address as parameter
   *
   * @param { string } address user RSK address
   *
   * @throws { Error } If not connected to RSK
   *
   * @returns { DepositEvent[] }
   */
  async getUserQuotes (address: string): Promise<DepositEvent[]> {
    this.checkLiquidityProvider()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getUserQuotes(this.httpClient, this.liquidityProvider!, address)
  }

  supportsConversion (fromToken: string, toToken: string): boolean {
    return supportsConversion(fromToken, toToken)
  }

  async getMetadata (): Promise<BridgeMetadata[]> {
    if (this.liquidityProvider == null) {
      throw FlyoverError.withReason('You need to select a provider to fetch the metadata')
    }
    this.checkLbc()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getMetadata(this.liquidityProvider, this.liquidityBridgeContract!, this.lastPeginQuote, this.lastPegoutQuote)
  }

  supportsNetwork (chainId: number): boolean {
    return Object.values(FlyoverNetworks).some(network => network.chainId === chainId)
  }

  getSelectedLiquidityProvider (): LiquidityProvider | undefined {
    return this.liquidityProvider
  }

  /**
   * Returns the information of an accepted pegin quote. This involves the details of the quote
   * and information about its current status in the sever such as the state and the involved
   * transactions hashes
   *
   * @remarks
   * If you want to have a simplified version of the state of the quote to display as a status in
   * a client UI, you can use the {@link getSimpleQuoteStatus} function
   * This function implies trusting the LPS to provide the correct status of the quote and should
   * be used  with caution since is not a reliable source of truth.
   *
   * @param { string } quoteHash the has of the quote
   *
   * @throws { Error } If quote wasn't accepted or doesn't exist
   *
   * @returns { PeginQuoteStatus }
   */
  async getPeginStatus (quoteHash: string): Promise<PeginQuoteStatus> {
    this.checkLiquidityProvider()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getPeginStatus(this.httpClient, this.liquidityProvider!, quoteHash)
  }

  /**
   * Checks if a quote has been paid by the LPS. The information is initially provided by the LPS and then
   * verified in the blockchain depending on the type of operation (RSK for pegin or Bitcoin for pegout).
   * This function requires that the LPS associated with this quote has been previously selected using the {@link Flyover.useLiquidityProvider} method.
   *
   * @param { string } quoteHash the has of the quote
   * @param { TypeOfOperation } typeOfOperation the type of operation (pegin or pegout)
   *
   * @returns { IsQuotePaidResponse }
   */
  async isQuotePaid (quoteHash: string, typeOfOperation: TypeOfOperation): Promise<IsQuotePaidResponse> {
    this.checkLiquidityProvider()

    if (!await this.isConnected()) {
      throw new Error('Before calling isQuotePaid, you need to connect to RSK using Flyover.connectToRsk')
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return isQuotePaid(this.httpClient, this.liquidityProvider!, quoteHash, this.config.rskConnection!, typeOfOperation, this.config.network)
  }

  /**
   * Returns the information of an accepted pegout quote. This involves the details of the quote
   * and information about its current status in the sever such as the state and the involved
   * transactions hashes
   *
   * @remarks
   * If you want to have a simplified version of the state of the quote to display as a status in
   * a client UI, you can use the {@link getSimpleQuoteStatus} function.
   * This function implies trusting the LPS to provide the correct status of the quote and should
   * be used  with caution since is not a reliable source of truth.
   *
   * @param { string } quoteHash the has of the quote
   *
   * @throws { Error } If quote wasn't accepted or doesn't exist
   *
   * @returns { PegoutQuoteStatus }
   */
  async getPegoutStatus (quoteHash: string): Promise<PegoutQuoteStatus> {
    this.checkLiquidityProvider()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getPegoutStatus(this.httpClient, this.liquidityProvider!, quoteHash)
  }

  /**
   * Returns the available liquidity of the selected provider for both pegin and pegout operations.
   * This feature might be disabled by the provider for privacy reasons
   *
   * @throws { FlyoverError } If the feature was disabled by the provider
   *
   * @returns { AvailableLiquidity }
   */
  async getAvailableLiquidity (): Promise<AvailableLiquidity> {
    this.checkLiquidityProvider()
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return getAvailableLiquidity(this.httpClient, this.liquidityProvider!)
  }

  /**
   * Checks if a Bitcoin transaction is valid for a specific PegIn. This check involves the following conditions:
   * - The transaction is a well formed Bitcoin transaction
   * - The transaction sends the expected amount of satoshis to the correct address according to the quote
   * - The address in the transaction is the specific address derived for that quote
   * - All the UTXOs sent to the derivation address are above the RSK Bridge minimum
   * - (Optional) The validation is being done before the quote expiration
   *
   * This function can be used either before or after of funding and signing the transaction.
   *
   * @param { ValidatePeginTransactionParams } params The parameters required for the validation
   * @param { ValidatePeginTransactionOptions } options The options for the validation
   *
   * @throws { FlyoverError } If {@link options.throwError} is true and the validation fails
   *
   * @returns { string } The error message if the validation fails and {@link options.throwError} is false
   */
  async validatePeginTransaction (params: ValidatePeginTransactionParams, options?: ValidatePeginTransactionOptions): Promise<string> {
    this.checkLbc()
    this.checkLiquidityProvider()
    this.ensureRskBridge()
    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    return validatePeginTransaction({
      config: this.config,
      bridge: this.rskBridge!,
      lbc: this.liquidityBridgeContract!,
      provider: this.liquidityProvider!
    }, params, options)
    /* eslint-enable @typescript-eslint/no-non-null-assertion */
  }
}
