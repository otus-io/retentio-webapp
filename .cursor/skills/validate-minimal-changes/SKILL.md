---
name: validate-minimal-changes
description: >-
  Enforces validate-first workflow, minimal diffs, and fixing prod code not tests
  on every task. Apply on every prompt, code change, bug fix, review finding,
  refactor, or review — always before writing or editing code.
---

# Validate and keep changes minimal

**Mandatory on every prompt.** Full text lives in:

`retentio-webapp/.cursor/rules/validate-minimal-changes.mdc`

When working in this repo, follow that file. Stack-specific guidance: `.cursor/rules/next-webapp.mdc`, `.cursor/rules/testing.mdc`. Validate with `pnpm lint:ci`, `pnpm test`, and `pnpm build` as appropriate.
