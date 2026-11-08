# ProImageKit

Privacy-first image tools built with Next.js 16. Every tool runs in the browser, so no file is ever uploaded. The site includes 6 converters, a compressor, a resizer, a cropper, rotate & flip, watermarks, a colour picker, a metadata viewer, an EXIF remover and a full image editor. It works offline and can be installed as an app.

See `PLAN.md` for the architecture, decisions and phase log. The original brief is in `docs/original-plan.txt`.

## Requirements
Node 24 (`nvm use`, see `.nvmrc`).

## Getting started locally
Copy the project **without** `node_modules` and `.next`, then:

```bash
npm ci
npm run dev                          # http://localhost:3000
```

The service worker (offline support) only runs in production builds: `npm run build && npm start`.

## Scripts
| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` / `npm start` | Production build and server |
| `npm run check` | Lint, typecheck, unit tests and build |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright browser tests, including accessibility (axe) and offline checks. Run `npm run build` first; install the browser once with `npx playwright install chromium`. |

## Writing blog articles
Articles are files in **`content/blog/`**. There's no blog index page; each article gets its own URL, and the 10 most recently updated articles are listed above the footer on every page.

1. Copy `content/blog/_template.mdx` (it documents every option) and rename it, e.g. `how-to-resize-photos.mdx`. The file name becomes the URL: `/blog/how-to-resize-photos`.
2. Fill in the frontmatter (the `---` block at the top) and write the article below it in Markdown.
3. Put images in `public/blog/<slug>/` and reference them as `/blog/<slug>/image.jpg`.
4. Preview with `npm run dev`; drafts (`status: draft`) are only visible there. Set `status: published` and deploy.

| Field | Required | Notes |
|---|---|---|
| `title`, `description` | yes | Description is the meta description (aim for 120–160 characters). |
| `status` | yes | `draft` or `published`. |
| `publishedAt` | yes | `2026-09-29`. A future date schedules the article: it appears on the first deploy after that date. |
| `updatedAt` | | Last update; "Latest articles" and the sitemap use it. |
| `slug`, `author`, `tags` | | Slug defaults to the file name, author to the site name. |
| `coverImage` + `coverAlt` | | Shown at the top and used as the social image (1200×630 is ideal). |
| `relatedTools` | | Tool slugs shown as "Try it yourself" cards. |
| `seo.title`, `seo.description`, `seo.keywords` | | Overrides for search results. |
| `seo.canonical`, `seo.noindex`, `seo.ogImage` | | For cross-posted articles, hidden articles and custom share images. |

- Use `.mdx` to add components: `<Callout type="tip|info|warning">…</Callout>` and `<ToolCard slug="watermark-adder" />`. Use `.md` for plain Markdown.
- Tables, task lists and strikethrough (GitHub-flavoured Markdown) work, and headings get shareable `#anchor` links.
- Every file is validated at build time. A misspelled field, a missing `coverAlt`, an unknown tool slug or a duplicate slug stops the build with an error naming the file and field.
- Each article automatically gets SEO metadata (title, description, canonical, Open Graph "article" tags with dates), `BlogPosting` and breadcrumb structured data, a generated social image when there's no cover, a sitemap entry and offline caching.

## Configuration
| Setting | Where | Notes |
|---|---|---|
| Site URL | `NEXT_PUBLIC_SITE_URL` env var | Used for canonical URLs, Open Graph images, the sitemap and robots.txt. Set it to your real domain, e.g. `https://example.com`. |
| Site name, tagline | `src/config/site.ts` | "ProImageKit" is a placeholder. |
| Free / Pro limits | `src/config/plans.ts`, `src/hooks/use-pro-gate.ts` | Everything is free; the Pro dialog is a stub with no payment. |
| Tools, SEO text, FAQs | `src/lib/tools-registry.ts` | The single source of truth for pages, sitemap, compare page and structured data. |
| Security headers / CSP | `next.config.ts` | `connect-src 'self'` and `form-action 'none'` make the browser block any upload. |
| App icons | `scripts/generate-icons.py` | Regenerates `public/icons/*` and `src/app/favicon.ico` (needs `pip install pillow`). |

## Deploying to Vercel
1. Push the project to a Git repository and import it in Vercel. It detects Next.js automatically; no build settings are needed.
2. Add the environment variable `NEXT_PUBLIC_SITE_URL` with your production URL, then redeploy.
3. The security headers from `next.config.ts` apply automatically. `.htaccess` is only for the Apache development server and is ignored by Vercel.
4. Each deploy refreshes the offline cache (pages are revisioned by the commit SHA).
5. **Plan:** Vercel's free Hobby plan is for non-commercial use only. Switch to Pro before adding ads or payments.

### Enabling analytics (optional)
Analytics are off. To add a privacy-friendly, cookie-free service such as Plausible or Umami:
1. Uncomment the script in `src/app/layout.tsx`.
2. Add its host (e.g. `https://plausible.io`) to `script-src` and `connect-src` in `next.config.ts`, otherwise the CSP blocks it.
3. Update the "Cookies and tracking" section of `/privacy`.

## Test images
`tests/fixtures/` holds sample images: HEIC, a rotated JPG with GPS data, metadata-rich JPG/PNG/WebP, transparent WebP/PNG, a large photo and a logo. Regenerate them with `python tests/fixtures/generate.py` (needs `pip install pillow pillow-heif`).
