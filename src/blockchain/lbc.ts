import { executeContractView } from "@rsksmart/bridges-core-sdk";
import { DiscoveryContract } from "./discovery";
import { PegInContract } from "./pegin";
import { PegOutContract } from "./pegout";
import { PegInAddressRegistryContract } from "./peginAddressRegistry";
import { FlyoverConfigurationsContract } from "./flyoverConfigurations";
import { BigNumberish, Contract } from "ethers"
import { FlyoverError } from "../client/httpClient";

export interface LiquidityBridgeContract {
    pegInContract:PegInContract
    pegOutContract:PegOutContract
    discoveryContract:DiscoveryContract
    // Commit-first peg-in contracts. Optional because they may not be deployed on
    // every network yet; instantiated lazily only when the commit-first methods are used.
    pegInAddressRegistry?:PegInAddressRegistryContract
    flyoverConfigurations?:FlyoverConfigurationsContract
}

export async function validateNotPaused(contract: Contract): Promise<void> {
    const [
        paused,
        reason,
        since,
    ] = await executeContractView<[boolean, string, BigNumberish]>(contract, 'pauseStatus')
    if (paused) {
        throw FlyoverError.protocolPaused({ reason, timestamp: Number(since) })
    }
}

export async function getEip712Domain(contract: Contract): Promise<{ name: string, version: string, chainId: bigint, verifyingContract: string }> {
    const [
        ,
        name,
        version,
        chainId,
        verifyingContract,
    ] = await executeContractView<
        [string, string, string, BigNumberish, string, string, BigNumberish[]]
    >(contract, 'eip712Domain')
    return { name, version, chainId: BigInt(chainId.toString()), verifyingContract }
}
