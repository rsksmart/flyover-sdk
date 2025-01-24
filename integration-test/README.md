# Flyover-SDK Integration tests
The Flyover integration test suite can be run by executing `npm run test:integration`

## Environment variables
To run the integration test suite, the following environment variables are required:
- **TEST_NETWORK**: network to use when creating FlyoverSDK instance.
- **TEST_MNEMONIC**: seed prhase for the test wallet that will be used to sign the pegout transaction
- **TEST_PROVIDER_ID**: id of the liquidity provider that will be used to run the integration test suite.
- **TEST_NODE_URL**: url of the RSK node that will be used.
- **TEST_RSK_ADDRESS**: RSK address to use as pegin destination address.
- **TEST_BTC_ADDRESS**: BTC address to use as pegout destination address.
- **TEST_PEGIN_AMOUNT**: amount of the test pegins.
- **TEST_PEGOUT_AMOUNT**: amount of the test pegouts.
- **TEST_MEMPOOL_SPACE_URL**: MempoolSpace API url. This is used to fetch some UTXO information during the tests.
