# Missive SEO Content QA — Chrome extension

A Manifest V3 side-panel extension that runs the **existing** Content QA tool on whatever page is open in Chrome. It uses the same backend endpoint, engine, AI review and usage limits as https://tool-blue-three.vercel.app/content-qa. It adds no new backend, no AI keys and no new database models.

## Quick start (Windows)

```powershell
cd extension
npm install
npm run build:extension
```

Then in Chrome:

1. Open `chrome://extensions`.
2. Turn on **Developer mode** (top right).
3. Click **Load unpacked** and pick the `extension\dist-extension` folder.
4. Pin **Missive SEO Content QA** from the puzzle-piece menu.
5. Open any article, click the Missive icon (or press `Alt+Shift+M`), then click **Analyze page**.

After rebuilding, click the reload icon on the extension's card in `chrome://extensions`, then reopen the side panel.

## Which backend does it call?

| Command | API used | Use it for |
|---|---|---|
| `npm run build:extension` | `toolapi.missive.digital/api` (production) | Real use / Web Store |
| `npm run dev` (watch build) | `http://localhost:5000/api` (from `.env.development`) | Developing against your local server |
| `npm run preview` | `localhost:5000` + mocked Chrome APIs | UI work without loading the extension |

To point at a different server, create `extension/.env.production` (or `.env.development`) with
`VITE_API_BASE_URL=https://your-api.example.com/api` and rebuild. The manifest's host permission is generated from this value.

### Testing against your local backend

```powershell
# terminal 1
cd server
npm run dev

# terminal 2
cd extension
npm run dev
```

Load `dist-extension` as above. `npm run dev` rebuilds on save; reload the extension after each change.

### UI preview without Chrome extension APIs

`npm run preview` and open http://localhost:5180/dev/preview.html. The side panel runs in a normal tab against fixture pages in `dev/fixtures/`. Use `?fixture=article|product|empty|restricted` and `&mock=limit|blocked|ratelimit` to see each state. Nothing in `dev/` is included in the build.

### Automated tests

```powershell
npm test          # extractor, payload formatter, SEO checks (vitest + jsdom)
npm run typecheck
cd ..\server; npm run test:cors   # includes the extension-origin CORS cases
```

## Debugging

The extension has three separate parts, and each has its own DevTools window:

| Part | How to open its DevTools | What shows up there |
|---|---|---|
| **Side panel** (UI + API calls) | Right-click inside the panel → **Inspect** | React errors, **Network** tab with `/content-qa/analyze` requests and responses |
| **Service worker** (opens panel, injects extractor) | `chrome://extensions` → extension card → **service worker** link | Injection and messaging errors |
| **Content script** (reads the page) | Normal page DevTools (F12) → Console context dropdown → *Missive SEO Content QA* | Extraction errors on that page |

Also check the **Errors** button on the extension's card in `chrome://extensions`. It collects uncaught errors from all three parts.

**Readable stack traces:** use `npm run dev`. Development builds include source maps; production builds don't.

**Inspect stored data** (run in the side panel console):

```js
await chrome.storage.local.get()    // device ID, settings, linked email
await chrome.storage.session.get()  // cached reports
```

**See exactly what the extractor reads from a page.** Click the toolbar icon on the page first, then run this in the **service worker** console:

```js
const [t] = await chrome.tabs.query({ active: true, lastFocusedWindow: true })
await chrome.scripting.executeScript({ target: { tabId: t.id }, files: ['content-script.js'] })
const r = await chrome.tabs.sendMessage(t.id, { type: 'MISSIVE_QA_EXTRACT' })
console.log(r.page.contentRoot, r.page.wordCount, r.page.blocks)
```

`contentRoot` tells you which strategy found the main content (`article`, `main`, `paragraph-density`, `body`, ...). If it reads the wrong area, adjust `findMainContentRoot` or `NOISE_TOKEN` in `src/utils/pageExtractor.ts`, then add a case to `test/pageExtractor.test.ts`.

**Server side:** analysis errors are logged by the Express server: in your terminal locally, or in the Render dashboard logs in production. The extension only ever shows friendly messages, so check the server log for the real cause.

### Common problems

| Symptom | Likely cause | Fix |
|---|---|---|
| "Access needed" | Chrome's activeTab grant ends when you switch tabs or navigate | Click the toolbar icon again, or enable **Allow on all sites** in Settings |
| "Server unavailable" | API down, wrong `VITE_API_BASE_URL`, or local server not running | Side panel → Network tab; check `manifest.json` `host_permissions` matches the API |
| Stuck on "Running Content QA" for ~1 min | Render cold start or slow AI provider | Wait (timeout is 120 s); check Render logs |
| "Complimentary limit reached" | Device used its free runs | Raise the limit for the device ID (shown in Settings) in `/admin` → Devices |
| Changes don't show up | Old build still loaded | Rebuild, click reload on the extension card, close and reopen the panel |
| Works locally, fails on Render | Server-side change not deployed, or tool disabled in admin | Check `/api/health` and the tool's enabled flag in `/admin` → Tools |

The UI can also be debugged without loading the extension: `npm run preview` → http://localhost:5180/dev/preview.html (see above).

## How it works

```
Toolbar click ──► service worker ──► chrome.sidePanel.open()
                                     │  (click grants activeTab for that tab)
Side panel ──EXTRACT_PAGE──► service worker ──scripting.executeScript──► content-script.js
          ◄──────────── PageContent (main text, headings, links, images, meta, JSON-LD) ◄──┘
Side panel ──POST /api/content-qa/analyze { sourceHtml } (x-device-id)──► existing Express route
                                         (same importer as the web app's "Import from URL")
          ◄──── existing report: 12 pillar scores, findings, AI summary/top fixes ◄──┘
```

* **Content extraction** (`src/utils/pageExtractor.ts`): picks `<article>`, then `<main>`/`[role=main]`, common CMS containers, then a paragraph-density fallback. It skips nav, header-with-nav, footer, aside, forms, dialogs, hidden elements, and cookie/ad/share/newsletter blocks. Output is the same markdown shape (`#` headings, `-` list items) the server's URL importer produces.
* **Same results as the web app.** The extension sends the page HTML (scripts, styles and media stripped) as `sourceHtml`. The server runs it through `extractArticleFromHtml`, the exact function behind the web app's "Import from URL", and analyzes it with the web form's defaults (`contentTemplate: blog`, `supportingLineMode: recommended`, `insightFirstScope: DOCUMENT_INTRO`). Same content and same options give the same scores. `server/test/contentQaParity.test.mjs` (`npm run test:parity`) guards this. The AI-written text (summary, top fixes) can still vary between any two runs, on the website too; scores never come from the AI.
* **Large pages:** pages over 4.5 MB of HTML fall back to the extension's own extraction (`src/utils/contentFormatter.ts`), and the panel says results may differ slightly. Content over 50,000 characters is cut at a paragraph boundary on the server (the web form refuses such content outright).
* **Local extraction**: capped at 50,000 characters, the same limit as the web form. The opening is kept in full, then the rest of the heading outline plus the first paragraph under each heading. Blocks are never cut mid-sentence.
* **On-page SEO checks** (`src/services/pageChecks.ts`): title and meta length, H1, heading hierarchy, canonical, robots, lang, viewport, alt text, empty or generic anchors, internal links, Open Graph, Twitter card and JSON-LD. These run locally and are free: they are not sent to the server and do not use an analysis.
* **Results** are cached per URL in `chrome.storage.session`, so reopening the panel restores them. The cache clears when the browser closes.

## Authentication and usage limits

The backend has no end-user login. Tool usage is metered per anonymous **device ID** (the `x-device-id` header, enforced by `server/src/middleware/toolAccess.js`), plus a per-IP hourly limit. The extension reuses that system unchanged:

* It generates a random UUID once and stores it in `chrome.storage.local`. This is not a credential.
* Each analysis counts against the same `content-qa` tool config (`deviceLimit`, `hourlyLimit`, enabled flag, block list) that admins already manage in `/admin`.
* At the limit (HTTP 429 `deviceLimitReached`), the panel shows the same "request extended access" form as the web app, which calls `POST /api/devices/link-email`. Admins can then raise that device's limit from the Devices page. The device ID is shown on the extension's Settings page for support.
* "Clear cached reports" does **not** reset the device ID, so it cannot be used to reset the limit.

The extension's device ID is separate from the website's, so a user gets a separate free quota in the extension, just as they would in another browser.

## Security

* No AI or server secrets in the extension. `config.ts` holds only the public API URL. AI calls happen server-side through `server/src/utils/aiProvider.js`.
* Client-safe values: `VITE_API_BASE_URL`, `VITE_WEB_APP_URL`. Server-only values stay in `server/.env`: `AI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY`, `ZEN_API_KEY`, `DATABASE_URL`, `JWT_SECRET`, `RESEND_API_KEY`.
* Minimal permissions: `activeTab`, `scripting`, `sidePanel`, `storage`, and host access to the API origin only. "All sites" access is an optional opt-in on the Settings page.
* No content script runs on pages by default. It is injected only after the user opens the extension on a tab.
* Page content is treated as untrusted. It is rendered only as React text (no `innerHTML`, no `eval`, no remote scripts), with CSP `script-src 'self'`.

### CORS

Extension pages with host permission for the API are not blocked by CORS, so the extension works against the current production server as-is. To have the API also send explicit CORS headers for the extension, set exact IDs on the server:

```
EXTENSION_IDS=<32-char id from chrome://extensions>[,<web store id>]
```

Only exact `chrome-extension://<id>` origins are accepted; wildcards are never accepted. Unpacked and Web Store builds have different IDs.

## Publishing to the Chrome Web Store

1. Bump `version` in `package.json` (the manifest version is generated from it).
2. Run `npm run build:extension`.
3. Zip the *contents* of `dist-extension` (manifest.json at the zip root):
   `Compress-Archive -Path dist-extension\* -DestinationPath missive-seo-content-qa.zip -Force`
4. Upload it in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole), add screenshots (1280×800) and a 440×280 promo tile, and link a privacy policy.
5. Add the published extension ID to `EXTENSION_IDS` on the server (optional; see CORS).

**Permission justifications for the listing:**

| Permission | Why |
|---|---|
| `activeTab` | Read the current page only after the user clicks the extension. |
| `scripting` | Inject the read-only content extractor into that tab on demand. |
| `sidePanel` | Show the analysis UI beside the page. |
| `storage` | Keep the device ID, settings and recently viewed reports. |
| Host: Missive API | Send the page text to the Missive Content QA service for analysis. |
| Optional `http(s)://*/*` | User opt-in, so the panel can follow them across tabs without re-clicking. |

**Data disclosure:** website content (the HTML of a page the user chooses to analyze, with scripts, styles and media removed) is sent to the Missive API. It is not sold or used for anything other than the analysis. The server stores up to the first 5,000 characters with the result, as it does for the web tool.
