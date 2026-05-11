# Flyover SDK — Coding Patterns Reference


## 1. Test: Verifiable Mock Functions

### Origin
PR #68 — Integration tests for pegin and pegout automation
> "it would be nice to pass a `jest.fn()` function instead of the `fakeTokenResolver` to ensure the captcha was actually not required"

### Why it matters
An inline arrow `async () => Promise.resolve('token')` makes the test pass even if the system incorrectly calls the captcha resolver. A `jest.fn()` lets you **assert** it was or wasn't called — turning a silent assumption into an explicit contract.

### ❌ Bad
```ts
// Non-verifiable — test passes even if captcha is called unexpectedly
const flyover = new Flyover({
  network: 'Regtest',
  captchaTokenResolver: async () => Promise.resolve('fake-token'),
  allowInsecureConnections: true
})

// The test never verifies if captcha was actually skipped
const result = await flyover.acceptAuthenticatedQuote(quote, sig)
expect(result).toBeDefined()
```

### ✅ Good
```ts
// Verifiable — you can assert the mock was or wasn't called
const mockCaptchaResolver = jest.fn<() => Promise<string>>().mockResolvedValue('a-captcha-token')

const flyover = new Flyover({
  network: 'Regtest',
  captchaTokenResolver: mockCaptchaResolver,
  allowInsecureConnections: true
})

const result = await flyover.acceptAuthenticatedQuote(quote, sig)
expect(result).toBeDefined()
expect(mockCaptchaResolver).not.toHaveBeenCalled()  // ← proves captcha was skipped
```

### Where this pattern already exists correctly
```ts
// integration-test/test/authenticatedPegin.test.ts
const mockTokenResolver = jest.fn<() => Promise<string>>().mockResolvedValue('a-captcha-token')
flyover = new Flyover({
  captchaTokenResolver: mockTokenResolver,
  ...
})
```

---

## 2. Test: Async Error Assertions

### Origin
PR #49 — make hash functions public
> "then maybe you could rewrite as `await expect(fn()).resolves.not.toThrow()`"

### Why it matters
The `.catch(e => { expect(e)... })` pattern is **silently fragile**: if the promise resolves instead of rejecting, the expectations inside `.catch` never run and the test **passes incorrectly**. The `rejects` / `resolves` matchers fail loudly if the promise behaves unexpectedly.

### ❌ Bad
```ts
// Silent pass if getQuote resolves instead of rejecting
await getQuote(config, client, lbc, provider, badRequest).catch(e => {
  expect(e).toBeInstanceOf(FlyoverError)
  expect(e.message).toBe('Invalid RSK address')
})

// Also bad — doesn't assert the promise rejects
try {
  await getQuote(config, client, lbc, provider, badRequest)
} catch (e) {
  expect(e).toBeInstanceOf(FlyoverError)
}
```

### ✅ Good
```ts
// Explicit — fails if fn resolves, fails if wrong error type
await expect(
  getQuote(config, client, lbc, provider, badRequest)
).rejects.toBeInstanceOf(FlyoverError)

// For message + details:
await expect(
  getQuote(config, client, lbc, provider, badRequest)
).rejects.toMatchObject({
  message: 'Invalid RSK address',
  details: expect.stringContaining(badAddress)
})

// For happy path — assert it doesn't throw
await expect(
  getQuote(config, client, lbc, provider, validRequest)
).resolves.not.toThrow()
```

### Where the anti-pattern exists in the repo (to clean up)
```ts
// src/sdk/getQuote.test.ts — several instances of this pattern
expect.assertions(2)
await getQuote(configMock, mockClient, lbcMock, providerMock, quoteRequestMock).catch(e => {
  expect(e).toBeInstanceOf(FlyoverError)
  expect(e.message).toBe('...')
})
```
Note: `expect.assertions(N)` partially mitigates this, but `rejects` matchers are still clearer.

---

## 3. API Field Naming: No Legacy Capitalization

### Origin
PR #64 — add function to accept pegin quote from trusted account
> "The `QuoteHash` with capital Q is a legacy error that hasn't been fixed because of compatibility reasons, if you're adding `Signature` I'd add it as `signature` from the beginning"

### Why it matters
`QuoteHash` exists as a capitalization mistake in the original API — it cannot be changed without breaking existing LPS servers. New fields must **not copy that mistake**. Every new field must follow `camelCase` from day one to avoid the same compat debt.

### ❌ Bad
```ts
// Copying the legacy uppercase style for the new Signature field
const acceptedQuote = await httpClient.post<AcceptedQuote>(
  url,
  { QuoteHash: quote.quoteHash, Signature: signature }  // ← Signature should be lowercase
)
```

### ✅ Good
```ts
// quoteHash stays capitalized (legacy compat), new field uses camelCase
const acceptedQuote = await httpClient.post<AcceptedQuote>(
  url,
  { quoteHash: quote.quoteHash, signature: signature }
)
```

### Current state in the repo
```ts
// src/sdk/acceptAuthenticatedQuote.ts — CORRECT
{ quoteHash: quote.quoteHash, signature: signature }

// src/sdk/acceptAuthenticatedPegoutQuote.ts — check this follows the same pattern
```

---

## 4. Deprecation Markers: Never Remove

### Origin
PR #67 — add function to accept pegout quote from trusted account
> "don't remove this (check my comment in [this PR](https://github.com/rsksmart/liquidity-provider-server/pull/705))"

### Why it matters
The `@deprecated` marker on `ProviderDetail.fee` is **intentional and load-bearing**. Older Liquidity Provider Servers still return `fee` in responses. Removing the field or the marker breaks deserialization for anyone running an older LPS version. Deprecation ≠ removal.

### ❌ Bad
```ts
// Cleaned up: removed @deprecated and the fee field entirely
export interface ProviderDetail {
  feePercentage: number
  fixedFee: bigint
  // fee removed — BREAKS older LPS responses
}
```

### ✅ Good
```ts
// Keep the field AND the @deprecated marker
export interface ProviderDetail {
  /** @deprecated */
  fee: bigint              // Still required: older LPS servers return this
  feePercentage: number
  fixedFee: bigint
  // ...
}
```

### How deprecation works in this repo
- API bindings (`src/api/bindings/data-contracts.ts`) are **generated from OpenAPI**. Do not hand-edit these.
- The EJS templates (`templates/*.ejs`) emit `@deprecated` when the OpenAPI spec marks a field deprecated.
- Required-field arrays (`ProviderDetailRequiredFields`) still include `"fee"` to handle older LPS payloads gracefully.

---

## 5. Function Decomposition: Avoid Deep Nesting

### Origin
PR #99 — pegin and pegout automation demo
> "I think you should split the functionality of `spendAllCapFlow` in multiple functions... `spendAllCapFlow` has too much nesting (multiple `try/catch` blocks and nested `if/else` blocks) which makes it a bit harder to follow"

### Why it matters
Functions with 3+ nesting levels (loops inside try/catch inside if/else) are hard to follow, hard to test, and hard to modify. Each logical step deserves its own named function, even if it's only called once.

### ❌ Bad
```ts
export async function spendAllCapFlow(): Promise<void> {
  try {
    const flyover = await initializeFlyover()
    let quoteCount = 0
    let capExceeded = false

    while (!capExceeded) {
      quoteCount++
      try {
        const quotes = await flyover.getQuotes(request)
        if (quotes.length > 0) {
          const quote = quotes[0]
          try {
            const signed = await flyover.signQuote(quote)
            const accepted = await flyover.acceptAuthenticatedQuote(quote, signed)
            // ... more logic
            if (someCondition) {
              if (anotherCondition) {
                // 4 levels deep
              }
            }
          } catch (innerErr) {
            if (innerErr instanceof FlyoverError) {
              capExceeded = true
            }
          }
        }
      } catch (outerErr) {
        // ...
      }
    }
  } catch (err) {
    // ...
  }
}
```

### ✅ Good
```ts
// Each logical step is a named function
export async function spendAllCapFlow(): Promise<void> {
  const flyover = await initializeFlyover()
  await runCapExhaustionLoop(flyover)
}

async function runCapExhaustionLoop(flyover: Flyover): Promise<void> {
  let quoteCount = 0
  while (true) {
    quoteCount++
    const capExceeded = await processQuoteAttempt(flyover, quoteCount)
    if (capExceeded) break
  }
}

async function processQuoteAttempt(flyover: Flyover, attempt: number): Promise<boolean> {
  const quotes = await flyover.getQuotes(buildRequest())
  if (quotes.length === 0) throw new Error('No quotes available')

  const quote = quotes[0]
  const signed = await flyover.signQuote(quote)

  try {
    await flyover.acceptAuthenticatedQuote(quote, signed)
    return false
  } catch (err) {
    if (isCapExceededError(err)) return true
    throw err
  }
}
```

### The `getQuote` function as a positive reference
The existing `src/sdk/getQuote.ts` is the **canonical example** of correct decomposition in this repo:
```ts
// Flat, each concern extracted
export async function getQuote(...): Promise<Quote[]> {
  validateRequiredFields(quoteRequest, ...quoteRequestRequiredFields)   // extracted
  validateRequiredFields(provider, ...providerRequiredFields)            // extracted
  validateRskAddresses(config, quoteRequest)                            // extracted
  quoteRequest.callContractArguments = sanitizeCallContractArguments(..) // extracted

  const quotes = await httpClient.post<Quote[]>(url, quoteRequest)

  for (const quote of quotes) {
    if (!validateQuoteResponse(config, quoteRequest, quote)) throw ...  // extracted
    if (!await validateQuoteHash(lbc, quote)) throw ...                 // extracted
  }
  return quotes
}
```

---

## 6. Avoid Duplicating Core SDK Utilities

### Origin
PR #99 — pegin and pegout automation demo
> "this is already in core sdk"
(on a custom `assertTruthy` function in the demo utils)

### Why it matters
`@rsksmart/bridges-core-sdk` exports utilities that should be the single source of truth: `assertTruthy`, `validateRequiredFields`, `isRskAddress`, `isValidSignature`, etc. Duplicating them leads to drift, maintenance overhead, and subtle behavioral differences.

### ❌ Bad
```ts
// utilities/pegin-pegout-automation-demo/src/utils.ts
// Duplicated locally — already exists in core SDK
export function assertTruthy<T>(value: T, message: string): asserts value is NonNullable<T> {
  if (value === undefined || value === null) {
    throw new Error(message)
  }
}
```

### ✅ Good
```ts
// Import directly from the core SDK
import { assertTruthy } from '@rsksmart/bridges-core-sdk'
```

### Core SDK utilities to always use instead of reimplementing
| Utility | What it does |
|---------|-------------|
| `assertTruthy(value, msg)` | Narrows `T \| null \| undefined` → `T`, throws if falsy |
| `validateRequiredFields(obj, ...fields)` | Throws if any string field is missing on obj |
| `isRskAddress(addr)` | Validates RSK/Ethereum address format |
| `isValidSignature(address, hash, sig)` | Recovers signer from EIP-712 signature |
| `isBtcZeroAddress(config, addr)` | Checks for BTC zero address per network |

---

## 7. Export Only What's Consumed

### Origin
PR #99 — pegin and pegout automation demo
> "is it really needed to export main function?"

### Why it matters
Exporting a function signals it's part of a public contract — consumers may depend on it, it shows up in autocomplete, and refactoring becomes harder. If nothing outside the file calls it, don't export it.

### ❌ Bad
```ts
// src/index.ts exports main — nothing external needs it
export async function main(): Promise<void> {
  // ...
}
export { main }  // ← unnecessary
```

### ✅ Good
```ts
// Only export if actually consumed externally
async function main(): Promise<void> {
  // ...
}

// Start the application
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => { ... })
}
// No export needed
```

### Visibility rule of thumb
- **`export`** → consumed by another module or is part of the public package API
- **no export** → module-internal helpers, script entry points, single-file utilities

---

## 8. Error Taxonomy: FlyoverError vs plain Error

### Origin
Codebase analysis — `src/client/httpClient.ts`, `src/sdk/flyover.ts`

### Why it matters
There are two error types in this codebase and each has a specific role. Mixing them makes errors harder to handle programmatically for consumers.

| Error type | When to use |
|-----------|-------------|
| `FlyoverError` (static factory) | Domain errors: bad input, security violations, protocol violations |
| `new Error(string)` | Programming guards: not connected, not initialized, internal invariants |

### ❌ Bad
```ts
// Domain error (bad user input) thrown as plain Error — can't be caught specifically
if (!isRskAddress(address)) {
  throw new Error(`${address} is not a valid RSK address`)
}

// Security violation thrown as plain Error — recoverable flag lost
throw new Error('Quote hash mismatch')
```

### ✅ Good
```ts
// Domain error — use FlyoverError static factory
if (!isRskAddress(address)) {
  throw FlyoverError.invalidRskAddress(address)
}

// Security violation — non-recoverable, includes serverUrl for consumer context
throw FlyoverError.invalidQuoteHashError(provider.apiBaseUrl)

// Programming guard — plain Error is fine here
private checkLbc(): void {
  if (this.lbc === undefined) {
    throw new Error('Not connected to RSK')  // ← OK: internal invariant
  }
}
```

### FlyoverError static factories (existing)
```ts
FlyoverError.withReason(message)                          // generic recoverable
FlyoverError.invalidQuoteHashError(serverUrl)             // hash mismatch
FlyoverError.manipulatedQuoteResonseError(serverUrl)      // response manipulation (note: typo in name)
FlyoverError.invalidSignatureError({ serverUrl, signature, address })
FlyoverError.untrustedBtcAddressError({ serverUrl, address })
FlyoverError.unsupportedBtcAddressError(address)
FlyoverError.wrongNetworkError(mainnet)
FlyoverError.invalidRskAddress(address)
FlyoverError.checksumError(addresses)
FlyoverError.protocolPaused({ reason, timestamp })
```

> **Note:** `manipulatedQuoteResonseError` contains a typo (`Resonse` → `Response`). Do not fix it — it is a public static method and renaming breaks consumer catch blocks.

---

## 9. Required Fields Validation Pattern

### Origin
Codebase analysis — `src/sdk/getQuote.ts`, `src/api/index.ts`

### Why it matters
Runtime validation of required fields prevents confusing downstream errors when the server receives incomplete payloads. The pattern is: define a `string[]` constant alongside the type, then call `validateRequiredFields` at function entry.

### ❌ Bad
```ts
// No validation — missing fields cause confusing HTTP errors or wrong behavior
export async function acceptPegoutQuote(provider: LiquidityProvider, quote: PegoutQuote): Promise<AcceptedPegoutQuote> {
  const url = provider.apiBaseUrl + Routes.acceptPegoutQuote
  return await httpClient.post(url, { quoteHash: quote.quoteHash })
}
```

### ✅ Good
```ts
// Define required fields alongside the type in src/api/index.ts
export const pegoutQuoteRequiredFields = ['quoteHash', 'quote'] as const

// Validate at function entry
export async function acceptPegoutQuote(
  httpClient: HttpClient,
  provider: LiquidityProvider,
  quote: PegoutQuote
): Promise<AcceptedPegoutQuote> {
  validateRequiredFields(quote, ...pegoutQuoteRequiredFields)
  validateRequiredFields(provider, ...providerRequiredFields)

  const url = provider.apiBaseUrl + Routes.acceptPegoutQuote
  return await httpClient.post(url, { quoteHash: quote.quoteHash })
}
```

### Test the validation
```ts
test('throw if required fields missing', async () => {
  await expect(
    acceptPegoutQuote(client, provider, {} as any)
  ).rejects.toThrow(`Validation failed for object with following missing properties: ${pegoutQuoteRequiredFields.join(', ')}`)
})
```

---

## 10. Module Mocking in Facade Tests

### Origin
Codebase analysis — `src/sdk/flyover.test.ts`

### Why it matters
The `Flyover` class is a thin facade that delegates to feature modules (`getQuote`, `acceptQuote`, etc.). Tests for `Flyover` should verify **delegation and orchestration**, not re-test the internals. Use `jest.mock()` to isolate the facade.

### ✅ The correct pattern (from flyover.test.ts)
```ts
// 1. Mock all feature modules at top level
jest.mock('./getQuote')
jest.mock('./acceptQuote')
jest.mock('./acceptAuthenticatedQuote')

// 2. Cast to jest.Mock for TypeScript
const mockedGetQuote = getQuote as jest.Mock<typeof getQuote>

// 3. Set return values per test
mockedGetQuote.mockResolvedValue([quoteMock])

// 4. Assert the facade called through correctly
await flyover.connectToRsk(rskConnectionMock)
const result = await flyover.getQuotes(quoteRequestMock)

expect(mockedGetQuote).toHaveBeenCalledWith(
  expect.objectContaining({ network: FAKE_NETWORK }),
  expect.anything(), // httpClient
  expect.anything(), // lbc
  providerMock,
  quoteRequestMock
)
```

### ❌ Bad
```ts
// Don't replicate getQuote's internal HTTP logic inside flyover.test.ts
// Don't use real HTTP clients in unit tests
// Don't test quote hash validation in flyover.test.ts (that's getQuote.test.ts's job)
```

---

## Summary: Patterns at a Glance

| # | Pattern | Source | Severity |
|---|---------|--------|----------|
| 1 | Use `jest.fn()` for captcha resolver | PR #68 | High — silent test pass |
| 2 | Use `rejects`/`resolves` matchers | PR #49 | High — silent test pass |
| 3 | New API fields in camelCase | PR #64 | High — compat debt if wrong |
| 4 | Never remove `@deprecated` markers | PR #67 | High — breaks older LPS |
| 5 | Decompose deeply nested functions | PR #99 | Medium — readability/testability |
| 6 | Don't duplicate core SDK utilities | PR #99 | Medium — maintenance |
| 7 | Export only publicly consumed members | PR #99 | Low — encapsulation |
| 8 | `FlyoverError` for domain errors | Codebase | High — consumer experience |
| 9 | Required-field arrays + `validateRequiredFields` | Codebase | Medium — safety |
| 10 | Mock feature modules in facade tests | Codebase | Medium — test isolation |
