# Waseet v12 Android wrapper

This package contains the Waseet web prototype and Capacitor Android project configuration. It is not yet a compiled APK.

## Build an APK
1. Push this folder to a GitHub repository on branch `main`.
2. Open **Actions** and run **Build APK** (or push a commit).
3. Download the `waseet-debug-apk` artifact from the completed workflow.

The current sign-in, sample marketplace, chat, and deal data are demo/local only. OTP is hardcoded as `123456`; no production authentication, payment settlement, live calls, or server persistence is configured.


## Current architecture

Waseet is split into three independent applications: **Waseet Trade** (Merchant + Supplier), **Waseet Driver**, and **Waseet Admin**. They share Supabase as the single source of truth for profiles, requests, offers, deals, payments, shipments, inspections, disputes, messages and voice-call records. The applications are built as separate APK entrypoints and exchange only the data required to execute each transaction stage. See `ARCHITECTURE-3-APPS.md`.
