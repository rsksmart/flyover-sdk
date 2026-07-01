import { utils, Contract } from 'ethers'
import { isValidSignature, validateRequiredFields } from '@rsksmart/bridges-core-sdk'
import {
  type AcceptedPegoutQuote, type LiquidityProvider, type PegoutQuote,
  pegoutQuoteRequiredFields, pegoutQuoteDetailRequiredFields, providerRequiredFields
} from '../api'
import { AcceptPegoutResponseRequiredFields } from '../api/bindings/data-contracts'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { FlyoverError } from '../client/httpClient'
import { getQuoteTotal } from '../utils/quote'
import { toContractPegoutQuote } from '../blockchain/pegout'
import pegoutAbi from '../blockchain/pegout-abi'
import { isTextEqualNoCase } from '../utils/validation'

export interface PegoutPaymentData {
  to: string
  data: string
  value: bigint
}

export async function getPegoutPaymentData (
  lbc: LiquidityBridgeContract,
  provider: LiquidityProvider,
  quote: PegoutQuote,
  acceptedQuote: AcceptedPegoutQuote
): Promise<PegoutPaymentData> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(quote.quote, ...pegoutQuoteDetailRequiredFields)
  validateRequiredFields(acceptedQuote, ...AcceptPegoutResponseRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)

  const eip712Hash = await lbc.pegOutContract.hashPegoutQuoteEIP712(quote)
  if (!isValidSignature(provider.provider, eip712Hash, acceptedQuote.signature)) {
    throw FlyoverError.invalidSignatureError({
      serverUrl: provider.apiBaseUrl,
      address: quote.quote.liquidityProviderRskAddress,
      signature: acceptedQuote.signature
    })
  }

  // acceptedQuote.lbcAddress comes from the LP server's accept-response body and is NOT
  // covered by the EIP-712 signature, so it must be validated independently against the
  // trusted contract address the SDK obtained from its network configuration.
  const trustedLbcAddress = await lbc.pegOutContract.getAddress()
  if (!isTextEqualNoCase(acceptedQuote.lbcAddress, trustedLbcAddress)) {
    throw FlyoverError.untrustedLbcAddressError({
      serverUrl: provider.apiBaseUrl,
      received: acceptedQuote.lbcAddress,
      expected: trustedLbcAddress
    })
  }

  const contractQuote = toContractPegoutQuote(quote.quote)
  const signatureBytes = utils.arrayify('0x' + acceptedQuote.signature)
  const iface = new Contract('0x0000000000000000000000000000000000000000', pegoutAbi).interface
  const data = iface.encodeFunctionData('depositPegOut', [contractQuote, signatureBytes])

  return {
    to: acceptedQuote.lbcAddress,
    data,
    value: getQuoteTotal(quote)
  }
}
