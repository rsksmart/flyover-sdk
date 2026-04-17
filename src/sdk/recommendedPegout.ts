import { validateRequiredFields } from "@rsksmart/bridges-core-sdk"
import { RecommendedOperation, Routes } from "../api"
import { FlyoverSDKContext } from "../utils/interfaces"
import { BTC_ADDRESS_TYPES, BtcAddressType } from "../bitcoin/address"
import { FlyoverError } from "../client/httpClient"

/** Type that holds extra arguments that, if provided, can increase the accuracy of the estimation of the recommended pegin */
export interface RecommendedPegoutExtraArgs {
    /** Pegout BTC destination address type. Must be one of: p2pkh, p2sh, p2wpkh, p2wsh, p2tr */
    destinationAddressType: BtcAddressType
}

export async function estimateRecommendedPegout(
    context: FlyoverSDKContext,
    amount: bigint,
    extraArgs: Partial<RecommendedPegoutExtraArgs>,
): Promise<RecommendedOperation> {
    validateRequiredFields({ amount }, 'amount')
    if (!context.provider) {
        throw new Error('Expected provider to be set')
    }
    const url = new URL(context.provider.apiBaseUrl + Routes.recommendedPegout)
    url.searchParams.append('amount', amount.toString())
    appendAddressType(url, extraArgs.destinationAddressType)
    const result = await context.httpClient.get<RecommendedOperation>(url.toString())
    return result
}

function appendAddressType(
    url: URL,
    addressType: string|undefined
) {
    if (!addressType) {
        return
    }
    if (!BTC_ADDRESS_TYPES.includes(addressType.toLowerCase() as BtcAddressType)) {
        throw FlyoverError.withReason("invalid btc address type")
    }
    url.searchParams.append('destination_type', addressType)
}
