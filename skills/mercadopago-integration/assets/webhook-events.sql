-- One row per processed (payment id, status). The unique key makes a
-- duplicate delivery (webhook + legacy IPN for the same payment, MercadoPago
-- retries) fail with 23505, which assets/mercadopago-webhook.ts treats as
-- "already processed".
CREATE TABLE IF NOT EXISTS public.mp_webhook_events (
  event_key    TEXT PRIMARY KEY,                 -- payment:<id>:<status>
  payment_id   TEXT NOT NULL,
  status       TEXT NOT NULL,
  source       TEXT NOT NULL CHECK (source IN ('webhook', 'ipn')),
  received_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS mp_webhook_events_payment_id_idx ON public.mp_webhook_events (payment_id);

-- Written only by the Edge Function with the service role; no client access.
ALTER TABLE public.mp_webhook_events ENABLE ROW LEVEL SECURITY;
