import { Contract } from "ethers";
import { getEip712Domain, validateNotPaused } from "./lbc";
import { describe, test, jest, expect } from '@jest/globals'


describe("validateNotPaused", () => {
    test("does not throw if contract is not paused", async () => {
        const mockContract = {
            pauseStatus: jest.fn().mockImplementation(async () => Promise.resolve([false, '', BigInt(0)])),
        } as unknown as Contract;
        await expect(validateNotPaused(mockContract)).resolves.not.toThrow()
    });

    test("throws FlyoverError.protocolPaused if contract is paused", async () => {
        const reason = "maintenance";
        const timestamp = 123456;
        const mockContract = {
            pauseStatus: jest.fn().mockImplementation(async () => Promise.resolve([true, reason, BigInt(timestamp)])),
        } as unknown as Contract;
        await expect(
            validateNotPaused(mockContract)
        ).rejects.toMatchObject({
            message: 'Protocol paused',
            details: { reason, timestamp },
            timestamp: expect.any(Number),
            recoverable: true,
        });
    });
});

describe("getEip712Domain", () => {
    test("returns the EIP712 domain from the contract", async () => {
        const name = "LiquidityBridge";
        const version = "1.0";
        const chainId = BigInt(1);
        const verifyingContract = "0x1234567890123456789012345678901234567890";
        const mockContract = {
            eip712Domain: jest.fn().mockImplementation(async () => Promise.resolve(['', name, version, chainId, verifyingContract, '', []])),
        } as unknown as Contract;
        const result = await getEip712Domain(mockContract);
        expect(result).toEqual({ name, version, chainId, verifyingContract });
    });
});
