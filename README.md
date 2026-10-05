# Waseet B2B Trade & Logistics

Waseet is split into three independent Android applications sharing one Supabase backend:

- Waseet Trade — Merchant + Supplier
- Waseet Driver — Driver operations
- Waseet Admin — Management control tower

## Authentication

All three entrypoints use Supabase Auth and persistent sessions. Trade supports Merchant/Supplier onboarding and phone OTP or email magic-link. Driver supports driver onboarding and phone OTP or email magic-link. Admin is restricted to the configured administrative identity and uses a passwordless email magic-link approval flow instead of relying on an unreliable email OTP.

The frontend never contains a service-role key.

## Transaction lifecycle

طلب → عروض → تفاوض → دفع → تحميل → سائق → نقل → استلام → فحص → تسوية → إغلاق / نزاع

The existing database remains the source of truth for profiles, products, purchase requests, offers, deals, deal events, messages, payments, shipments, inspections, disputes, documents and voice-call records.

## Android builds

GitHub Actions builds: waseet-trade.apk, waseet-driver.apk, waseet-admin.apk.

Package IDs: sa.waseet.trade, sa.waseet.driver, sa.waseet.admin.

## Production dependencies

SMS OTP delivery requires a configured Supabase Auth SMS provider. Email magic links require a configured Supabase Auth email/SMTP provider and the correct redirect URL. Live voice calling requires a WebRTC/signaling or telephony provider; the database already contains voice_calls for call records.

## Admin identity

The current backend admin configuration is stored in admin_settings. The configured administrative email is used by the Admin app. The Admin profile is bootstrapped server-side when that Auth identity is created, so the client cannot self-promote to admin.
