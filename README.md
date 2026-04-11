# Retentio Next

A modern web application built with Next.js 16, React 19, and Tailwind CSS. This project features authentication, dashboard, internationalization, and theming capabilities.

## Tech Stack

- **Framework**: Next.js 16.2.2 (App Router)
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4, HeroUI components
- **Internationalization**: next-intl
- **Theming**: next-themes (dark/light mode)
- **Content**: MDX with remark/rehype plugins
- **Validation**: Zod
- **Logging**: Pino
- **Package Manager**: PNPM
- **Language**: TypeScript

## Project Structure

```
retentio-next/
├── src/
│   ├── app/                    # Next.js app router pages
│   │   ├── (default)/         # Default layout group
│   │   │   ├── (public)/      # Public routes (login, register, guide, etc.)
│   │   │   │   ├── guide/     # Documentation guide
│   │   │   │   ├── login/
│   │   │   │   ├── register/
│   │   │   │   ├── privacy/
│   │   │   │   ├── terms/
│   │   │   │   └── page.tsx   # Homepage
│   │   │   ├── dashboard/     # Dashboard page
│   │   │   ├── library/       # Library page
│   │   │   ├── profile/       # Profile page
│   │   │   └── layout.tsx     # Default layout
│   │   ├── layout.tsx         # Root layout
│   │   ├── not-found.tsx
│   │   ├── unauthorized.tsx
│   │   ├── forbidden.tsx
│   │   ├── robots.ts
│   │   └── sitemap.ts
│   ├── components/            # React components
│   ├── lib/                   # Utility libraries
│   ├── hooks/                 # Custom React hooks
│   ├── styles/                # Global styles
│   └── types/                 # TypeScript type definitions
├── public/                    # Static assets
├── types/                     # Additional type definitions
├── scripts/                   # Build scripts
├── .agents/                   # Claude agent configurations
├── .vscode/                   # VSCode settings
├── .next/                     # Next.js build output
├── package.json               # Dependencies and scripts
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS configuration
├── postcss.config.mjs        # PostCSS configuration
├── eslint.config.mjs         # ESLint configuration
└── pnpm-workspace.yaml       # PNPM workspace configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- PNPM package manager

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd retentio-next
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Set up environment variables (if needed):
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

### Development

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Create a production build:

```bash
pnpm build
```

### Start Production Server

Start the production server:

```bash
pnpm start
```

### Linting

Run ESLint to check and fix code:

```bash
pnpm lint
```

## Features

- **Authentication**: Login and registration pages
- **Dashboard**: User dashboard interface
- **Documentation**: MDX-based guide system
- **Internationalization**: Multi-language support
- **Dark/Light Mode**: Theme switching
- **Responsive Design**: Mobile-friendly layout
- **Type Safety**: Full TypeScript support
- **Code Quality**: ESLint and formatting rules

## Scripts

- `pnpm dev` - Start development server with MDX generation
- `pnpm build` - Build for production with MDX generation
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm generate:md` - Generate MDX index files

## Configuration

- **Next.js**: `next.config.ts` - MDX configuration, internationalization
- **Tailwind**: `tailwind.config.ts` - Theme configuration
- **TypeScript**: `tsconfig.json` - TypeScript compiler options
- **ESLint**: `eslint.config.mjs` - Code quality rules

## License

Private project.
