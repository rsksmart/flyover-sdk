# Flyover-SDK Integration tests
The Flyover integration test suite can be run by executing `npm run test:integration`

## Environment variables
To run the integration test suite, the following environment variables are required:
- **TEST_NETWORK**: network to use when creating FlyoverSDK instance.
- **TEST_MNEMONIC**: seed phrase for the test wallet that will be used to sign the pegout transaction
- **TEST_PROVIDER_ID**: id of the liquidity provider that will be used to run the integration test suite.
- **TEST_NODE_URL**: url of the RSK node that will be used.
- **TEST_RSK_ADDRESS**: RSK address to use as pegin destination address.
- **TEST_BTC_ADDRESS**: BTC address to use as pegout destination address.
- **TEST_PEGIN_AMOUNT**: amount of the test pegins.
- **TEST_PEGOUT_AMOUNT**: amount of the test pegouts.
- **TEST_MEMPOOL_SPACE_URL**: MempoolSpace API url. This is used to fetch some UTXO information during the tests.

The commit-first peg-out suites also need the `v3.0.0` contracts deployed on that node (`DeployFlyover` from liquidity-bridge-contract deploys and wires all of them):
- **TEST_FLYOVER_CONFIGURATIONS_ADDRESS**: address of the `FlyoverConfigurations` contract.
- **TEST_PEGOUT_ESCROW_ADDRESS**: address of the `PegOutEscrow` contract.
- **TEST_PEGOUT_CONTRACT_ADDRESS**: address of the `PegOutContract`, needed by the happy path when it differs from the network default.
- **TEST_LPS_URL**: base url of the liquidity provider that claims the peg-out in the happy path.
- **TEST_PEGOUT_CLAIM_TIMEOUT_SECONDS** (optional): how long to wait for a liquidity provider to claim a peg-out. The cases that need a claim are skipped when it is unset.

The happy path also mines regtest BTC blocks through the node set by **TEST_BTC_RPC_CONNECT**, **TEST_BTC_RPC_PORT**, **TEST_BTC_RPC_USER** and **TEST_BTC_RPC_PASSWORD**, so it only runs on regtest.

## Running in CI

The workflow `.github/workflows/integration.yml` runs automatically on every pull request.

### What it does

1. Clones the LPS repo at the pinned ref (`LPS_REF:` at the top of the workflow file — update this to change the stack version).
2. Prepares `.env.regtest` from `sample-config.env` with three CI-specific overrides:
   - `CREATE_POWPEG=true` and `MIGRATE_FEDERATION=true` are forced explicitly (both are mandatory for the SDK tests).
   - `LOG_FILE=` (empty) redirects LPS output to stdout so `docker compose logs` captures it.
   - All Docker volume directories are pre-created with open permissions (`chmod 777`) so containers don't hit "permission denied" when writing to host-mounted paths. This includes `lps_configuration_data`, which is mounted as `/tmp` inside the LPS container and must be writable for `management_password.txt`.
3. Brings up the full regtest stack via `lps-local.sh`: bitcoind, RSKj, MongoDB, LocalStack, wallet-funder, lbc-deployer, powpeg nodes, segwit federation migration, and the LPS itself with its configurer.
4. Mines 100 Bitcoin blocks with fee-paying transactions so that `estimatesmartfee` has sufficient history for pegout quote requests to succeed.
5. Extracts the deployed `PEGIN_CONTRACT_ADDRESS` from `.env.regtest` and generates `integration-test/.env` with all required `TEST_*` variables.
6. Builds the SDK (`npm ci && npm run build`) and runs the following suites via `--testPathPattern`:
   - `pegin.test.ts`, `pegout.test.ts` — core bridge flows
   - `rsk.test.ts` — RSK connection variants
   - `providers.test.ts` — available liquidity reads
   - `user.test.ts` — user quote history
   - `client.test.ts` — BigInt serialization / deserialization
7. On failure, uploads jest output and Docker container logs as a downloadable artifact (`integration-test-failure`).
