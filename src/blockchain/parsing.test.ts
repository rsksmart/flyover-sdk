import { describe, test, expect } from '@jest/globals'
import { parsePegInContractLogs } from './parsing'
import { type ContractReceipt, BigNumber } from 'ethers'

describe('parsePegInContractLogs function should', () => {
  const FAKE_CALL_FOR_USER_TX_HASH = '0x3ba2b1337bda32785d38c53274ddeac570911c69aed5ee7ed74e7b14fd5d87a6'

  const mockTxReceipt: ContractReceipt = {
    to: '0x8901a2Bbf639bFD21A97004BA4D7aE2BD00B8DA8',
    from: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
    contractAddress: '0x0000000000000000000000000000000000000000',
    transactionIndex: 0,
    gasUsed: BigNumber.from(21000),
    logsBloom: '0x0',
    blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02',
    transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
    logs: [
      {
        transactionIndex: 0,
        blockNumber: 106,
        transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
        address: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
        topics: [
          '0x8e51a4493a6f66c76e13fd9e3b754eafbfe21343c04508deb61be8ccc0064587',
          '0x000000000000000000000000dd2fd4581271e230360230f9337d5c0430bf44c0',
          '0x0000000000000000000000000000000000000000000000000853a0d2313c0000'
        ],
        data: '0x',
        logIndex: 0,
        blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02',
        removed: false
      },
      {
        transactionIndex: 0,
        blockNumber: 106,
        transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
        address: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
        topics: [
          '0x29a638a7bf9fc6a3c0bdf6ad339d1bba4555c740f5f80ddd3747cfe8dae172d9',
          '0x000000000000000000000000dd2fd4581271e230360230f9337d5c0430bf44c0',
          '0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266',
          '0xe0a85600e505bedc407c93b71ec8c3f0cdda6e570ebe2119a8c0156d841496ca'
        ],
        data: '0x00000000000000000000000000000000000000000000000000000000000052080000000000000000000000000000000000000000000000000853a0d2313c0000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000',
        logIndex: 1,
        blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02',
        removed: false
      },
    ],
    blockNumber: 106,
    confirmations: 1,
    cumulativeGasUsed: BigNumber.from(21000),
    effectiveGasPrice: BigNumber.from(1000000000),
    status: 1,
    type: 0,
    byzantium: true
  }

  test('parse all logs correctly', async () => {
    const parsedLogs = await parsePegInContractLogs(mockTxReceipt)

    expect(parsedLogs).toHaveLength(2)
    expect(parsedLogs[0]).toBeDefined()
    expect(parsedLogs[1]).toBeDefined()

    // Check BalanceDecrease log
    const balanceDecreaseLog = parsedLogs[0]
    expect(balanceDecreaseLog?.name).toBe('BalanceDecrease')
    expect(balanceDecreaseLog?.signature).toBe('BalanceDecrease(address,uint256)')
    expect(balanceDecreaseLog?.topic).toBe('0x8e51a4493a6f66c76e13fd9e3b754eafbfe21343c04508deb61be8ccc0064587')
    expect(balanceDecreaseLog?.args[0]).toBe('0xdD2FD4581271e230360230F9337D5c0430Bf44C0')
    expect(balanceDecreaseLog?.args[1].toHexString()).toBe('0x0853a0d2313c0000')

    // Check CallForUser log
    const callForUserLog = parsedLogs[1]
    expect(callForUserLog?.name).toBe('CallForUser')
    expect(callForUserLog?.signature).toBe('CallForUser(address,address,bytes32,uint256,uint256,bytes,bool)')
    expect(callForUserLog?.topic).toBe('0x29a638a7bf9fc6a3c0bdf6ad339d1bba4555c740f5f80ddd3747cfe8dae172d9')
    expect(callForUserLog?.args[0]).toBe('0xdD2FD4581271e230360230F9337D5c0430Bf44C0')
    expect(callForUserLog?.args[1]).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    expect(callForUserLog?.args[2].toLowerCase()).toBe('0xe0a85600e505bedc407c93b71ec8c3f0cdda6e570ebe2119a8c0156d841496ca')
    expect(callForUserLog?.args[3].toHexString()).toBe('0x5208')
    expect(callForUserLog?.args[4].toHexString()).toBe('0x0853a0d2313c0000')
    expect(callForUserLog?.args[5]).toBe('0x')
    expect(callForUserLog?.args[6]).toBe(true)
  })

  test('handle invalid logs gracefully', async () => {
    const invalidReceipt: ContractReceipt = {
      ...mockTxReceipt,
      logs: [
        {
          transactionIndex: 0,
          blockNumber: 106,
          transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
          address: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
          topics: ['0xinvalidtopic'],
          data: '0x',
          logIndex: 0,
          blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02',
          removed: false
        }
      ]
    }

    const parsedLogs = await parsePegInContractLogs(invalidReceipt)
    expect(parsedLogs).toHaveLength(0) // Should filter out invalid logs
  })

  test('handle empty logs array', async () => {
    const emptyReceipt: ContractReceipt = {
      ...mockTxReceipt,
      logs: []
    }

    const parsedLogs = await parsePegInContractLogs(emptyReceipt)
    expect(parsedLogs).toHaveLength(0)
  })
})
