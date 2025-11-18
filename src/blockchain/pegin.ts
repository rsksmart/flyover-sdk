import { callContractFunction, Connection, decodeBtcAddress, executeContractFunction, executeContractView, FlyoverConfig, isRskAddress, TxResult } from "@rsksmart/bridges-core-sdk"
import { BytesLike, Contract, utils } from "ethers"
import abi from './pegin-abi'
import { type RegisterPeginLbcParams } from '../sdk/registerPegin'
import { ensureHexPrefix } from '../utils/format'
import { Quotes } from "./bindings/Pegin"
import { type Quote as PeginQuote, type QuoteDetail as PeginQuoteDetail } from '../api'
import { FlyoverNetworks, FlyoverSupportedNetworks } from "../constants/networks"

export class PegInContract {
  private readonly peginContract: Contract

  constructor (rskConnection: Connection, config: FlyoverConfig) {
    const address = FlyoverNetworks[config.network as FlyoverSupportedNetworks]?.pegInContractAddress
    if (address === undefined || !isRskAddress(address)) {
      throw new Error('invalid address')
    }
    const peginContract = new Contract(address, abi, rskConnection.getAbstraction())
    this.peginContract = peginContract
  }

  async getAddress (): Promise<string> {
    return this.peginContract.getAddress()
  }

  async validatePeginDepositAddress (quote: PeginQuote, depositAddress: string): Promise<boolean> {
    const lbcQuote = this.toContractPeginQuote(quote.quote)
    const parsedAddress = decodeBtcAddress(depositAddress, { keepChecksum: true })
    return executeContractView(this.peginContract, 'validatePegInDepositAddress', lbcQuote, parsedAddress)
  }

  async registerPegin (
    params: RegisterPeginLbcParams,
    action: 'staticCall' | 'execution' = 'execution'
  ): Promise<TxResult> {
    const { quote, signature, btcRawTransaction, partialMerkleTree, height } = params

    const signatureBytes = utils.arrayify(ensureHexPrefix(signature))
    const rawTxBytes = utils.arrayify(ensureHexPrefix(btcRawTransaction))
    const pmtBytes = utils.arrayify(ensureHexPrefix(partialMerkleTree))
    const contractQuote = this.toContractPeginQuote(quote.quote)

    if (action === 'execution') {
      return executeContractFunction(this.peginContract, 'registerPegIn',
        contractQuote, signatureBytes, rawTxBytes, pmtBytes, height)
    } else if (action === 'staticCall') {
      return callContractFunction(this.peginContract, 'registerPegIn',
        contractQuote, signatureBytes, rawTxBytes, pmtBytes, height
      )
    } else {
      throw new Error('Invalid action')
    }
  }

  async hashPeginQuote (quote: PeginQuote): Promise<string> {
    const bytes = await executeContractView<BytesLike>(this.peginContract, 'hashPegInQuote', this.toContractPeginQuote(quote.quote))
    const result = utils.hexlify(bytes)
    return result.startsWith('0x') ? result.slice(2) : result
  }

  async getProductFeePercentage (): Promise<number> {
    return executeContractView<number>(this.peginContract, 'getFeePercentage')
  }

  private toContractPeginQuote (detail: PeginQuoteDetail): Quotes.PegInQuoteStruct {
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
      data: detail.data.startsWith('0x') ? detail.data : '0x' + detail.data,
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
}
