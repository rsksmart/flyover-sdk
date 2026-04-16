import { isRskAddress, validateRequiredFields } from "@rsksmart/bridges-core-sdk"
import { RecommendedOperation, Routes } from "../api"
import { FlyoverSDKContext } from "../utils/interfaces"
import { isHex } from "../utils/validation"
import { FlyoverError } from "../client/httpClient"

/** Type that holds extra arguments that, if provided, can increase the accuracy of the estimation of the recommended pegin */
export interface RecommendedPeginExtraArgs {
    /** Data to be executed in the RSK transaction on behalf of the user */
    data: string
    /** Destination address of the pegin */
    destinationAddress: string
}

export async function estimateRecommendedPegin(
    context: FlyoverSDKContext,
    amount: bigint,
    extraArgs: Partial<RecommendedPeginExtraArgs>,
): Promise<RecommendedOperation> {
    validateRequiredFields({ amount }, 'amount')
    if (!context.provider) {
        throw new Error('Expected provider to be set')
    }
    const url = new URL(context.provider.apiBaseUrl + Routes.recommendedPegin)
    url.searchParams.append('amount', amount.toString())
    appendData(url, extraArgs.data)
    appendDestinationAddress(url, extraArgs.destinationAddress)
    const result = await context.httpClient.get<RecommendedOperation>(url.toString())
    return result
}

function appendDestinationAddress(
    url: URL,
    destinationAddress: string|undefined
) {
    if (!destinationAddress) {
        return
    }
    if (!isRskAddress(destinationAddress)) {
        throw FlyoverError.invalidRskAddress(destinationAddress)
    }
    url.searchParams.append('destination_address', destinationAddress)
}

function appendData(
    url: URL,
    data: string|undefined
) {
    if (!data) {
        return
    }
    if (!isHex(data)) {
        throw FlyoverError.withReason("invalid data format")
    }
    url.searchParams.append('data', data)
}
