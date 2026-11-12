<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

# Retentio Webapp: agent instructions

Shared instructions for AI coding agents (Claude Code, Cursor, Codex). Everything in this file
applies to every task. `CLAUDE.md` imports this file.

## Skills (read on demand)

Task-specific guidance lives in `.agents/skills/<name>/SKILL.md`. Read the matching skill before
working in its area:

| Skill          | Read it when                                     |
| -------------- | ------------------------------------------------ |
| `next-webapp`  | Writing or editing `src/**/*.{ts,tsx}`           |
| `testing`      | Writing, editing or running tests under `tests/` |
| `ci-workflows` | Reading or editing `.github/workflows/`          |
| `heroui-react` | Building UI with HeroUI components               |

`.claude/skills` is a symlink to `.agents/skills`, so every tool reads the same files.

## Rete Web App Conventions

### Project Overview

Production Next.js web app: marketing, auth, dashboard/library, MDX user guide. Talks to remote Rete HTTP API via `src/utils/request.ts`. JWT in HTTP-only cookie `retentio_token`.

### Commit & PR Conventions

- Commit/PR title: `<type>(<scope>): <subject>` in imperative mood, under 50 chars
- Types: feat, fix, docs, style, refactor, perf, test, chore
- Scopes: auth, deck, fact, guide, ui, api, ci
- Keep PRs focused; squash and merge for feature branches

### Code Style

- **TypeScript/React**: ESLint (`pnpm lint:ci`), Prettier via lint-staged
- Prefer clear naming; comments only for non-obvious logic
- User-visible strings in `src/i18n/locales/` (en + zh + ja) — no hardcoded copy in components

### Documentation

- User-facing docs: English + Chinese where the repo already pairs them (e.g. `docs/api.md` + `docs/api_zh.md`)
- Guide content: `src/content/en/` and `src/content/zh/` MDX

### Key Principles

- Never modify production code solely to make tests pass — fix real bugs first
- CI must pass: `pnpm lint:ci`, `pnpm test`, `pnpm build`, `pnpm test:e2e` (on PRs)

## Git Workflow

### Branch Protection

- **Never push directly to `main`** — use pull requests
- Create a feature branch for every change

### Branch Naming

- Descriptive, lowercase, hyphenated: `feat-catalog-detail`, `fix-auth-cookie`

### Workflow

1. Branch from `main`: `git checkout -b <branch-name>`
2. Commit on the feature branch (husky runs lint-staged, then `pnpm test`)
3. Push: `git push -u origin <branch-name>`
4. Open PR; wait for CI (`build-test-deploy-webapp.yml`)
5. Squash and merge after review

### Package manager

Use **pnpm** (`pnpm install`, not npm).

## Validate and keep changes minimal

**Mandatory on every prompt.** Merge of project validate workflow and [Karpathy behavioral guidelines](https://github.com/multica-ai/andrej-karpathy-skills).

### Think before coding

- Read relevant current code; do not rely on stale findings or assumptions.
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — do not pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- For review findings or bug reports: verify each item against current code. Fix only still-valid items; skip others with a brief reason.

### On every prompt

1. **Validate first** — Confirm the problem exists in current code before editing.
2. **Minimal diff** — Smallest correct change. No drive-by refactors, formatting sweeps, renames, or unrelated edits. Match local conventions in touched files.
3. **Simplicity** — No features, abstractions, configurability, or error handling beyond what the request needs. No helpers for single-use code.
4. **Surgical edits** — Every changed line should trace to the user's request.
5. **Do not change tests to pass** — Fix production code when behavior is wrong. Edit tests only when the test is wrong or the user asked for test changes.
6. **Web tests** — Vitest + Playwright patterns: the `testing` and `next-webapp` skills.
7. **Validate after** — Run scoped checks: `pnpm test`, `pnpm lint:ci`, and `pnpm build` when UI/routing changes warrant it.

**Question-only or review-only:** answer without editing unless the user asked for code changes.

### When tests fail

Investigate implementation first; fix production code; only then adjust tests if expectations or contract changed.

### Quick checklist

```
[ ] Verified against current code
[ ] Minimal, surgical diff
[ ] Failures fixed in prod code, not by weakening tests
[ ] Post-change validation run or N/A explained
```

## Debugging Failing Tests

When a test fails:

1. **Investigate the implementation first.** Reproduce the failure, read the code under test, and determine whether the bug is in production/source logic.
2. **Fix the real issue** in production code when you find one.
3. **Only then** consider changing the test — wrong expectations or a legitimately changed API/contract.

**Do not** change or relax the test solely to make it pass without understanding the underlying cause.

## Concise responses

- Default to **short answers**: lead with the outcome or decision, then minimal supporting detail only when needed.
- Prefer bullets over long paragraphs; skip preamble.
- Expand only when the task is complex, ambiguous, or the user asks for depth.

## Cost Optimization

- Keep internal reasoning minimal for straightforward tasks.
- Be concise in generated code — no boilerplate comments or filler docstrings.
- Batch independent tool calls; prefer Grep/Glob when you know the symbol or path.
- Do not re-read files already in context.
- For tests, follow the `testing` skill patterns instead of inventing new structure each time.
- After edits, confirm in one short sentence.
