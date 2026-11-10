import { assertTruthy } from '@rsksmart/bridges-core-sdk'
import { type FlyoverNetworks } from '@rsksmart/flyover-sdk'

export interface IntegrationTestConfig {
  network: keyof typeof FlyoverNetworks
  testMnemonic: string
  providerId: number
  nodeUrl: string
  rskAddress: string
  btcAddress: string
  peginAmount: bigint
  pegoutAmount: bigint
  mempoolSpaceUrl: string
  testContractAddress: string
}

function getConfig (): IntegrationTestConfig {
  const {
    TEST_NETWORK: network,
    TEST_MNEMONIC: mnemonic,
    TEST_PROVIDER_ID: providerId,
    TEST_NODE_URL: nodeUrl,
    TEST_RSK_ADDRESS: rskAddress,
    TEST_BTC_ADDRESS: btcAddress,
    TEST_PEGIN_AMOUNT: peginAmount,
    TEST_PEGOUT_AMOUNT: pegoutAmount,
    TEST_MEMPOOL_SPACE_URL: mempoolSpaceUrl,
    TEST_CONTRACT_ADDRESS: testContractAddress
  } = process.env
  assertTruthy(mnemonic, 'Missing test configuration: TEST_MNEMONIC')
  assertTruthy(providerId, 'Missing test configuration: TEST_PROVIDER_ID')
  assertTruthy(nodeUrl, 'Missing test configuration: TEST_NODE_URL')
  assertTruthy(rskAddress, 'Missing test configuration: TEST_RSK_ADDRESS')
  assertTruthy(btcAddress, 'Missing test configuration: TEST_BTC_ADDRESS')
  assertTruthy(peginAmount, 'Missing test configuration: TEST_PEGIN_AMOUNT')
  assertTruthy(pegoutAmount, 'Missing test configuration: TEST_PEGOUT_AMOUNT')
  assertTruthy(mempoolSpaceUrl, 'Missing test configuration: TEST_MEMPOOL_SPACE_URL')
  assertTruthy(network, 'Missing test configuration: TEST_NETWORK')
  assertTruthy(testContractAddress, 'Missing test configuration: TEST_CONTRACT_ADDRESS')
  return {
    network: network as keyof typeof FlyoverNetworks,
    testMnemonic: mnemonic,
    providerId: Number(providerId),
    peginAmount: BigInt(peginAmount),
    pegoutAmount: BigInt(pegoutAmount),
    nodeUrl,
    rskAddress,
    btcAddress,
    mempoolSpaceUrl,
    testContractAddress
  }
}

export const integrationTestConfig = getConfig()
