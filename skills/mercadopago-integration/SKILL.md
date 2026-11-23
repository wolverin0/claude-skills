---
name: mercadopago-integration
description: Integrate MercadoPago OAuth, checkout, webhooks, and token storage in Supabase/React-style multi-tenant web apps.
---

# MercadoPago Integration

Enable MercadoPago OAuth payments in web applications with proper security and multi-tenant support.

## When to Use

- Adding MercadoPago payments to an app
- Setting up OAuth connection for marketplace/platform payments
- Troubleshooting MercadoPago integration issues
- Implementing checkout with MercadoPago

## Preflight Checklist

Before starting, gather these values:

### From MercadoPago Dashboard (https://www.mercadopago.com/developers)
- [ ] **Client ID**: Your application's client ID
- [ ] **Client Secret**: Your application's client secret
- [ ] **Redirect URI**: Must be registered in MP dashboard (e.g., `https://<project>.supabase.co/functions/v1/mercadopago-auth`)

### From Supabase Dashboard
- [ ] **Project URL**: `https://<project-ref>.supabase.co`
- [ ] **Service Role Key**: Found in Project Settings > API (NEVER expose this in frontend)
- [ ] **Anon Key**: Found in Project Settings > API

### URLs You'll Configure
- [ ] **FRONTEND_URL**: Your app's URL (e.g., `https://myapp.vercel.app`)
- [ ] **Webhook URL**: `https://<project-ref>.supabase.co/functions/v1/mercadopago-webhook`

### Environment Variables Summary

| Location | Variable | Example |
|----------|----------|---------|
| Frontend .env | `VITE_MP_CLIENT_ID` | `1234567890` |
| Frontend .env | `VITE_MP_REDIRECT_URI` | `https://xyz.supabase.co/functions/v1/mercadopago-auth` |
| Edge Function Secrets | `MP_CLIENT_ID` | `1234567890` |
| Edge Function Secrets | `MP_CLIENT_SECRET` | `abcdef123456...` |
| Edge Function Secrets | `FRONTEND_URL` | `https://myapp.vercel.app` |
| Edge Function Secrets | `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase dashboard) |

## Architecture

```
Frontend (Dashboard) -> MercadoPago Authorization -> Supabase Edge Function -> Database
         ^                                                    |
         +-------------- redirect with tokens ----------------+
```

## Quick Start Checklist

1. **MercadoPago Dashboard**: Create app, add redirect URI, get Client ID/Secret
2. **Frontend .env**: Set `VITE_MP_CLIENT_ID` and `VITE_MP_REDIRECT_URI`
3. **Edge Function Secrets**: Set `MP_CLIENT_ID`, `MP_CLIENT_SECRET`, `FRONTEND_URL`, `SUPABASE_SERVICE_ROLE_KEY`
4. **Database**: Add mercadopago columns to tenants/users table
5. **Deploy**: `supabase functions deploy mercadopago-auth`

## Implementation

### Frontend - Initiate OAuth

```typescript
const MP_CLIENT_ID = import.meta.env.VITE_MP_CLIENT_ID;
const MP_REDIRECT_URI = import.meta.env.VITE_MP_REDIRECT_URI;

const authUrl = `https://auth.mercadopago.com.ar/authorization?` +
  `client_id=${MP_CLIENT_ID}&response_type=code&platform_id=mp&` +
  `redirect_uri=${encodeURIComponent(MP_REDIRECT_URI)}&state=${tenantId}`;

window.location.href = authUrl;
```

### Frontend - Handle Callback

```typescript
useEffect(() => {
  const mpSuccess = searchParams.get('mp_success');
  if (mpSuccess === 'true') {
    refreshTenant(); // CRITICAL: Reload tenant to get new credentials
    toast({ title: 'MercadoPago conectado' });
    searchParams.delete('mp_success');
    setSearchParams(searchParams, { replace: true });
  }
}, [searchParams]);
```

### Edge Function - Token Exchange

See `assets/supabase-edge-function.ts` for complete implementation.

Key points:
- Use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS when saving tokens
- `redirect_uri` in token exchange MUST match exactly what's in MP dashboard
- Return redirect to `FRONTEND_URL` with success/error params

### Database Schema

```sql
ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS mercadopago_access_token TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_user_id TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_public_key TEXT,
ADD COLUMN IF NOT EXISTS mercadopago_connected_at TIMESTAMPTZ;
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `token_exchange_failed` | redirect_uri mismatch | Ensure EXACT match in MP dashboard, frontend, and edge function |
| `missing_params` | No code/state in callback | Check OAuth URL includes state parameter |
| Redirect to localhost | FRONTEND_URL not set | Set in edge function secrets |
| Tokens not saved | DB permissions | Use service role key |
| "App can't connect" | MP app misconfiguration | Check MP dashboard settings |

## Webhook Setup

Webhooks notify your app when payment status changes (e.g., payment approved).

### 1. Create Webhook Edge Function

Copy `assets/mercadopago-webhook.ts` to `supabase/functions/mercadopago-webhook/index.ts`
and `assets/mp-webhook-signature.mjs` next to it; run `assets/webhook-events.sql`.
It covers the four production pitfalls:

| Pitfall | What the asset does |
|---|---|
| Forged notifications | Verifies `x-signature` (`ts=…,v1=…`): HMAC-SHA256 with the webhook secret over `id:<data.id>;request-id:<x-request-id>;ts:<ts>;` (`data.id` from the URL query, lowercased if alphanumeric; missing parts left out), constant-time compare, 10-minute replay window. Invalid → 401. |
| Legacy IPN (`?topic=payment&id=…`) arriving next to the webhook | IPN is unsigned: only its id is used and the payment is re-read from `GET /v1/payments/{id}`; status and amount never come from a notification body. |
| Duplicates (webhook + IPN, retries, out-of-order) | Order updates are guarded transitions (never leave `paid`); `mp_webhook_events` has a unique `payment:<id>:<status>` key, a duplicate insert (23505) returns 200 and skips non-idempotent side effects. |
| Supabase answers 401 before your code runs | MercadoPago sends no Supabase JWT, so the function needs `verify_jwt = false` in `supabase/config.toml`. |

```toml
# supabase/config.toml
[functions.mercadopago-webhook]
verify_jwt = false
```

Secrets: `MP_ACCESS_TOKEN`, `MP_WEBHOOK_SECRET` (application → Webhooks → secret signature),
`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`. Answer non-2xx only when MercadoPago should retry.

### 2. Configure Webhook in MercadoPago Dashboard

1. Go to [MercadoPago Developers](https://www.mercadopago.com/developers)
2. Select your application
3. Go to **Webhooks** or **IPN/Notifications**
4. Add webhook URL: `https://<project-ref>.supabase.co/functions/v1/mercadopago-webhook`
5. Select events:
   - `payment` (payment status changes)
   - `merchant_order` (optional)

### 3. Test Webhook

```bash
# verify_jwt = false is set for the function
python scripts/mp_webhook_tool.py check-config supabase/config.toml

# serve locally, then send a correctly signed notification (secret read from the env var)
supabase functions serve mercadopago-webhook --env-file supabase/.env.local
MP_WEBHOOK_SECRET=... python scripts/mp_webhook_tool.py sign --data-id <payment-id>   # prints headers + curl

# a bad signature must get 401; the same notification twice must answer {"duplicate": true}
python scripts/mp_webhook_tool.py verify --x-signature 'ts=…,v1=…' --data-id <id> --request-id <x-request-id>
supabase functions deploy mercadopago-webhook
```

## Resources

- **assets/supabase-edge-function.ts**: Complete OAuth edge function template
- **assets/mercadopago-webhook.ts**: webhook Edge Function (signature, IPN, idempotency)
- **assets/mp-webhook-signature.mjs**: x-signature and notification helpers (Deno and Node)
- **assets/webhook-events.sql**: `mp_webhook_events` dedupe table
- **scripts/mp_webhook_tool.py**: sign / verify x-signature locally, check `verify_jwt = false`
- **assets/use-mercadopago.tsx**: React hook for OAuth flow
- **assets/migration.sql**: Database migration template
- **references/troubleshooting.md**: Detailed debugging guide
