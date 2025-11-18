import { DiscoveryContract } from "./discovery";
import { PegInContract } from "./pegin";
import { PegOutContract } from "./pegout";

export interface LiquidityBridgeContract {
    pegInContract:PegInContract
    pegOutContract:PegOutContract
    discoveryContract:DiscoveryContract
}
