# Plesk production-package verification — 26 November 2026

Test target: the minified production package served by actual Apache 2.4.71 at an isolated local origin, using the existing live Lovable Cloud backend. No Vite dev server, mock backend or demo rows were used for these signed-in checks.

## Passed

- Production static build and package verification; HTML references resolve to packaged JS/CSS, with favicon and robots file included.
- Existing booking-rule unit tests and explicit shared-tree route tests for dashboard, new booking, settings, booking details and edit pages.
- Anonymous direct access to `/`, `/dashboard`, `/new`, `/settings`, `/bookings/:id` and `/edit/:id` returns to the sign-in page.
- Password login submission reaches the existing auth service and rejects invalid credentials.
- An authorized current-user session loads actual dashboard booking rows and shop settings. This is session authentication, **not** a successful password-login test.
- Dashboard hard refresh preserves authentication; leaf titles update through the shared route metadata.
- Disposable booking created through the actual form, with generated booking number, initial advance ledger, height, extra-work text and uploaded photo; receipt read back after Apache hard refresh.
- Private photo upload and signed-URL image rendering.
- Production status changed on the disposable booking and read back after refresh.
- Payment entered through the dialog and read back in payment history after refresh; total paid and balance updated.
- Booking edited through its existing form and read back through the receipt page.
- WhatsApp dialog retains the signed photo URL and opens the existing `wa.me` link.
- Print button invokes browser printing in an isolated print check; actual PDF output also generated under print media.
- Dashboard filter retrieves the newly created booking.
- Dashboard, new booking, settings, receipt and edit pages checked at 390×844 and 876×618, with no document-level horizontal overflow. The existing dashboard table retains intentional internal horizontal scrolling. Desktop receipt and forms also visually inspected.
- Logout clears the session; direct protected refresh returns to sign in.
- Missing JS and missing API paths return Apache 404. `.env` and deployment guide access return Apache 403.
- No JavaScript page errors in the successful complete signed-in workflow.
- All disposable test bookings, their cascaded payment rows and uploaded test photos removed. Existing customer bookings and settings were not modified. Test bookings consume sequence numbers; sequence history was not reset.

## Still requires the demo/final hosting environment

- A **successful email/password sign-in** using an account password was not verified: no password was supplied or requested. The authorized-session and invalid-login checks above are not a substitute.
- Signup email-confirmation return URLs, the demo/final HTTPS origin, Plesk nginx proxy configuration and actual VPS upload must be checked after a demo domain is chosen. No auth settings were changed because the domain is undecided.
- Settings reads and controls were checked; no settings mutation was performed to avoid changing the shop's real configuration.
- Real printer output and sending a WhatsApp message require the user's device/services; link construction and printable PDF were checked.

This report describes the tested revision, not a permanent guarantee for later code changes. Rebuild and rerun release checks for future versions.