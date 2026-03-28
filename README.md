# AI Hub Product Feed Visualiser

A web app for receiving, storing, and visualising product feeds from AI Hub instances. Each AI Hub instance posts CSV product feeds to a source-specific webhook URL, which are stored in Supabase and displayed as a browsable product catalogue.

## Features

- **Multi-source support** — multiple AI Hub instances post to separate URLs; each gets its own independent catalogue
- **Product catalogue** — browse all products from the latest feed with images, pricing, and full attribute detail
- **Feed history** — view all past feed runs per source with full/delta type detection
- **Compare feeds** — diff any two feed runs to see added, removed, and changed products
- **Auto-registration** — new sources are created automatically on first POST, no pre-configuration needed
- **Delete sources** — remove a source and all its data from the catalogues page

## Webhook

Point your AI Hub instance to:

```
POST https://<your-domain>/api/feed/ingest/<source-name>
Content-Type: text/csv
```

`<source-name>` is a URL-safe slug (e.g. `john-lewis`, `acme-store`). The source is created automatically on the first ingest.

### Feed type detection

The feed type (`full` or `delta`) is determined by:
1. `X-Feed-Type: full` or `X-Feed-Type: delta` request header (explicit override)
2. Fewer than 10 rows → `delta`; otherwise → `full` (heuristic fallback)

### Limits

| Limit | Value |
|---|---|
| Max products per feed | 500 |
| Max feed runs stored per source | 50 (oldest dropped when exceeded) |
| Max sources | 20 |

## Tech stack

- [Astro 5](https://astro.build) — SSR framework
- [React 19](https://react.dev) — interactive islands
- [Tailwind CSS 4](https://tailwindcss.com)
- [Supabase](https://supabase.com) — PostgreSQL database
- [Netlify](https://netlify.com) — hosting

## Local development

### Prerequisites

- Node.js 22 (see `.nvmrc`)
- A Supabase project (cloud or local via Docker)

### Setup

```bash
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY

npm install
npx supabase db push   # apply migrations to your Supabase project
npm run dev            # starts on http://localhost:3000
```

### Environment variables

| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (used server-side to bypass RLS) |

## Deployment (Netlify)

1. Push this repo to GitHub
2. In Netlify: **Add new site → Import an existing project**, connect the repo
3. Build settings are pre-configured in `netlify.toml` — no changes needed
4. Add the three environment variables in **Site configuration → Environment variables**:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `SUPABASE_SERVICE_KEY`
5. Deploy

## Available scripts

```bash
npm run dev        # start dev server on port 3000
npm run build      # production build
npm run preview    # preview production build
npm run lint       # ESLint
npm run lint:fix   # auto-fix lint issues
npm run format     # Prettier
```
