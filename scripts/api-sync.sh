#!/bin/bash
api_file_url=https://raw.githubusercontent.com/rsksmart/liquidity-provider-server/$1/OpenApi.yml

if [ -n "$2" ]
  then
    api_file_url+="?token=$2"
fi
echo "Syncing with -> $api_file_url"

npx swagger-typescript-api --path "$api_file_url" \
    --modular --add-readonly true --no-client \
    --route-types --output src/api/bindings \
    --templates src/api/templates;
