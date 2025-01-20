#!/bin/bash
api_file_url="https://raw.githubusercontent.com/rsksmart/liquidity-bridge-contract/QA-Test/errorCodes.json"

echo "Syncing with -> $api_file_url"

# Download the file
wget -q -O errorCodes.json $api_file_url
