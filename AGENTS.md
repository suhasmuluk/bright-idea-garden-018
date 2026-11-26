<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

- Staff-only app: all pages live under `src/routes/_authenticated/`; any staff-role user can manage all bookings (RLS `authenticated` = staff). Why: shop staff share one booking book.
- Booking numbers come from a DB trigger + sequence and balance is a generated column. Why: numbering and math stay correct across devices.
- Idol photos/logo live in the private `idol-photos` bucket; store the path and show via signed URLs. Why: public buckets are blocked in this workspace.
- Access is role-gated: only accounts with an `admin`/`staff` row in `user_roles` can use bookings, settings and photos; first signup becomes admin. Why: open signup must not expose customer data.
- Payments are an append-only staff ledger; database triggers seed initial advances and derive the existing paid field under a booking row lock. Why: history and balances stay consistent across devices and booking edits cannot rewrite payments.
- Keep production status separate from legacy booking status and payment status, with local date/time pickup fields. Why: existing records and workflows remain intact without timezone shifts.
- Store idol height as a nullable booking field, with height choices shared by validation and the form. Why: old bookings stay editable and height persists independently of the idol name.
- Reuse booking requirements for extra-work details and derive the edit-form toggle from existing text; leave the retired idol-type field untouched. Why: existing notes remain accessible without a schema change.
- Build Plesk through the independent static Vite entry, reusing the existing TanStack route tree and replacing only the document shell; reject server modules in its bundle. Why: Apache needs no Node runtime while Lovable preview and all business logic remain unchanged.
