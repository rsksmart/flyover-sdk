#!/bin/bash

git clone --branch "$1" --depth 1 git@github.com:rsksmart/liquidity-bridge-contract.git lbc-code
cd lbc-code || return
npm ci
npm run compile

jq .abi build/contracts/LiquidityBridgeContractV2.json | jq -r  tostring > lbc.json
cp lbc.json ../src/blockchain/lbc-abi.ts
typechain --target=ethers-v5 --out-dir=../src/blockchain/bindings lbc.json
sed -i.bkp '1s;^;/*eslint-disable*/export default ;' ../src/blockchain/lbc-abi.ts
rm ../src/blockchain/lbc-abi.ts.bkp

cd ..
rm -rf lbc-code
