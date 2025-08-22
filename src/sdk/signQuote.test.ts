import { signQuote } from "./signQuote";
import { describe, test, jest, expect, beforeAll } from '@jest/globals'
import { assertTruthy, BlockchainConnection, FlyoverConfig, isValidSignature, ethers } from "@rsksmart/bridges-core-sdk";
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

const TEST_ACCOUNT_ONE = {
    keystore: {"address":"26f40996671e622a0a6408b24c0e678d93a9efea","crypto":{"cipher":"aes-128-ctr","ciphertext":"8ce65d2e83e97ccf3e8703def56407023c57d92e1f62af4d5bece8b1405c5499","cipherparams":{"iv":"09861cec65e6cb56029cdbae1c5abd4b"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"15ef60f8d2b060ba231d3fedb55886689fbd60d186da773a13eafbc152b05167"},"mac":"c965c4f8b28911b9a4128d37ff0da5f1d953ce194385a117cbd37c712019e10c"},"id":"c7f6dd91-6e1c-4c4b-b82e-1ce700fa84a3","version":3},
    password: 'test2'
}
const TEST_ACCOUNT_TWO = {
    keystore: {"address":"7f982fab4d11cef2fb979de5dddb0318a3cf0035","crypto":{"cipher":"aes-128-ctr","ciphertext":"b545a8b73620ee6ba86e05b800a0f0129f1c42dcedbaca388e7fc80ff61dad36","cipherparams":{"iv":"3910b03585a284e13a5f9257a6e86880"},"kdf":"scrypt","kdfparams":{"dklen":32,"n":262144,"p":1,"r":8,"salt":"52a47e913543bb95cd052d6551826a32f7fc0435009399c91dd9b1c4d155275f"},"mac":"624167d62efb0be2d95d31cb9dad797ed07a4285430ff47f9301229a9d6d9706"},"id":"c7ffe208-49db-41cd-98a6-eacdf01c6833","version":3},
    password: 'test'
};

const peginCases: {quote: Quote, signer: string, signature: string, connection?: BlockchainConnection}[] =  [
    {
        quote: {
            quote:{
            fedBTCAddr: '2MvW72NchDEXiYuTv8SurroHwGw8rSuDKxz',
            lbcAddr: '0x18D8212bC00106b93070123f325021C723D503a3',
            lpRSKAddr: '0xdfcf32644e6cc5badd1188cddf66f66e21b24375',
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
            productFeeAmount: BigInt(0)
            },
            quoteHash: 'bad965e00a5b1085cb2d4d448e2cdb7fd06b8875583055620f08516b18ee899f'
        },
        signer: '0x26f40996671e622A0a6408B24C0e678D93a9eFEA',
        signature: '7d9d587a3390717fad2af4921d9f73fac41243e394369ea6af793217f53240c13897a459153995e7d18704f4c218f220b377069d0607db5a2a9879548a122f761b',
    },
    {
        quote: {
            quote: {
                fedBTCAddr: '2MvW72NchDEXiYuTv8SurroHwGw8rSuDKxz',
                lbcAddr: '0x18D8212bC00106b93070123f325021C723D503a3',
                lpRSKAddr: '0xdfcf32644e6cc5badd1188cddf66f66e21b24375',
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
                productFeeAmount: BigInt(0)
            },
            quoteHash: 'adf549ecbc1a4e734fa90b2985495732b1c1c9e84235fe77584c5eeedf4dbf3f'
        },
        signature: 'c9e7ffac26b89016a9a1a2f5661f680725708670c815abd4934a3e115443aaae11e8e11f70fbf5406edf7ad0b81656326d01c3afc406f400f10fc3f3fd226a601b',
        signer: '0x7f982fab4d11cef2fb979de5dddb0318a3cf0035'
    }
]

const pegoutCases: {quote: PegoutQuote, signer: string, signature: string, connection?: BlockchainConnection}[] =  [
{
    quote: {
        quote: {
            lbcAddress: '0x18D8212bC00106b93070123f325021C723D503a3',
            liquidityProviderRskAddress: '0xdfcf32644e6cc5badd1188cddf66f66e21b24375',
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
            productFeeAmount: BigInt(0)
        },
        quoteHash: 'cd0540da2550bdecd0721c09f16dde85832d1553a378bd090f8716a688e94cf6'
    },
    signature: '8a7e1af37ecab74183acbafd65e0791eb61eb4b4e884310f33da0b276dbe3a7f727cea1875008804f8c8d6750f0146d13d315307269ca2c2f4f46969b1dea5041c',
    signer: '0x7f982fab4d11cef2fb979de5dddb0318a3cf0035'
},
{
    quote:{
          quote:  {
                lbcAddress: '0x18D8212bC00106b93070123f325021C723D503a3',
                liquidityProviderRskAddress: '0xdfcf32644e6cc5badd1188cddf66f66e21b24375',
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
                productFeeAmount: BigInt(0)
        },
            quoteHash: 'b2e14c87f0cd6e0074bdd7f7617f4c206cb7a48abe572f7862ada5f265d4d1d6'
        },
        signature: 'a2a1fa5467ce5a8f4dad51707c738e906c355dd4c20e7aa6a46cb38edaa1e38b7bb6b07a059936701210b4bd78a76aa2b37fe28c95a6620fac82ab80aff89fdd1b',
        signer: '0x26f40996671e622A0a6408B24C0e678D93a9eFEA'
    },
]

describe("signQuote", () => {
    const peginQuote = peginCases[0]?.quote
    let connections: {connection:BlockchainConnection, address:string}[]

    beforeAll(async () => {
        connections = [
            {
                connection:  await BlockchainConnection.createUsingEncryptedJson(
                    TEST_ACCOUNT_ONE.keystore,
                    TEST_ACCOUNT_ONE.password,
                ), address: '0x'+TEST_ACCOUNT_ONE.keystore.address,
            },
                        {
                connection:  await BlockchainConnection.createUsingEncryptedJson(
                    TEST_ACCOUNT_TWO.keystore,
                    TEST_ACCOUNT_TWO.password,
                ), address: '0x'+TEST_ACCOUNT_TWO.keystore.address,
            }
        ]
        peginCases.forEach((peginCase) => {
            peginCase.connection = connections.find((c) => c.address.toLowerCase() === peginCase.signer.toLowerCase())?.connection
        })
        pegoutCases.forEach((pegoutCase) => {
            pegoutCase.connection = connections.find((c) => c.address.toLowerCase() === pegoutCase.signer.toLowerCase())?.connection
        })
    }, 50_000);

  test("signs a valid pegin quote", async () => {
    for (const peginCase of peginCases) {
        const lbcMock = {
            hashPeginQuote: jest.fn<() => Promise<string>>().mockResolvedValue(peginCase.quote.quoteHash),
        }

        const signature = await signQuote(
            { network: 'Development', rskConnection: peginCase.connection, captchaTokenResolver: () => Promise.resolve('') },
            lbcMock as unknown as LiquidityBridgeContract,
            providerMock,
            peginCase.quote
        );
        const checksummedSigner = ethers.utils.getAddress(peginCase.signer);

        expect(lbcMock.hashPeginQuote).toHaveBeenCalledWith(peginCase.quote);
        expect(signature).toBe(peginCase.signature);
        await expect(isValidSignature(checksummedSigner, peginCase.quote.quoteHash, signature)).toBe(true);
    }
    });

    test("signs a valid pegout quote", async () => {
            for (const pegoutCase of pegoutCases) {
        const lbcMock = {
            hashPegoutQuote: jest.fn<() => Promise<string>>().mockResolvedValue(pegoutCase.quote.quoteHash),
        }

        const signature = await signQuote(
            { network: 'Development', rskConnection: pegoutCase.connection, captchaTokenResolver: () => Promise.resolve('') },
            lbcMock as unknown as LiquidityBridgeContract,
            providerMock,
            pegoutCase.quote
        );
        const checksummedSigner = ethers.utils.getAddress(pegoutCase.signer);

        expect(lbcMock.hashPegoutQuote).toHaveBeenCalledWith(pegoutCase.quote);
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
            hashPeginQuote: jest.fn<() => Promise<string>>().mockResolvedValue('not a hash'),
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
