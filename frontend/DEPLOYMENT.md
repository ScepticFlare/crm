# Frontend deployment, caching and version updates

The frontend is a Vite build (`npm run build` → `dist/`) served as a **Render Static Site** behind Render's CDN. Render's cache headers and the SPA rewrite are configured in the **Render dashboard**. This repository has no `render.yaml`: a dashboard-created service ignores one, and syncing one as a Blueprint could create a second service.

## Before every deployment

1. **Confirm the production branch.** Check Render → the static site → **Settings → Build & Deploy → Branch**. On 12 Nov 2026 the live site was built from `feature/bulk-email`, not `main` (see "Which code is deployed"). Make sure the branch you're about to push to is the one Render builds, and that it's the one you intend to serve.
2. Deploy the **backend first** when frontend and backend change together. A new frontend calling an endpoint that the old backend doesn't have yet fails until the backend is live.
3. After the deploy, open `/version.json` and check that `commit` and `branch` are what you just pushed.
4. Run the header check below once after changing the header rules.

## Why a user can be stuck on an old version

- `index.html` is small and points at content-hashed bundles (`/assets/index-<hash>.js`). A new deploy changes the hashes, so whoever loads `index.html` again gets the new code.
- **An open tab never loads `index.html` again.** Navigating inside the CRM doesn't reload the page. A tab opened before a deploy, or restored by the browser after a restart, keeps running the old code until it's fully reloaded. That's how a menu item added in a deploy can be missing for one person and present for another.
- No service worker, PWA or Cache Storage is used, and none is needed. `localStorage` holds only the login session (`token`, `role`, `employeeId`, `employeeName`) and column preferences, never frontend code.

## How version updates are handled

Each build gets a **build id**: Render's commit SHA (`RENDER_GIT_COMMIT`) plus the build time (`build/buildInfo.js`, `vite.config.js`).
- The id is compiled into the bundle.
- The build also publishes `/version.json`:

  ```json
  {"buildId":"105532d0a1b2-mwd8g2of","commit":"105532d0…","branch":"feature/bulk-email","builtAt":"2026-11-12T07:34:52.047Z"}
  ```
- The running build id appears as a tooltip on the "Compact Systems CRM" title in the top bar.

In production, the open tab checks `/version.json` (`cache: no-store`, no credentials, no token) every 5 minutes and whenever the tab becomes visible again (`src/hooks/useFrontendUpdate.js`). If a different build is deployed, a small notice appears in the corner: **"A new version of the CRM is available. Save anything you are working on, then refresh."**
- **It never reloads by itself**, so nothing being typed is lost and no reload loop is possible.
- **Refresh now** reloads the page. For 10 minutes afterwards, it won't ask again for the same build, in case the CDN briefly served the old page.
- **Dismiss** hides the notice for that build in this tab; a later deploy is reported again.
- The only thing stored is a small note in `sessionStorage` (this tab only) saying which build was dismissed or refreshed for.

## Render settings (dashboard → the static site → Settings)

**Redirects/Rewrites:** keep the existing SPA rule (`/email-account` and other deep links already work):

| Source | Destination | Action |
|---|---|---|
| `/*` | `/index.html` | Rewrite |

**Headers:** add these two rules:

| Path | Name | Value | Why |
|---|---|---|---|
| `/assets/*` | `Cache-Control` | `public, max-age=31536000, immutable` | Content-hashed files never change under the same name. They're cached for a year and never revalidated. |
| `/*` | `Cache-Control` | `no-cache` | `index.html`, `version.json`, deep links and `favicon.svg` are always revalidated (cheap `304`s via the ETag), by browsers **and** the CDN. |

Measured before this change (12 Nov 2026), every response carried Render's default: `Cache-Control: public, max-age=0, s-maxage=300`.
- Hashed assets were therefore revalidated on every visit.
- The CDN could keep serving the previous `index.html` for up to 5 minutes after a deploy.

### Check after saving the headers (and after each deploy)

```powershell
$u = "https://crm-frontend-q5nk.onrender.com"
(Invoke-WebRequest "$u/" -Method Head -UseBasicParsing).Headers["Cache-Control"]                # expect: no-cache
(Invoke-WebRequest "$u/email-account" -Method Head -UseBasicParsing).Headers["Cache-Control"]   # expect: no-cache
$js = ((Invoke-WebRequest "$u/" -UseBasicParsing).Content | Select-String '/assets/[^"]+\.js').Matches[0].Value
(Invoke-WebRequest "$u$js" -Method Head -UseBasicParsing).Headers["Cache-Control"]              # expect: public, max-age=31536000, immutable
Invoke-RestMethod "$u/version.json?check=1"                                                     # the deployed commit and branch
(Invoke-WebRequest "$u/version.json" -Method Head -UseBasicParsing).Headers["Content-Type"]     # expect: application/json (not text/html)
```

If `/assets/...` comes back with `no-cache`, the `/*` rule is overriding the more specific one on your Render setup. In that case:
1. Delete the `/*` header rule.
2. Add `Cache-Control: no-cache` for `/`, `/index.html` and `/version.json` instead.
3. Deep links then keep Render's default `max-age=0`, which still makes browsers revalidate.

Never put `immutable` or a long `max-age` on `/*`, `/index.html` or `/version.json`.

## Which code is deployed

Render builds the branch selected under **Settings → Build & Deploy → Branch**. On 12 Nov 2026 the live bundle contained the Email Account screen, which exists only on `feature/bulk-email`, not on `main`. So the site isn't being built from `main`. Check that the configured branch is the intended one. After a deploy, `/version.json` shows exactly which commit and branch are live.

## Limitations (by design)

- **Tabs running a bundle from before this checker existed can't be notified.** The checker is part of the frontend code, so a tab only checks for updates once it's running a build that contains it. After the first deployment that includes it, a tab still open on an older build stays as it is until that person reloads it once (Ctrl+F5, or closing and reopening the tab). From then on, every later deploy is announced.
- The notice appears up to 5 minutes after a deploy, or as soon as the tab is shown again. It never reloads the page by itself, so a person who ignores it stays on the old build until they refresh.
- `/version.json` is served as the real file because it exists in the build output. Render serves existing files before applying the `/*` → `/index.html` rewrite. If an older deployment without that file is live, the check reads `index.html` instead, sees that it isn't JSON, and does nothing.
- In local development (`npm run dev`) the checker is off. There's no `version.json` there, and no notice appears.

## A user still sees an old screen

1. Ask them to fully reload (Ctrl+F5), or to click **Refresh now** if the notice is showing.
2. Compare the build id (hover the "Compact Systems CRM" title) with `/version.json`.
3. Logging out and in does **not** load new code by itself; only a reload does.
