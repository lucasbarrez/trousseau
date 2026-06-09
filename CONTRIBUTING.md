# Contributing

Thanks for your interest in Trousseau. This document covers how the project is structured and how to get a change merged.

## Setup

```bash
git clone https://github.com/lucasbarrez/trousseau.git
cd trousseau
pnpm install
pnpm dev
```

Dev server runs on <http://localhost:3247>.

Before pushing:

```bash
pnpm lint
pnpm exec tsc --noEmit
```

## Commit & PR conventions

The project uses [Conventional Commits](https://www.conventionalcommits.org/) — release-please reads commit history on `main` to generate the changelog and bump the version automatically.

| Prefix | When to use it | Bumps |
|---|---|---|
| `feat:` | New user-facing capability | minor |
| `fix:` | Bug fix | patch |
| `perf:` | Performance improvement | patch |
| `refactor:` | Internal restructuring, no behavior change | patch |
| `docs:` | Docs only | none |
| `build:` | Build system, deps | none |
| `ci:` | CI config | none (hidden from changelog) |
| `chore:` | Misc maintenance | none (hidden from changelog) |
| `test:` | Tests only | none (hidden from changelog) |

Breaking changes: add `!` after the type (`feat!: ...`) and explain the impact in the commit body. This bumps the major version.

Examples:

```
feat: toggle to hide per-person info block on dividers
fix: HEIC photos now appear on the cover PDF
docs: document the Pangolin reverse-proxy setup
```

PR titles must also follow this convention — they're squash-merged into `main` and become the commit message that release-please reads.

## Architecture in one paragraph

Everything is client-side. State lives in a Zustand store (`src/lib/store.ts`), persisted to IndexedDB via `idb` (`src/lib/persistence.ts`). The PDF is assembled at generation time: the intro pages are rendered by `@react-pdf/renderer` (`src/lib/pdf/DossierDocument.tsx`), then merged with user-uploaded PDFs and images using `pdf-lib`, with the table of contents and section dividers drawn directly via `pdf-lib` primitives (`src/lib/pdf/draw.ts`). The orchestration lives in `src/lib/pdf/generate.tsx`.

## Reporting bugs

Use the bug report template — the browser console output is almost always the fastest way to identify the root cause.
