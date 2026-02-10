import { signQuote } from "./signQuote";
import { describe, test, jest, expect, beforeAll } from '@jest/globals'
import { assertTruthy, FlyoverConfig, isValidSignature, ethers } from "@rsksmart/bridges-core-sdk";
import { LiquidityProvider, PegoutQuote, Quote } from "../api";
import { LiquidityBridgeContract } from "../blockchain/lbc";

const providerMock: LiquidityProvider = {
  id: 1,
  provider: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
  apiBaseUrl: 'http://localhost:8080',
  name: 'any name',
  status: true,
  providerType: 'pegin',
  siteKey: 'any key',
  liquidityCheckEnabled: true,
  pegin: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  },
  pegout: {
    minTransactionValue: BigInt(1),
    maxTransactionValue: BigInt(100),
    fee: BigInt(1),
    fixedFee: BigInt(3),
    feePercentage: 1.25,
    requiredConfirmations: 5
  }
}

const peginCases: {quote: Quote, signer: string, signature: string, connection?: any}[] =  [
    {
        quote: {
            quote:{
            fedBTCAddr: '2MvW72NchDEXiYuTv8SurroHwGw8rSuDKxz',
            lbcAddr: '0x18D8212bC00106b93070123f325021C723D503a3',
            lpRSKAddr: '0xAFf2c034FD8Bc690e62A897BbC5A6C4dF2321992',
            btcRefundAddr: 'mfWxJ45yp2SFn7UciZyNpvDKrzbhyfKrY8',
            rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
            lpBTCAddr: 'mwEceC31MwWmF6hc5SSQ8FmbgdsSoBSnbm',
            callFee: BigInt("499600000000000000"),
            penaltyFee: BigInt("1000000000000000"),
            contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
            data: '10',
            gasLimit: 21016,
            nonce: BigInt("601291104220190380"),
            value: BigInt("500000000000000000"),
            agreementTimestamp: 1748003098,
            timeForDeposit: 3600,
            lpCallTime: 7200,
            confirmations: 3,
            callOnRegister: false,
            gasFee: BigInt("102071097248"),
            },
            quoteHash: 'bad965e00a5b1085cb2d4d448e2cdb7fd06b8875583055620f08516b18ee899f'
        },
        signer: '0xAFf2c034FD8Bc690e62A897BbC5A6C4dF2321992',
        signature: 'aaebe63d6e226d0a88325f6657481cb038f6b3930ab4cdb5f9a4a49a57b45e387ecdfb084109068d8c6bbea5ea030cab9d5ca4d4be82134a67b9fef55e2287d41c',
    },
    {
        quote: {
            quote: {
                fedBTCAddr: '2MvW72NchDEXiYuTv8SurroHwGw8rSuDKxz',
                lbcAddr: '0x18D8212bC00106b93070123f325021C723D503a3',
                lpRSKAddr: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35',
                btcRefundAddr: 'mfWxJ45yp2SFn7UciZyNpvDKrzbhyfKrY8',
                rskRefundAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
                lpBTCAddr: 'mwEceC31MwWmF6hc5SSQ8FmbgdsSoBSnbm',
                callFee: BigInt("0"),
                penaltyFee: BigInt("1000000000000000"),
                contractAddr: '0x79568c2989232dCa1840087D73d403602364c0D4',
                data: '10',
                gasLimit: 21016,
                nonce: BigInt("1333727062419879207"),
                value: BigInt("500000000000000000"),
                agreementTimestamp: 1748251859,
                timeForDeposit: 3600,
                lpCallTime: 7200,
                confirmations: 3,
                callOnRegister: false,
                gasFee: BigInt("547794649600"),
            },
            quoteHash: 'adf549ecbc1a4e734fa90b2985495732b1c1c9e84235fe77584c5eeedf4dbf3f'
        },
        signature: '40126b215bd55aa96c5e552249359677dc4fad7f99ce5dfaa85b3e6f6a92df9d35764a4bc0e47b66b045183bfbd8978c2238823e6068087a45a83d63df4c3d731b',
        signer: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35'
    }
]

const pegoutCases: {quote: PegoutQuote, signer: string, signature: string, connection?: any}[] =  [
{
    quote: {
        quote: {
            lbcAddress: '0x18D8212bC00106b93070123f325021C723D503a3',
            liquidityProviderRskAddress: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35',
            btcRefundAddress: 'mxwbsN5eUH2qC84ZCYMavQamgJZS5bgsvW',
            rskRefundAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
            lpBtcAddr: 'mwEceC31MwWmF6hc5SSQ8FmbgdsSoBSnbm',
            callFee: BigInt("60000000000000"),
            penaltyFee: BigInt("1000000000000000"),
            nonce: BigInt("5341647878676552590"),
            depositAddr: 'mxwbsN5eUH2qC84ZCYMavQamgJZS5bgsvW',
            value: BigInt("600000000000000000"),
            agreementTimestamp: 1748251860,
            depositDateLimit: 1748255460,
            depositConfirmations: 15,
            transferConfirmations: 3,
            transferTime: 3600,
            expireDate: 1748262660,
            expireBlocks: 6430650,
            gasFee: BigInt("2690000000000"),
        },
        quoteHash: 'cd0540da2550bdecd0721c09f16dde85832d1553a378bd090f8716a688e94cf6'
    },
    signature: 'd0b104aa793c09802ae8fda443693498a6ffb1552a936afaba3068c838c57e6b2c89aa5dc882e3b5c942b28a7282bc9e4e46e4b63b4b1fd15ac2026fb41cf4db1c',
    signer: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35'
},
{
    quote:{
          quote:  {
                lbcAddress: '0x18D8212bC00106b93070123f325021C723D503a3',
                liquidityProviderRskAddress: '0xAFf2c034FD8Bc690e62A897BbC5A6C4dF2321992',
                btcRefundAddress: 'mxwbsN5eUH2qC84ZCYMavQamgJZS5bgsvW',
                rskRefundAddress: '0x9D93929A9099be4355fC2389FbF253982F9dF47c',
                lpBtcAddr: 'mwEceC31MwWmF6hc5SSQ8FmbgdsSoBSnbm',
                callFee: BigInt("60000000000000"),
                penaltyFee: BigInt("1000000000000000"),
                nonce: BigInt("6389617322207459595"),
                depositAddr: 'mxwbsN5eUH2qC84ZCYMavQamgJZS5bgsvW',
                value: BigInt("600000000000000000"),
                agreementTimestamp: 1748253372,
                depositDateLimit: 1748256972,
                depositConfirmations: 15,
                transferConfirmations: 3,
                transferTime: 3600,
                expireDate: 1748264172,
                expireBlocks: 6430725,
                gasFee: BigInt("4170000000000"),
        },
            quoteHash: 'b2e14c87f0cd6e0074bdd7f7617f4c206cb7a48abe572f7862ada5f265d4d1d6'
        },
        signature: '3763a6b88b92d31546d1369668834624a5c4fc7cd95c0c90c461db7313a218390b1c6d89fe8107da5325f328d2429959f89d86dcc9cd7eedd2be147f10ad82dd1c',
        signer: '0xAFf2c034FD8Bc690e62A897BbC5A6C4dF2321992'
    },
]

describe("signQuote", () => {
  const peginQuote = peginCases[0]?.quote
  let connections: {connection: any, address:string}[]

  beforeAll(async () => {
      connections = [
        {
          address: '0xAFf2c034FD8Bc690e62A897BbC5A6C4dF2321992',
          connection: {
            signer: {
                _signTypedData: jest.fn()
            }
          }
        },
        {
          address: '0x57f9F71E683E2A8ff3d2f394aE45C58b2d913A35',
          connection: {
            signer: {
                _signTypedData: jest.fn()
            }
          }
        }
      ]
    peginCases.forEach((peginCase) => {
        peginCase.connection = connections.find((c) => c.address.toLowerCase() === peginCase.signer.toLowerCase())?.connection
        jest.spyOn(peginCase.connection.signer, '_signTypedData').mockResolvedValueOnce(peginCase.signature)
    })
    pegoutCases.forEach((pegoutCase) => {
        pegoutCase.connection = connections.find((c) => c.address.toLowerCase() === pegoutCase.signer.toLowerCase())?.connection
        jest.spyOn(pegoutCase.connection.signer, '_signTypedData').mockResolvedValueOnce(pegoutCase.signature)
    })
  }, 50_000);

  test("signs a valid pegin quote", async () => {
    for (const peginCase of peginCases) {
        const lbcMock = {
            pegInContract: {
                hashPeginQuote: jest.fn<() => Promise<string>>().mockResolvedValue(peginCase.quote.quoteHash),
                getEip712Domain: jest.fn<() => Promise<unknown>>().mockResolvedValue({ name: 'PegInContract', version: '1', chainId: 31, verifyingContract:'addr' }),
            }
        }

        const signature = await signQuote(
            { network: 'Development', rskConnection: peginCase.connection, captchaTokenResolver: () => Promise.resolve('') },
            lbcMock as unknown as LiquidityBridgeContract,
            providerMock,
            peginCase.quote
        );
        const checksummedSigner = ethers.utils.getAddress(peginCase.signer);

        expect(lbcMock.pegInContract.hashPeginQuote).toHaveBeenCalledWith(peginCase.quote);
        expect(lbcMock.pegInContract.getEip712Domain).toHaveBeenCalled();
        expect(signature).toBe(peginCase.signature);
        await expect(isValidSignature(checksummedSigner, peginCase.quote.quoteHash, signature)).toBe(true);
    }
    });

    test("signs a valid pegout quote", async () => {
            for (const pegoutCase of pegoutCases) {
        const lbcMock = {
            pegOutContract: {
                hashPegoutQuote: jest.fn<() => Promise<string>>().mockResolvedValue(pegoutCase.quote.quoteHash),
                getEip712Domain: jest.fn<() => Promise<unknown>>().mockResolvedValue({ name: 'PegOutContract', version: '1', chainId: 31, verifyingContract:'addr' }),
            }
        }

        const signature = await signQuote(
            { network: 'Development', rskConnection: pegoutCase.connection, captchaTokenResolver: () => Promise.resolve('') },
            lbcMock as unknown as LiquidityBridgeContract,
            providerMock,
            pegoutCase.quote
        );
        const checksummedSigner = ethers.utils.getAddress(pegoutCase.signer);

        expect(lbcMock.pegOutContract.hashPegoutQuote).toHaveBeenCalledWith(pegoutCase.quote);
        expect(lbcMock.pegOutContract.getEip712Domain).toHaveBeenCalled();
        expect(signature).toBe(pegoutCase.signature);
        await expect(isValidSignature(checksummedSigner, pegoutCase.quote.quoteHash, signature)).toBe(true);
    }
    });

   test("throws if rskConnection is not set", async () => {
        assertTruthy(peginQuote)
        const config = { rskConnection: undefined } as unknown as FlyoverConfig;
        await expect(
            signQuote(config, {} as unknown as LiquidityBridgeContract, providerMock, peginQuote)
        ).rejects.toThrow("Rsk connection is not set");
    });

    test("throws if connection does not support signing", async () => {
        assertTruthy(peginQuote)
        const config: FlyoverConfig = { rskConnection: { value: 'something' } } as unknown as FlyoverConfig;
        await expect(
            signQuote(config, {} as unknown as LiquidityBridgeContract, providerMock, peginQuote)
        ).rejects.toMatchObject({
            message: 'Flyover error',
            details: 'the current connection does not support signing',
            timestamp: expect.any(Number),
            recoverable: true,
        });
    });

    test("throws if quote hash does not match", async () => {
        assertTruthy(peginQuote)
        const lbcMock = {
            pegInContract: {
                hashPeginQuote: jest.fn<() => Promise<string>>().mockResolvedValue('not a hash'),
            }
        }
        const config: FlyoverConfig = { rskConnection: { signer: 'something' } } as unknown as FlyoverConfig;
        await expect(signQuote(
            config,
            lbcMock as unknown as LiquidityBridgeContract,
            providerMock,
            peginQuote
        )).rejects.toMatchObject({
            message: 'Quote hash mismatch',
            details: `Real quote hash doesn't match quote hash provided by server. ${providerMock.apiBaseUrl} is potentially a malicious liquidity provider.`,
            timestamp: expect.any(Number),
            recoverable: false,
        });
    });
});
