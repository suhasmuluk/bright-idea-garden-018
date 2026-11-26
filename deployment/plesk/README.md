# Bright Idea Garden: Plesk Apache deployment

## Build on your workstation or CI

Use Node.js 22.12+ (or 24 LTS) with npm for **building only**. Apache does not need Node.js, Nitro, Cloudflare, Wrangler, a process manager, or a server-start command.

```sh
npm install
npm run test
npm run build:plesk
```

The complete upload directory is `.output/plesk-upload/`. Build output is disposable and must be regenerated from source for each release. The normal `npm run dev` and Lovable hosting build remain unchanged; `build:plesk` uses an independent plain Vite/React build with no Start server or Cloudflare deployment plugin.

## Environment and security

Keep the existing `.env` on the build machine, outside the web document root. The build reads **only** `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_SUPABASE_PROJECT_ID` for browser configuration. The URL and publishable/anon key are intentionally public; existing database permissions and staff roles enforce security. Never put a service-role key, secret key, database password, or other private credential in a `VITE_` variable. The build rejects a secret or non-anon key in the public-key field and rejects server-runtime modules entering the client graph.

Do not upload `.env`, source code, `node_modules`, database migrations, repository metadata, or the rest of `.output`. The package includes only static HTML, assets, Apache rules, this guide, and integrity/verification manifests. No customers, passwords, sessions, or private photos are embedded. Photos and logos continue using signed URLs from the existing private storage bucket.

The existing Lovable Cloud backend must remain active and reachable from browsers at the configured HTTPS URL. This package does **not** migrate the database or authentication service to your VPS.

## Upload in Plesk

1. Back up the domain's existing document root and confirm you are not replacing another site's files.
2. Enable SSL, select the correct HTTPS domain, and enable Plesk's HTTP-to-HTTPS redirect.
3. Use File Manager or SFTP to upload the **contents** of `.output/plesk-upload/` to the domain's document root (usually `httpdocs`). `index.html`, `assets/`, and `.htaccess` must sit directly there, not inside a nested upload folder. Ensure hidden files are transferred.
4. Use a domain/subdomain document root, **not** a `/bookings-app/` subdirectory: assets and existing routes intentionally use `/` as their base.
5. Enable Apache `mod_rewrite` and allow `.htaccess` overrides for `FileInfo`, `Options`, `Indexes`, and `AuthConfig` (or `AllowOverride All`). These rules are for this separate Apache package, not Lovable hosting.
6. If nginx is in front of Apache, enable proxy mode and ensure unknown URLs go to Apache. Disable nginx's direct static-file handling if it intercepts these rules; do not add a competing nginx fallback. Confirm missing `/assets/missing.js` returns 404 rather than HTML.
7. Refresh `/dashboard`, `/new`, `/settings`, `/bookings/<existing-id>`, and `/edit/<existing-id>` directly. Unknown application routes show the existing app's 404; missing files return Apache 404. Files are served with their actual types.
8. Compare `manifest.json` hashes after transfer if desired. The manifest, guide and verification report are denied over HTTP by `.htaccess` but remain available to the server administrator.

## Authentication configuration before going live

The domain is not yet selected. For now deploy to an HTTPS demo subdomain with its own document root using these same files; add that exact demo origin to the confirmation redirect allowlist if testing signup. Leave the existing Site URL unchanged until the real domain is chosen. No auth settings were changed during packaging. A domain name is not hardcoded into the application.

In the existing Lovable Cloud authentication settings, add your exact HTTPS Plesk origin to the redirect allowlist and set the Site URL when you intend the VPS domain to become the default email destination. Retain existing Lovable URLs while both sites remain in use. This is required for signup-confirmation links; password login itself uses the existing backend directly. The app already uses `window.location.origin` for confirmation redirects. Do not disable email confirmation, reset existing passwords, recreate users, or change staff permissions.

No new login provider or OAuth callback was introduced. All existing routes and protected-route guards are reused unchanged. Database permissions remain the final authorization boundary, including for signed-in accounts without a staff role. Browser sessions are origin-specific: staff will sign in again on the new domain.

## Architecture audit / Node.js requirements

All current functional operations are browser-to-backend calls: password login/logout, session verification, dashboard queries, booking insert/update, payment insert/history, production updates, shop settings, photo uploads and signed URLs. Numbering, balances and payment-ledger enforcement remain existing database triggers/columns. Receipts use browser printing; WhatsApp opens the existing link-based workflow.

There are **no used application server functions, API routes, webhooks, or server-only data loaders** in the current route graph. The generated admin client, auth middleware, cron helper, `src/start.ts`, `src/server.ts`, Nitro and Cloudflare-related Lovable configuration are not used or shipped by this build. They remain in the source to preserve the editor's normal preview/hosting integration. No business functionality has been silently removed, and there is no Node.js runtime requirement on Plesk. Future features that import server functions or private-key services must use a separate authorized server; the static build deliberately fails instead of pretending those features work.

SSR is replaced only in the Apache package by a React client document shell. Every existing page, loader, head metadata, auth guard and UI is reused. Styling and logic are unchanged.

## Release checks

`npm run build:plesk` builds and verifies static assets, allowed configuration, runtime boundaries, Apache rules and file hashes. `npm run verify:plesk` repeats package verification without rebuilding. `verification.json` records the actual release checks and any unverified items; do not treat an unverified check as passed.

On the real domain, additionally check password sign-in, logout, staff access, a test booking and its edit/production/payment actions, signed photos, receipt printing, WhatsApp, settings, direct deep-link refresh, and phone layouts. Delete only your disposable test booking afterward. No automated test should change an existing customer booking or shop settings. Successful password authentication and email-confirmation redirects require final domain/account checks when credentials/domain settings are unavailable during packaging.

Deploy future releases as a complete replacement of the static files, preferably atomically, retaining a previous package for rollback. Do not run database migrations as part of this deployment.