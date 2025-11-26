import { BytesLike, Contract, utils } from "ethers"
import abi from './pegout-abi'
import { callContractFunction, Connection, decodeBtcAddress, executeContractFunction, executeContractView, FlyoverConfig, isRskAddress, TxResult } from "@rsksmart/bridges-core-sdk"
import { Quotes } from "./bindings/Pegout"
import { type PegoutQuoteDetail, type PegoutQuote } from '../api'
import { FlyoverNetworks, FlyoverSupportedNetworks } from "../constants/networks"
import { validateNotPaused } from "./lbc"

export class PegOutContract {
  private readonly pegoutContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegOutContractAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid address')
    }
    const pegoutContract = new Contract(address, abi, rskConnection.getAbstraction())
    this.pegoutContract = pegoutContract
  }

  async getAddress (): Promise<string> {
    return this.pegoutContract.getAddress()
  }

  async getProductFeePercentage (): Promise<number> {
    return executeContractView<number>(this.pegoutContract, 'getFeePercentage')
  }

  /**
   * Executes the refundUserPegOut function in the LiquidityBridge contract
   * @param quote the pegout quote to refund
   * @param operationType the type of operation to perform, 'staticCall' or 'execution'. Default is 'execution'
   * @returns { TxResult | null } If operationType is 'execution' returns the transaction result, otherwise returns null
   */
  async refundPegout (quote: PegoutQuote, operationType: 'staticCall' | 'execution' = 'execution'): Promise<TxResult | null> {
    await validateNotPaused(this.pegoutContract)
    const hashBytes = utils.arrayify('0x' + quote.quoteHash)
    if (operationType === 'execution') {
      return executeContractFunction(this.pegoutContract, 'refundUserPegOut', hashBytes)
    } else if (operationType === 'staticCall') {
      await callContractFunction(this.pegoutContract, 'refundUserPegOut', hashBytes)
      return null
    } else {
      throw new Error('Unsupported operation type')
    }
  }

  async hashPegoutQuote (quote: PegoutQuote): Promise<string> {
    const bytes = await executeContractView<BytesLike>(this.pegoutContract, 'hashPegOutQuote', this.toContractPegoutQuote(quote.quote))
    const result = utils.hexlify(bytes)
    return result.startsWith('0x') ? result.slice(2) : result
  }

  async depositPegout (quote: PegoutQuote, signature: string, weiAmount: bigint): Promise<TxResult> {
    await validateNotPaused(this.pegoutContract)
    const detail: PegoutQuoteDetail = quote.quote
    const signatureBytes = utils.arrayify('0x' + signature)
    const lbcPegoutQuote: Quotes.PegOutQuoteStruct = this.toContractPegoutQuote(detail)
    return executeContractFunction(this.pegoutContract, 'depositPegOut', lbcPegoutQuote, signatureBytes, { value: weiAmount })
  }

  async isPegOutQuoteCompleted (quoteHash: string): Promise<boolean> {
    const hashBytes = utils.arrayify('0x' + quoteHash)
    return executeContractView(this.pegoutContract, 'isQuoteCompleted', hashBytes)
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
      depositAddress: decodeBtcAddress(detail.depositAddr),
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
}
