import { assertTruthy, BlockchainConnection, Connection, FlyoverConfig } from "@rsksmart/bridges-core-sdk";
import { LiquidityProvider, PegoutQuote, Quote } from "../api";
import { FlyoverError } from "../client/httpClient";
import { LiquidityBridgeContract } from "../blockchain/lbc";
import { isPeginQuote } from "../utils/quote";
import { remove0x } from "../utils/parsing";

export async function signQuote (
    config: FlyoverConfig, // TODO replace with FlyoverSDKContext when refund feature is merged to master
    lbc: LiquidityBridgeContract,
    lp: LiquidityProvider,
    quote: Quote|PegoutQuote
): Promise<string> {
    const connection = config.rskConnection
    assertTruthy(connection, 'Rsk connection is not set')
    canSign(connection)
    const hash = await hashQuote(lbc, quote)
    if (hash !== quote.quoteHash) {
        throw FlyoverError.invalidQuoteHashError(lp.apiBaseUrl)
    }
    const hashBytes = Buffer.from(quote.quoteHash, 'hex')
    const signature = await connection.signer.signMessage(hashBytes)
    return remove0x(signature)
}

function canSign(connection: Connection): asserts connection is BlockchainConnection {
    if (!('signer' in connection) || !connection.signer) {
        throw FlyoverError.withReason('the current connection does not support signing')
    }
}

function hashQuote(lbc: LiquidityBridgeContract, quote: Quote|PegoutQuote): Promise<string> {
    return isPeginQuote(quote) ? lbc.hashPeginQuote(quote) : lbc.hashPegoutQuote(quote)
}
