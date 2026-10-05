# Waseet Real Apps

Three production applications share Supabase: Trade, Driver, Admin.

Authentication: Supabase Auth with phone/email OTP; Admin uses email magic-link approval as fallback.

Workflow remains unchanged: request -> offers -> negotiation -> payment -> loading -> driver -> transport -> receipt -> inspection -> settlement -> closing/dispute.
