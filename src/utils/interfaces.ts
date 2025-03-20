import { type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { type RskBridge } from '../blockchain/bridge'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type LiquidityProvider } from '../index'
import { type FlyoverSDKError } from '../constants/errors'

export interface FlyoverSDKContext {
  config: FlyoverConfig
  lbc: LiquidityBridgeContract
  provider: LiquidityProvider
  bridge: RskBridge
}

export interface IsQuotePaidResponse {
  isPaid: boolean
  error?: FlyoverSDKError
}
