import { describe, test, expect } from '@jest/globals'
import { parseLBCLogs } from './parsing'
import { type ContractReceipt, BigNumber } from 'ethers'

describe('parseLBCLogs function should', () => {
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
          '0x42cfb81a915ac5a674852db250bf722637bee705a267633b68cab3a2dde06f53'
        ],
        data: '0x0000000000000000000000009d93929a9099be4355fc2389fbf253982f9df47c0000000000000000000000000000000000000000000000000000000000000000',
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
          '0x8e51a4493a6f66c76e13fd9e3b754eafbfe21343c04508deb61be8ccc0064587'
        ],
        data: '0x0000000000000000000000009d93929a9099be4355fc2389fbf253982f9df47c0000000000000000000000000000000000000000000000000853a0d2313c0000',
        logIndex: 1,
        blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02',
        removed: false
      },
      {
        transactionIndex: 0,
        blockNumber: 106,
        transactionHash: FAKE_CALL_FOR_USER_TX_HASH,
        address: '0x7557fcE0BbFAe81a9508FF469D481f2c72a8B5f3',
        topics: [
          '0xbfc7404e6fe464f0646fe2c6ab942b92d56be722bb39f8c6bc4830d2d32fb80d',
          '0x0000000000000000000000009d93929a9099be4355fc2389fbf253982f9df47c',
          '0x00000000000000000000000079568c2989232dca1840087d73d403602364c0d4'
        ],
        data: '0x00000000000000000000000000000000000000000000000000000000000052080000000000000000000000000000000000000000000000000853a0d2313c000000000000000000000000000000000000000000000000000000000000000000a00000000000000000000000000000000000000000000000000000000000000001618fef93a5054540f96de994b9d255ae1b2a79ca9fb45d629727c74807986bdc0000000000000000000000000000000000000000000000000000000000000000',
        logIndex: 2,
        blockHash: '0xa4c7dc1a908319aae8bdf264fb78bc1f2ad802bb1082f5732702cbab02f4cf02',
        removed: false
      }
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
    const parsedLogs = await parseLBCLogs(mockTxReceipt)

    expect(parsedLogs).toHaveLength(3)
    expect(parsedLogs[0]).toBeDefined()
    expect(parsedLogs[1]).toBeDefined()
    expect(parsedLogs[2]).toBeDefined()

    // Check BalanceIncrease log
    const balanceIncreaseLog = parsedLogs[0]
    expect(balanceIncreaseLog?.name).toBe('BalanceIncrease')
    expect(balanceIncreaseLog?.signature).toBe('BalanceIncrease(address,uint256)')
    expect(balanceIncreaseLog?.topic).toBe('0x42cfb81a915ac5a674852db250bf722637bee705a267633b68cab3a2dde06f53')
    expect(balanceIncreaseLog?.args[0]).toBe('0x9D93929A9099be4355fC2389FbF253982F9dF47c')
    expect(balanceIncreaseLog?.args[1].toHexString()).toBe('0x00')

    // Check BalanceDecrease log
    const balanceDecreaseLog = parsedLogs[1]
    expect(balanceDecreaseLog?.name).toBe('BalanceDecrease')
    expect(balanceDecreaseLog?.signature).toBe('BalanceDecrease(address,uint256)')
    expect(balanceDecreaseLog?.topic).toBe('0x8e51a4493a6f66c76e13fd9e3b754eafbfe21343c04508deb61be8ccc0064587')
    expect(balanceDecreaseLog?.args[0]).toBe('0x9D93929A9099be4355fC2389FbF253982F9dF47c')
    expect(balanceDecreaseLog?.args[1].toHexString()).toBe('0x0853a0d2313c0000')

    // Check CallForUser log
    const callForUserLog = parsedLogs[2]
    expect(callForUserLog?.name).toBe('CallForUser')
    expect(callForUserLog?.signature).toBe('CallForUser(address,address,uint256,uint256,bytes,bool,bytes32)')
    expect(callForUserLog?.topic).toBe('0xbfc7404e6fe464f0646fe2c6ab942b92d56be722bb39f8c6bc4830d2d32fb80d')
    expect(callForUserLog?.args[0]).toBe('0x9D93929A9099be4355fC2389FbF253982F9dF47c')
    expect(callForUserLog?.args[1]).toBe('0x79568c2989232dCa1840087D73d403602364c0D4')
    expect(callForUserLog?.args[2].toHexString()).toBe('0x5208')
    expect(callForUserLog?.args[3].toHexString()).toBe('0x0853a0d2313c0000')
    expect(callForUserLog?.args[4]).toBe('0x')
    expect(callForUserLog?.args[5]).toBe(true)
    expect(callForUserLog?.args[6]).toBe('0x618fef93a5054540f96de994b9d255ae1b2a79ca9fb45d629727c74807986bdc')
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

    const parsedLogs = await parseLBCLogs(invalidReceipt)
    expect(parsedLogs).toHaveLength(0) // Should filter out invalid logs
  })

  test('handle empty logs array', async () => {
    const emptyReceipt: ContractReceipt = {
      ...mockTxReceipt,
      logs: []
    }

    const parsedLogs = await parseLBCLogs(emptyReceipt)
    expect(parsedLogs).toHaveLength(0)
  })
})
