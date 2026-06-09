# Trousseau

> Needed this real quick for myself, vibecoded in a minute. Thx Claude!

Trousseau is an open-source tool that helps French rental applicants assemble a polished _dossier de candidature locative_ — cover page, table of contents, per-person sections, watermarked documents — and download it as a single PDF. The name is a play on _trousseau de clés_ (key ring) and _trousseau de documents_ — the bundle that gets you the keys.

Everything runs **100% client-side**: your IDs, payslips, tax returns and everything else stay in your browser via IndexedDB. No backend, no upload, no telemetry.

## Features

- Cover page with applicant info and optional portrait photo
- Per-person sections (tenants + guarantors) with employment, income, and free-form situation summary
- Hierarchical table of contents with clickable links
- Drag-and-drop file organization across containers
- Auto-generated section dividers with mini-TOC
- Discreet watermark on each uploaded document
- Multi-project sidebar with autosave to IndexedDB
- Toggle per-person info summaries on / off at generation time

## Quick start (self-host with Docker)

A multi-arch image (`linux/amd64` + `linux/arm64`) is published to GitHub Container Registry on every release.

```bash
# Pull the latest release
docker run -d --name trousseau -p 3000:3000 ghcr.io/lucasbarrez/trousseau:latest
```

Then open <http://localhost:3000>.

Or with `docker-compose.yml`:

```yaml
services:
  trousseau:
    image: ghcr.io/lucasbarrez/trousseau:latest
    restart: unless-stopped
    ports:
      - "3000:3000"
```

### Behind a reverse proxy (Caddy / Traefik / Pangolin / nginx)

Remove the `ports:` block and put the service on your proxy's shared Docker network. Example for Pangolin:

```yaml
services:
  trousseau:
    image: ghcr.io/lucasbarrez/trousseau:latest
    restart: unless-stopped
    networks:
      - pangolin

networks:
  pangolin:
    external: true
```

The container listens on port `3000`.

### Build from source

```bash
git clone https://github.com/lucasbarrez/trousseau.git
cd trousseau
docker compose up -d --build
```

## Local development

Requirements: Node.js 22+, [pnpm](https://pnpm.io) 11+.

```bash
pnpm install
pnpm dev
```

The dev server runs on <http://localhost:3247>.

Useful scripts:

| Command                  | What it does                       |
| ------------------------ | ---------------------------------- |
| `pnpm dev`               | Next.js dev server with hot reload |
| `pnpm build`             | Production build (used by Docker)  |
| `pnpm lint`              | ESLint                             |
| `pnpm exec tsc --noEmit` | Type-check                         |

## Tech stack

- **[Next.js 16](https://nextjs.org)** (App Router, React 19, fully static export)
- **[Tailwind CSS 4](https://tailwindcss.com)**, **[Radix UI](https://www.radix-ui.com)**
- **[Zustand](https://github.com/pmndrs/zustand)** for state, **[idb](https://github.com/jakearchibald/idb)** for IndexedDB persistence
- **[@react-pdf/renderer](https://react-pdf.org)** + **[pdf-lib](https://pdf-lib.js.org)** for in-browser PDF assembly
- **[dnd-kit](https://dndkit.com)** for drag-and-drop

## Privacy

Trousseau has no backend. Your files, photos, and personal data are stored only in your browser's IndexedDB and never sent anywhere. Generating a PDF assembles it entirely client-side — the only network requests are to load the app itself (HTML, JS, CSS, fonts).

## Contributing

Issues and pull requests are welcome. Please use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages (`feat:`, `fix:`, `docs:`, `chore:`...) — releases and the changelog are generated automatically from commit history via [release-please](https://github.com/googleapis/release-please).

## License

[MIT](./LICENSE) © Lucas Barrez
