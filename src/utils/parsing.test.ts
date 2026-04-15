import { remove0x } from './parsing';
import { describe, test, expect } from '@jest/globals'

describe('remove0x function should', () => {
    test('remove 0x prefix from a string', () => {
        expect(remove0x('0xabcdef')).toBe('abcdef');
        expect(remove0x('0Xabcdef')).toBe('abcdef');
        expect(remove0x('0x123456')).toBe('123456');
        expect(remove0x('0X123456')).toBe('123456');
    });

    test('return the same string if it does not start with 0x', () => {
        expect(remove0x('abcdef')).toBe('abcdef');
        expect(remove0x('123456')).toBe('123456');
        expect(remove0x('x0xabcdef')).toBe('x0xabcdef');
        expect(remove0x('Oxabcdef')).toBe('Oxabcdef');
    });

    test('handle empty string', () => {
        expect(remove0x('')).toBe('');
    });

    test('remove only the first 0x if present', () => {
        expect(remove0x('0x0xabcdef')).toBe('0xabcdef');
        expect(remove0x('0X0xabcdef')).toBe('0xabcdef');
        expect(remove0x('0x0Xabcdef')).toBe('0Xabcdef');
        expect(remove0x('0X0Xabcdef')).toBe('0Xabcdef');
    });
});
