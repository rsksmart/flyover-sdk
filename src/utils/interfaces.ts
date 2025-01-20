import { type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { type RskBridge } from '../blockchain/bridge'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type LiquidityProvider } from '../index'

export interface FlyoverSDKContext {
  config: FlyoverConfig
  lbc: LiquidityBridgeContract
  provider: LiquidityProvider
  bridge: RskBridge
}
