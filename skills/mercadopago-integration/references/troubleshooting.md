# MercadoPago Troubleshooting

## Error: "token_exchange_failed"

**Cause:** redirect_uri mismatch between MP dashboard, frontend, and edge function.

**Fix:** Ensure ALL three are EXACTLY identical:
```
MercadoPago Dashboard: https://xxx.supabase.co/functions/v1/mercadopago-auth
VITE_MP_REDIRECT_URI:  https://xxx.supabase.co/functions/v1/mercadopago-auth
Edge Function:         https://xxx.supabase.co/functions/v1/mercadopago-auth
```

Check for: trailing slashes, http vs https, typos.

---

## Error: "missing_params"

**Cause:** Callback didn't receive `code` or `state` parameters.

**Fix:** Verify authorization URL includes state:
```typescript
const authUrl = `...&state=${encodeURIComponent(tenantId)}`;
```

---

## Dashboard Doesn't Show "Connected"

**Cause:** Tenant data not refreshed.

**Fix:** Call `refreshTenant()` in success handler:
```typescript
if (searchParams.get('mp_success') === 'true') {
  refreshTenant(); // <-- CRITICAL
}
```

---

## Redirect to localhost in Production

**Cause:** `FRONTEND_URL` not set in edge function secrets.

**Fix:** Supabase Dashboard > Edge Functions > mercadopago-auth > Secrets:
- Add `FRONTEND_URL` = `https://your-production-domain.com`

---

## Tokens Not Saved

**Cause:** Database update failed.

**Fix:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
2. Check table/column names match your schema
3. Ensure `state` (tenant ID) exists in database

---

## "La aplicación no puede conectarse"

**Cause:** MercadoPago app misconfiguration.

**Fix:**
1. MP Developers Dashboard > Your App
2. Check app is in correct mode (sandbox/production)
3. Verify redirect URIs are configured
4. Ensure app has correct permissions

---

## Setup Checklist

- [ ] MercadoPago app created
- [ ] Redirect URI in MP dashboard
- [ ] `VITE_MP_CLIENT_ID` in frontend .env
- [ ] `VITE_MP_REDIRECT_URI` in frontend .env
- [ ] Edge function deployed
- [ ] Secrets set: `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `FRONTEND_URL`, `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Database columns added
- [ ] Frontend handles `mp_success`/`mp_error` params
- [ ] `refreshTenant()` called on success
