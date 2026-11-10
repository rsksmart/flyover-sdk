import { assertTruthy, BlockchainConnection, Connection, FlyoverConfig } from "@rsksmart/bridges-core-sdk";
import { LiquidityProvider, PegoutQuote } from "../api";
import { FlyoverError } from "../client/httpClient";
import { LiquidityBridgeContract } from "../blockchain/lbc";
import { remove0x } from "../utils/parsing";
import { TypedDataSigner } from "@ethersproject/abstract-signer";
import { ensureHexPrefix } from "../utils/format";

export async function signQuote (
    config: FlyoverConfig, // TODO replace with FlyoverSDKContext when refund feature is merged to master
    lbc: LiquidityBridgeContract,
    lp: LiquidityProvider,
    quote: PegoutQuote
): Promise<string> {
    const connection = config.rskConnection
    assertTruthy(connection, 'Rsk connection is not set')
    canSign(connection)
    const signature = await signPegoutQuote(connection.signer as unknown as TypedDataSigner, lp, lbc, quote)
    return remove0x(signature)
}

function canSign(connection: Connection): asserts connection is BlockchainConnection {
    if (!('signer' in connection) || !connection.signer) {
        throw FlyoverError.withReason('the current connection does not support signing')
    }
}

async function signPegoutQuote(
    signer: TypedDataSigner,
    lp: LiquidityProvider,
    lbc: LiquidityBridgeContract,
    quote: PegoutQuote,
): Promise<string> {
    const quoteHash = await lbc.pegOutContract.hashPegoutQuote(quote)
    if (quoteHash !== quote.quoteHash) {
        throw FlyoverError.invalidQuoteHashError(lp.apiBaseUrl)
    }
    const domain = await lbc.pegOutContract.getEip712Domain()
    if (BigInt(domain.chainId) !== BigInt(quote.quote.chainId)) {
        throw FlyoverError.withReason('Chain id of domain does not match chain id of quote')
    }
    const signature = await signer._signTypedData(
        domain,
        {
            PegOutQuote: [
                { name: 'liquidityProvider', type: 'address' },
                { name: 'quoteHash', type: 'bytes32' },
            ]
        },
        {
            liquidityProvider: quote.quote.liquidityProviderRskAddress,
            quoteHash: ensureHexPrefix(quoteHash),
        }
    )
    return signature
}
