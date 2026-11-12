---
name: testing
description: Vitest and Playwright test conventions for retentio-webapp. Use when writing, editing or running tests under tests/, including tests/e2e.
---

# Testing Conventions

## Unit / component (Vitest)

- Live under `tests/`, mirroring `src/` (e.g. `tests/proxy.test.ts`, `tests/components/app/AppButton.test.tsx`)
- Use `@testing-library/react` for components; mock modules with `vi.mock`
- Import app code via `@/` (e.g. `@/proxy`, `@/components/app/AppButton`)

```bash
pnpm test                    # all unit tests
pnpm test tests/proxy.test.ts
pnpm test tests/components/app/
```

## E2E (Playwright)

- Specs in `tests/e2e/` (e.g. `tests/e2e/auth.spec.ts`)
- CI runs Chromium with secrets `E2E_USERNAME`, `E2E_PASSWORD`

```bash
pnpm test:e2e
pnpm test:e2e:ui             # debug UI
```

## Blackbox principle

Fix production bugs first. Do not weaken tests to hide failures. See "Debugging Failing Tests" in `AGENTS.md`.
