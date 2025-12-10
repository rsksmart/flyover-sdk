#!/bin/bash

git clone --branch "$1" --depth 1 git@github.com:rsksmart/liquidity-bridge-contract.git lbc-code
cd lbc-code || return
npm ci
npm run compile

jq .abi artifacts/contracts/interfaces/IPegIn.sol/IPegIn.json | jq -r  tostring > pegin.json
jq .abi artifacts/contracts/interfaces/IPegOut.sol/IPegOut.json | jq -r  tostring > pegout.json
jq .abi artifacts/contracts/interfaces/IFlyoverDiscovery.sol/IFlyoverDiscovery.json | jq -r  tostring > discovery.json

cp pegin.json ../src/blockchain/pegin-abi.ts
cp pegout.json ../src/blockchain/pegout-abi.ts
cp discovery.json ../src/blockchain/flyover-discovery-abi.ts

typechain --target=ethers-v5 --out-dir=../src/blockchain/bindings pegin.json
typechain --target=ethers-v5 --out-dir=../src/blockchain/bindings pegout.json
typechain --target=ethers-v5 --out-dir=../src/blockchain/bindings discovery.json

sed -i.bkp '1s;^;/*eslint-disable*/export default ;' ../src/blockchain/pegin-abi.ts
rm ../src/blockchain/pegin-abi.ts.bkp
sed -i.bkp '1s;^;/*eslint-disable*/export default ;' ../src/blockchain/pegout-abi.ts
rm ../src/blockchain/pegout-abi.ts.bkp
sed -i.bkp '1s;^;/*eslint-disable*/export default ;' ../src/blockchain/flyover-discovery-abi.ts
rm ../src/blockchain/flyover-discovery-abi.ts.bkp

cd ..
rm -rf lbc-code
