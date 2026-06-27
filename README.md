# Rete Web App

Web front end for **Rete** — a spaced repetition (SRS) product for long-term retention. This Next.js app ships the marketing home page, account flows (login / register / profile), in-app areas such as dashboard and library, and an MDX-based **user guide** with full-text search.

Authenticated features talk to a **remote HTTP API** (see `src/utils/request.ts` for the base URL). JWT auth is stored in an HTTP-only cookie (`retentio_token`) and attached to API requests from server code.

## Tech stack

- **Framework**: [Next.js](https://nextjs.org/) 16 (App Router)
- **UI**: React 19, [HeroUI](https://www.heroui.com/) (`@heroui/react`), [Tailwind CSS](https://tailwindcss.com/) 4 (via `@tailwindcss/postcss` — no `tailwind.config.ts` in this repo)
- **i18n**: [next-intl](https://next-intl-docs.vercel.app/) with UI strings in `src/i18n/locales/`; locale is chosen with a **`locale` cookie** (`en` or `zh`), not locale-prefixed URLs
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes) (light / dark)
- **Guide content**: MDX (`@next/mdx`, `@mdx-js/*`) with front matter; per-locale files under `src/content/{en,zh}/`
- **Guide search**: [Fuse.js](https://fusejs.io/) over a JSON index generated into `public/search-index/` (gitignored; created by `pnpm generate:md`)
- **Validation**: Zod
- **Logging**: Pino (+ `pino-pretty` in dev)
- **Package manager**: pnpm

## Project structure

```
retentio-webapp/
├── public/                    # Static assets (search index output is generated here)
├── scripts/
│   └── generate-index.mjs     # Builds Fuse search index from MDX under src/content
├── src/
│   ├── app/                   # App Router: layouts, pages, metadata, robots/sitemap
│   │   ├── (default)/         # Shared shell (sidebar, nav)
│   │   │   ├── (public)/      # Home, login, register, privacy, terms, guide
│   │   │   │   └── guide/     # Catch-all MDX guide: [[...slug]]/page.tsx
│   │   │   ├── dashboard/
│   │   │   ├── library/
│   │   │   ├── profile/
│   │   │   └── layout.tsx
│   │   ├── globals.css        # Global styles + Tailwind entry
│   │   ├── layout.tsx         # Root layout (fonts, providers, metadata)
│   │   ├── not-found.tsx, forbidden.tsx, unauthorized.tsx
│   │   ├── robots.ts, sitemap.ts
│   │   └── ...
│   ├── components/            # UI by area: app/, auth/, guide/, layout/, home/, MDX/, retentio/
│   ├── config/                # App constants, guide sidebar (`sidebar.ts`)
│   ├── content/               # MDX guide sources: en/, zh/
│   ├── hooks/
│   ├── i18n/                  # next-intl request config + locale JSON
│   ├── lib/                   # logger, locale helpers, token helpers, UI helpers
│   ├── modules/               # Domain-oriented code (e.g. `auth/`: actions, service, Zod schemas)
│   ├── provider/              # React context providers (theme, app shell)
│   ├── utils/                 # Shared helpers (e.g. `request.ts` for API calls)
│   ├── mdx-components.tsx     # MDX component map
│   └── proxy.ts               # Request filtering helper (not wired as Next middleware in this repo)
├── types/                     # Ambient / shared TypeScript declarations (MDX, CSS, etc.)
├── eslint.config.mjs
├── next.config.ts             # MDX + next-intl plugin wiring; tracing for guide
├── package.json
├── postcss.config.mjs         # Tailwind PostCSS plugin
├── pnpm-workspace.yaml        # pnpm settings (e.g. ignored optional native deps)
└── tsconfig.json
```

## Prerequisites

- **Node.js** 20+ recommended (aligned with `@types/node` in this project)
- **pnpm**

## Getting started

```bash
git clone https://github.com/otus-io/retentio-webapp.git
cd retentio-webapp
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

`dev`, `build`, and `start` all run **`generate:md` first** so the guide search index exists under `public/search-index/`.

## Scripts

| Command                      | Purpose                                                          |
| ---------------------------- | ---------------------------------------------------------------- |
| `pnpm dev`                   | Regenerate MDX search index, then `next dev`                     |
| `pnpm build`                 | Regenerate index, then production build                          |
| `pnpm start`                 | Regenerate index, then `next start`                              |
| `pnpm lint`                  | ESLint with `--fix` on the whole tree                            |
| `pnpm lint:ci`               | ESLint check only (no writes; used in GitHub Actions)            |
| `pnpm generate:md`           | Only rebuild `public/search-index/` from `src/content`           |
| `./scripts/run-all-tests.sh` | Same as CI: `pnpm install --frozen-lockfile`, `lint:ci`, `build` |

## CI and pre-commit

- **GitHub Actions** (`.github/workflows/build-test-deploy-webapp.yml`): on pushes and pull requests to `main`, runs lint, unit tests, build, and e2e; deploys to production after CI passes on push to `main` (or manual **Run workflow**). Deploy secrets: `SERVER_HOST`, `SERVER_USERNAME`, `SERVER_SSH_KEY`. See workflow file comments for server prerequisites.
- **PR assistant** (`.github/workflows/pr-review.yml`): on non-draft PR **opened**, auto-fills the PR description; on **opened** / **synchronize**, runs Claude Code review via `anthropics/claude-code-action`. Set repository secret **`ANTHROPIC_API_KEY`** and install the [Claude GitHub App](https://github.com/apps/claude).
- **Pre-commit**: Husky runs [lint-staged](https://github.com/lint-staged/lint-staged) on staged `*.{ts,tsx,js,jsx,mjs,cjs,md,mdx,json,jsonc,yml,yaml}` files (`eslint --fix`), then `pnpm test` (Vitest). E2E tests run in CI only. Hooks are installed when you run `pnpm install` (`prepare` script). If `.husky/pre-commit` does not run after cloning, run `pnpm install` again from the repo root.

## Configuration highlights

- **Next.js + MDX + i18n**: `next.config.ts`
- **Public site URL** (metadata, sitemap, robots): `SITE_URL` in `src/config/index.ts` (`https://web.retentio.app`)
- **API base URL** (for auth/profile and other server-side `fetch` calls): `src/utils/request.ts`
- **Protected app routes**: enforced in route handlers (e.g. dashboard redirects to login if there is no valid session), not via a root `middleware.ts` file

## License

Private project.
