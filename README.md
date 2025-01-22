# Flyover SDK
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rsksmart/flyover-sdk/badge)](https://scorecard.dev/viewer/?uri=github.com/rsksmart/flyover-sdk)
[![CodeQL](https://github.com/rsksmart/flyover-sdk/workflows/CodeQL/badge.svg)](https://github.com/rsksmart/flyover-sdk/actions?query=workflow%3ACodeQL)
[![CI](https://github.com/rsksmart/flyover-sdk/actions/workflows/ci.yml/badge.svg)](https://github.com/rsksmart/flyover-sdk/actions/workflows/ci.yml)

Flyover SDK simplifies the integration between client applications and the components of the Flyover Protocol by providing an easy to use interface.
## Installation
    npm install @rsksmart/flyover-sdk
## Usage
Create Flyover client instance
```javascript
    const flyover = new Flyover({ network: 'Regtest'})
```
If you want, you can provide your own Regtest environment URL, if custom environment URL is not secure, then you must allow insecure connections
```javascript
    const flyover = new Flyover({
        network: 'Regtest',
        customRegtestUrl: 'http://localhost:8080',
        allowInsecureConnections: true
    })
```
Then you can start doing operations with the client
```javascript
    const providers = await flyover.getLiquidityProviders()
    flyover.useLiquidityProvider(providers.at(0))
    const quotes = await flyover.getQuotes({ /* QuoteRequest data... */ })
    const acceptedQuote = await flyover.acceptQuote(quotes.at(0))
```
You can read more about Flyover Protocol [here](https://dev.rootstock.io/developers/integrate/flyover/) or in its [integration manual](https://dev.rootstock.io/developers/integrate/flyover/sdk/).

## Configuration
This section explains one by one the fields required to configure the FlyoverSDK. A full FlyoverConfig object
looks like this:
```javascript
interface FlyoverConfig extends BridgesConfig {
  network: Network
  allowInsecureConnections?: boolean
  rskConnection?: BlockchainConnection
  customLbcAddress?: string
  customRegtestUrl?: string
  captchaTokenResolver: CaptchaTokenResolver
  disableChecksum?: boolean
}
```
- **network**: this is the name of the network your going to connect to. It can be any of the following:
    - `Mainnet`
    - `Testnet`
    - `Regtest`
    - `Alphanet`
    - `Development`
However we advice to only use `Mainnet` or `Testnet` for integration purposes as they are the most stable ones.
- **allowInsecureConnections**: the FlyoverSDK may work with different liquidity provider servers, this this parameters helps to prevent the SDK of making requests to server that are not running over HTTPS. It is false by default.
- **rskConnection**: this parameter is the object representing the connection to the RSK network, it is not mandatory to initialize the SDK. For more information check [Connect to RSK](#connect-to-rsk) section
- **customLbcAddress**: if you provide this parameter then the SDK will use the contract at that address as the LBC when connected to the `Regtest` network.
- **customRegtestUrl**: this parameter is deprecated and will be removed in future versions. You can disregard it.
- **captchaTokenResolver**: some liquidity providers might want their quotes to be human-generated only for security reasons. For this cases the FlyoverSDK needs a function to get the captcha token returned from a successful captcha challenge from wherever the client application decided to store it. The SDK only expects the token to be returned to that function so the signature is `() => Promise<string>`
- **disableChecksum**: this parameter tells the FlyoverSDK whether to disable the RSK checksum validation for the RSK addresses involved in the PegIn and PegOut operations or not. It is false by default.

## Connect to RSK
If you need to connect to RSK to execute some operation then you need to create an RSKConnection and provide it to
Flyover object
```javascript
    const rsk = await BlockchainConnection.createUsingStandard(window.ethereum)
    const flyover = new Flyover({ rskConnection: rsk, network: 'Regtest' })
```
or you can set it after creation
```javascript
    const rsk = await BlockchainConnection.createUsingStandard(window.ethereum)
    await flyover.connectToRsk(rsk)
```
Also you can provide your own regtest LBC address if you want to connect to a local node for development purposes
```javascript
    const rsk = await BlockchainConnection.createUsingStandard(window.ethereum)
    const flyover = new Flyover({
        rskConnection: rsk,
        network: 'Regtest',
        customLbcAddress: '0x1eD614cd3443EFd9c70F04b6d777aed947A4b0c4'
    })
```
There are 3 ways to create an RSK connection, you can check them in RSKConnection class documentation

### Flyover utils
FlyoverSDK exports an object with a collection of util functions that the client application might use during the integration with the SDK. You can see the list of the utility functions [here](./docs/modules.md#flyoverutils) and also when importing the `FlyoverUtils` object from the SDK package every function has a JsDoc explaining its usage.

### Transaction validation
Both PegIn and PegOut payments should be validated to ensure they accomplish with all the requirements to complete the Flyover process. In the case of the PegOut, since the payment is done directly on the Liquidity Bridge Contract, all the validations for it reside in the implementation of the `depositPegout` function. However, in the case of the PegIn, since the transaction is constructed inside the user wallet, the smart contract doesn't have a way to tell if the transaction is valid or not until it is broadcasted and registered. Therefore, the SDK contains the `validatePeginTransaction` method to validate if a PegIn payment transaction is valid or not before broadcasting it to prevent the users or client applications from constructing incorrect transactions that would end up requiring a refund.

## Supported addresses
Currently, not all the types of Bitcoin addresses are supported in Flyover Protocol. The address support is summarized in the following table:
| Address type | Testnet prefix | Mainnet prefix |     Supported      |                        Testnet example                         |                        Mainnet example                         |
|:------------:|:--------------:|:--------------:|:------------------:|:--------------------------------------------------------------:|:--------------------------------------------------------------:|
|    P2PKH     |     m or n     |       1        | :white_check_mark: |               mvL2bVzGUeC9oqVyQWJ4PxQspFzKgjzAqe               |               12higDjoCCNXSA95xZMWUdPvXNmkAduhWv               |
|     P2SH     |       2        |       3        | :white_check_mark: |              2MzQwSSnBHWHqSAqtTVQ6v47XtaisrJa1Vc               |               342ftSRCvFHfCeFFBuz4xwbeqnDw6BGUey               |
|    P2WPKH    |      tb1q      |      bc1q      | :white_check_mark: |           tb1qvprq2gqzhj5nqmp8tm598yrs2g32vm0ut2lcge           |           bc1q34aq5drpuwy3wgl9lhup9892qp6svr8ldzyy7c           |
|    P2WSH     |      tb1q      |      bc1q      | :white_check_mark: | tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7 | bc1qeklep85ntjz4605drds6aww9u0qr46qzrv5xswd35uhjuj8ahfcqgf6hak |
|     P2TR     |      tb1p      |      bc1p      | :white_check_mark: | tb1p5cyxnuxmeuwuvkwfem96lqzszd02n6xdcjrs20cac6yqjjwudpxqp3mvzv | bc1p5d7rjq7g6rdk2yhzks9smlaqtedr4dekq08ge8ztwac72sfr9rusxg3297 |

## Application Programming Interface
To see the full API of this package please refer to the [the docs folder](./docs/) of this project
