import { Contract } from "ethers";
import { validateNotPaused } from "./lbc";
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
