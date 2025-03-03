import lbcAbi from './lbc-abi'
import { type ContractReceipt, utils } from 'ethers'
import { type LogDescription } from 'ethers/lib/utils'

export async function parseLBCLogs (receipt: ContractReceipt):
Promise<Array<LogDescription | null>> {
  // Create an Interface directly from the ABI
  const iface = new utils.Interface(lbcAbi)

  // Parse the logs using the interface
  const parsedLogs = receipt.logs.map(log => {
    try {
      return iface.parseLog(log)
    } catch (e) {
      return null
    }
  }).filter(Boolean)

  return parsedLogs
}
