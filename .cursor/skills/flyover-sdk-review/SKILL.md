---
name: flyover-sdk-review
description: >
  Code review skill for the rsksmart/flyover-sdk TypeScript project. Encodes patterns
  and standards derived from reviews and the existing codebase.
  Use when reviewing PRs, writing new SDK features, writing tests, or when asked to
  check code quality in flyover-sdk.
---

# Flyover SDK Code Review

For detailed patterns with good/bad examples, read [detailed.md](coding-patterns.md).

---

## Review Checklist

### Tests
- [ ] Async error assertions use `await expect(fn()).rejects.toThrow(...)` — never `.catch(e => expect(e)...)`
- [ ] `captchaTokenResolver` in test setup is `jest.fn<() => Promise<string>>().mockResolvedValue('token')`, not an inline arrow. Allows asserting it was/wasn't called.
- [ ] Module-level mocks use `jest.mock('./module')` at top; casted with `fn as jest.Mock<typeof fn>`
- [ ] Inline object mocks satisfy the interface type — no `{} as any` shortcut unless testing missing-field validation

### Errors
- [ ] User-facing errors use `FlyoverError` static factory methods — not `new Error(string)`
- [ ] Security-sensitive errors (hash mismatch, bad signature) use `FlyoverError` with `recoverable: false`
- [ ] Operational guards (`checkLbc`, `checkLiquidityProvider`) may use plain `Error` — that's intentional

### API / Naming
- [ ] New request body fields are **lowercase camelCase** — do not copy legacy uppercase field names (e.g. `QuoteHash` → `quoteHash`)
- [ ] Routes come from the `Routes` map in `src/api/index.ts` — no hardcoded URL strings
- [ ] `@deprecated` JSDoc markers on generated model fields are **never removed** — required for backward compatibility with older LPS versions

### Function Design
- [ ] Functions with multiple `try/catch` blocks or `if/else` nesting > 2 levels are split into named helpers
- [ ] Utilities already in `@rsksmart/bridges-core-sdk` (e.g. `assertTruthy`, `validateRequiredFields`) are not duplicated locally
- [ ] Functions/classes not consumed outside their file are not exported

### Types & Validation
- [ ] Required field lists (`xyzRequiredFields: string[]`) are defined alongside the type and passed to `validateRequiredFields`
- [ ] New composed types use intersection: `type X = BaseType & DetailType`

---

## Key Patterns At a Glance

**Test mocks (captcha)**
```ts
// ✅
const mockTokenResolver = jest.fn<() => Promise<string>>().mockResolvedValue('token')
const flyover = new Flyover({ captchaTokenResolver: mockTokenResolver, ... })
// later: expect(mockTokenResolver).not.toHaveBeenCalled()

// ❌
captchaTokenResolver: async () => Promise.resolve('token')  // not verifiable
```

**Async error assertions**
```ts
// ✅
await expect(fn()).rejects.toThrow('some error')
await expect(fn()).rejects.toBeInstanceOf(FlyoverError)

// ❌
await fn().catch(e => { expect(e).toBeInstanceOf(FlyoverError) })  // silent pass if fn resolves
```

**FlyoverError usage**
```ts
// ✅
throw FlyoverError.withReason('Quote expired')
throw FlyoverError.invalidRskAddress(address)

// ❌ for user-facing / domain errors
throw new Error('Quote expired')
```

**Function decomposition**
```ts
// ✅ — flat, small named helpers
export async function getQuote(...): Promise<Quote[]> {
  validateRequiredFields(request, ...fields)
  validateRskAddresses(config, request)
  const quotes = await httpClient.post<Quote[]>(url, request)
  for (const q of quotes) {
    if (!validateQuoteResponse(config, request, q)) throw FlyoverError.manipulatedQuoteResonseError(url)
    if (!await validateQuoteHash(lbc, q)) throw FlyoverError.invalidQuoteHashError(url)
  }
  return quotes
}

// ❌ — logic inlined, 3+ nesting levels
export async function getQuote(...): Promise<Quote[]> {
  if (request) {
    try {
      const quotes = await httpClient.post(url, request)
      for (const q of quotes) {
        try {
          const hash = await lbc.hashPeginQuote(q)
          if (hash !== q.quoteHash) { ... }
        } catch { ... }
      }
    } catch { ... }
  }
}
```

**API field naming**
```ts
// ✅ — new fields follow camelCase from day one
{ quoteHash: quote.quoteHash, signature: sig }

// ❌ — copying legacy uppercase naming into new fields
{ QuoteHash: quote.quoteHash, Signature: sig }
```

---

## Context

- All errors extend `BridgeError` from `@rsksmart/bridges-core-sdk`
- API bindings in `src/api/bindings/` are **generated from OpenAPI** — never edit manually
- `@deprecated` on `ProviderDetail.fee` is intentional; the field is still required for older LPS servers
- Integration tests under `integration-test/` import the **published package** and run against a real environment — they are excluded from default Jest runs
