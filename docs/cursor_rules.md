# Cursor Rules

Rules live in `.cursor/rules/`. Project skill: `.cursor/skills/validate-minimal-changes/SKILL.md`

| Rule                       | File                                             | Scope                       | Description                                             |
| -------------------------- | ------------------------------------------------ | --------------------------- | ------------------------------------------------------- |
| Validate & minimal changes | `validate-minimal-changes.mdc`                   | Always                      | Validate first/after, minimal diffs, fix prod not tests |
| Project conventions        | `project-conventions.mdc`                        | Always                      | Commits, PRs, i18n, pnpm                                |
| Failing tests              | `failing-tests-debugging.mdc`                    | Always                      | Debug implementation before weakening tests             |
| Next.js webapp             | `next-webapp.mdc`                                | `src/**/*.{ts,tsx}`         | App Router, HeroUI, next-intl, modules/                 |
| Testing                    | `testing.mdc`                                    | `src/**/*.test.*`, `e2e/**` | Vitest + Playwright                                     |
| Git workflow               | `git-workflow.mdc`                               | Always                      | Feature branches, pnpm                                  |
| CI workflows               | `ci-workflows.mdc`                               | `.github/workflows/**`      | build-test-webapp, deploy, pr-review                    |
| Cost / concise             | `cost-optimization.mdc`, `concise-responses.mdc` | Always                      | Token efficiency, brief replies                         |

See `README.md` for stack and folder layout. API reference: `docs/api.md` (+ `docs/api_zh.md`).
