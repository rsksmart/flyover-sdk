import { type Connection, type HttpClient, type FlyoverConfig } from '@rsksmart/bridges-core-sdk'
import { type RskBridge } from '../blockchain/bridge'
import { type LiquidityBridgeContract } from '../blockchain/lbc'
import { type LiquidityProvider } from '../index'
import { type FlyoverSDKError } from '../constants/errors'
import { type BitcoinDataSource } from '../bitcoin/BitcoinDataSource'

export interface FlyoverSDKContext {
  config: FlyoverConfig
  lbc?: LiquidityBridgeContract
  provider?: LiquidityProvider
  bridge?: RskBridge
  httpClient: HttpClient
  rskConnection?: Connection
  btcConnection?: BitcoinDataSource
}

export interface IsQuotePaidResponse {
  isPaid: boolean
  error?: FlyoverSDKError
}

export interface IsQuoteRefundableResponse {
  isRefundable: boolean
  error?: FlyoverSDKError
}
