# Waseet 3-App Architecture

## Product split

Waseet is now three independent applications sharing one backend:

1. **Waseet Trade** — one app for both Merchant and Supplier. The role determines the workspace and permissions.
2. **Waseet Driver** — a separate operational app for drivers.
3. **Waseet Admin** — a separate control application for management.

They are not one application with three screens. They are separate app entrypoints/APKs with a shared identity, transaction IDs and backend data.

## Shared backend

Supabase project: `waseet`

Core entities:
- profiles
- products
- purchase_requests
- offers
- deals
- deal_events
- messages
- payments
- shipments
- inspections
- disputes
- profile_documents
- voice_calls
- admin_settings

## Connection model

**Trade ↔ Supabase ↔ Driver**
- Trade creates purchase requests, products, offers and deals.
- Driver receives only shipment/task data needed to execute an assigned deal.
- Driver writes loading, transport and delivery evidence back to the shipment/deal.
- Trade reads the resulting status and evidence.

**Trade ↔ Supabase ↔ Admin**
- Admin can supervise users, deals, payments, shipments, disputes and audit events.
- Admin is not a required participant in every UI screen, but is the control authority for protected operational actions.

**Driver ↔ Supabase ↔ Admin**
- Driver status/location/evidence is visible to authorized management.
- Admin can assign/reassign drivers and resolve operational exceptions.

## Transaction source of truth

The `deals.stage` field is the canonical workflow:
`negotiation → payment → loading → transport → inspection → settlement → closing`
with `dispute` as an exception path.

## Security boundary

The clients use only the Supabase publishable key. No service-role key is shipped to any APK.

RLS remains the authorization boundary. App UI must never assume that hiding a button is security.

## APK build

GitHub Actions builds three independent APKs:
- `waseet-trade.apk`
- `waseet-driver.apk`
- `waseet-admin.apk`

Each APK has its own Capacitor app ID:
- `sa.waseet.trade`
- `sa.waseet.driver`
- `sa.waseet.admin`

The apps share the same backend but do not share each other's local UI state.

## Next implementation order

1. Connect auth/session to the three entrypoints.
2. Replace demo counters with Supabase queries.
3. Add Realtime deal/message subscriptions.
4. Enforce role-specific navigation and actions.
5. Complete document/storage flows.
6. Connect voice-call signaling to `voice_calls` plus WebRTC signaling.
7. Verify RLS and Data API exposure before production release.
