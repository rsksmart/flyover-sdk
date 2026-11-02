import { type Connection, executeContractView } from '@rsksmart/bridges-core-sdk'
import { Contract, type BigNumber } from 'ethers'

export class RskBridge {
  private static readonly BRIDGE_ADDRESS = '0x0000000000000000000000000000000001000006'
  private static readonly BRIDGE_ABI = [
    'function getMinimumLockTxValue() external view returns (int256)'
  ]

  private readonly bridge: Contract

  constructor (rskConnection: Connection) {
    this.bridge = new Contract(
      RskBridge.BRIDGE_ADDRESS,
      RskBridge.BRIDGE_ABI,
      rskConnection.getAbstraction()
    )
  }

  async getMinimumLockTxValue (): Promise<bigint> {
    const result = await executeContractView<BigNumber>(this.bridge, 'getMinimumLockTxValue')
    return result.toBigInt()
  }
}
