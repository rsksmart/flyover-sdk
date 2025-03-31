import { type BytesLike, Contract, utils } from 'ethers'
import abi from './lbc-abi'
import { FlyoverNetworks, type FlyoverSupportedNetworks } from '../constants/networks'
import { type PegoutQuoteDetail, type PegoutQuote, type Quote as PeginQuote, type QuoteDetail as PeginQuoteDetail, type LiquidityProviderBase } from '../api'
import { type QuotesV2 as Quotes, type LiquidityBridgeContractV2 as LBC } from './bindings/Lbc'
import { decodeBtcAddress, executeContractFunction, callContractFunction, executeContractView, type FlyoverConfig, isRskAddress, type Network, type BlockchainConnection, type TxResult } from '@rsksmart/bridges-core-sdk'
import { type RegisterPeginParams } from '../sdk/registerPegin'
import { ensureHexPrefix } from '../utils/format'

export class LiquidityBridgeContract {
  private readonly liquidityBridgeContract: Contract

  constructor (rskConnection: BlockchainConnection, config: FlyoverConfig) {
    const address = getLbcAddress(config.network, config.customLbcAddress)
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid address')
    }
    const lbc = new Contract(address, abi, rskConnection.signer)
    this.liquidityBridgeContract = lbc
  }

  async getAddress (): Promise<string> {
    return this.liquidityBridgeContract.getAddress()
  }

  async getProviders (): Promise<LiquidityProviderBase[]> {
    return executeContractView<LBC.LiquidityProviderStructOutput[]>(this.liquidityBridgeContract, 'getProviders')
      .then(liquidityProviders => liquidityProviders.map(lp => this.fromContractLiquidityProvider(lp)))
  }

  async depositPegout (quote: PegoutQuote, signature: string, weiAmount: bigint): Promise<TxResult> {
    const detail: PegoutQuoteDetail = quote.quote
    const signatureBytes = utils.arrayify('0x' + signature)
    const lbcPegoutQuote: Quotes.PegOutQuoteStruct = this.toContractPegoutQuote(detail)
    return executeContractFunction(this.liquidityBridgeContract, 'depositPegout', lbcPegoutQuote, signatureBytes, { value: weiAmount })
  }

  async refundPegout (quote: PegoutQuote): Promise<TxResult> {
    const hashBytes = utils.arrayify('0x' + quote.quoteHash)
    return executeContractFunction(this.liquidityBridgeContract, 'refundUserPegOut', hashBytes)
  }

  async hashPeginQuote (quote: PeginQuote): Promise<string> {
    const bytes = await executeContractView<BytesLike>(this.liquidityBridgeContract, 'hashQuote', this.toContractPeginQuote(quote.quote))
    const result = utils.hexlify(bytes)
    return result.startsWith('0x') ? result.slice(2) : result
  }

  async hashPegoutQuote (quote: PegoutQuote): Promise<string> {
    const bytes = await executeContractView<BytesLike>(this.liquidityBridgeContract, 'hashPegoutQuote', this.toContractPegoutQuote(quote.quote))
    const result = utils.hexlify(bytes)
    return result.startsWith('0x') ? result.slice(2) : result
  }

  async getProductFeePercentage (): Promise<number> {
    return executeContractView<number>(this.liquidityBridgeContract, 'productFeePercentage')
  }

  async registerPegin (
    params: RegisterPeginParams,
    action: 'staticCall' | 'execution' = 'execution'
  ): Promise<TxResult> {
    const { quote, signature, btcRawTransaction, partialMerkleTree, height } = params

    const signatureBytes = utils.arrayify(ensureHexPrefix(signature))
    const rawTxBytes = utils.arrayify(ensureHexPrefix(btcRawTransaction))
    const pmtBytes = utils.arrayify(ensureHexPrefix(partialMerkleTree))
    const contractQuote = this.toContractPeginQuote(quote.quote)

    if (action === 'execution') {
      return executeContractFunction(this.liquidityBridgeContract, 'registerPegIn',
        contractQuote, signatureBytes, rawTxBytes, pmtBytes, height)
    } else if (action === 'staticCall') {
      return callContractFunction(this.liquidityBridgeContract, 'registerPegIn',
        contractQuote, signatureBytes, rawTxBytes, pmtBytes, height
      )
    } else {
      throw new Error('Invalid action')
    }
  }

  async validatePeginDepositAddress (quote: PeginQuote, depositAddress: string): Promise<boolean> {
    const lbcQuote = this.toContractPeginQuote(quote.quote)
    const parsedAddress = decodeBtcAddress(depositAddress, { keepChecksum: true })
    return executeContractView(this.liquidityBridgeContract, 'validatePeginDepositAddress', lbcQuote, parsedAddress)
  }

  private toContractPegoutQuote (detail: PegoutQuoteDetail): Quotes.PegOutQuoteStruct {
    return {
      lbcAddress: detail.lbcAddress.toLowerCase(),
      lpRskAddress: detail.liquidityProviderRskAddress.toLowerCase(),
      btcRefundAddress: decodeBtcAddress(detail.btcRefundAddress),
      rskRefundAddress: detail.rskRefundAddress.toLowerCase(),
      lpBtcAddress: decodeBtcAddress(detail.lpBtcAddr),
      callFee: detail.callFee,
      penaltyFee: detail.penaltyFee,
      nonce: detail.nonce,
      deposityAddress: decodeBtcAddress(detail.depositAddr),
      value: detail.value,
      agreementTimestamp: detail.agreementTimestamp,
      depositDateLimit: detail.depositDateLimit,
      depositConfirmations: detail.depositConfirmations,
      transferConfirmations: detail.transferConfirmations,
      transferTime: detail.transferTime,
      expireDate: detail.expireDate,
      expireBlock: detail.expireBlocks,
      productFeeAmount: detail.productFeeAmount,
      gasFee: detail.gasFee
    }
  }

  private toContractPeginQuote (detail: PeginQuoteDetail): Quotes.PeginQuoteStruct {
    detail.data ||= '0x'
    return {
      fedBtcAddress: decodeBtcAddress(detail.fedBTCAddr).slice(1), // to remove version byte
      lbcAddress: detail.lbcAddr.toLowerCase(),
      liquidityProviderRskAddress: detail.lpRSKAddr.toLowerCase(),
      btcRefundAddress: decodeBtcAddress(detail.btcRefundAddr),
      rskRefundAddress: detail.rskRefundAddr.toLowerCase(),
      liquidityProviderBtcAddress: decodeBtcAddress(detail.lpBTCAddr),
      callFee: detail.callFee,
      penaltyFee: detail.penaltyFee,
      contractAddress: detail.contractAddr.toLowerCase(),
      data: detail.data,
      gasLimit: detail.gasLimit,
      nonce: detail.nonce,
      value: detail.value,
      agreementTimestamp: detail.agreementTimestamp,
      timeForDeposit: detail.timeForDeposit,
      callTime: detail.lpCallTime,
      depositConfirmations: detail.confirmations,
      callOnRegister: detail.callOnRegister,
      productFeeAmount: detail.productFeeAmount,
      gasFee: detail.gasFee
    }
  }

  private fromContractLiquidityProvider (lp: LBC.LiquidityProviderStructOutput): LiquidityProviderBase {
    return {
      apiBaseUrl: lp.apiBaseUrl,
      id: lp.id.toNumber(),
      name: lp.name,
      provider: lp.provider,
      providerType: lp.providerType,
      status: lp.status
    }
  }
}

function getLbcAddress (network: Network, customLbcAddress?: string): string | undefined {
  return network !== 'Regtest' ? FlyoverNetworks[network as FlyoverSupportedNetworks]?.lbcAddress : customLbcAddress ?? FlyoverNetworks[network]?.lbcAddress
}
