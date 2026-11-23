// supabase/functions/mercadopago-webhook/index.ts
//
// MercadoPago payment notifications (signed webhooks + legacy IPN).
// Copy mp-webhook-signature.mjs next to this file.
//
// supabase/config.toml MUST contain (MercadoPago sends no Supabase JWT, so the
// default verify_jwt = true answers 401 to every notification):
//   [functions.mercadopago-webhook]
//   verify_jwt = false
// Check it: python <skill>/scripts/mp_webhook_tool.py check-config supabase/config.toml
//
// Secrets: MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET (application > Webhooks > secret
// signature), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Table: assets/webhook-events.sql (mp_webhook_events, unique event_key).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { eventKey, parseNotification, verifyMpSignature } from "./mp-webhook-signature.mjs";

const SIGNATURE_TOLERANCE_SEC = 600;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method !== "POST") return json(405, { error: "method not allowed" });

  const url = new URL(req.url);
  const body = await req.json().catch(() => ({}));
  const n = parseNotification(url, body);

  // merchant_order and other topics: acknowledge so MercadoPago stops retrying.
  if (n.kind === "unknown" || n.topic !== "payment" || !n.id) return json(200, { ignored: true });

  if (n.kind === "webhook") {
    const check = await verifyMpSignature({
      xSignature: req.headers.get("x-signature"),
      xRequestId: req.headers.get("x-request-id"),
      dataId: url.searchParams.get("data.id") ?? n.id,
      secret: Deno.env.get("MP_WEBHOOK_SECRET") ?? "",
      toleranceSec: SIGNATURE_TOLERANCE_SEC,
    });
    if (!check.valid) return json(401, { error: "invalid signature" });
  }
  // Legacy IPN is unsigned: use only its id and re-read the payment from the
  // API below; never trust status or amount from a notification body.

  const res = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(n.id)}`, {
    headers: { Authorization: `Bearer ${Deno.env.get("MP_ACCESS_TOKEN")}` },
  });
  if (res.status === 404) return json(200, { ignored: "unknown payment" });
  if (!res.ok) return json(502, { error: "payment lookup failed" });   // non-2xx: MercadoPago retries
  const payment = await res.json();

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const orderId = payment.external_reference;

  // 1. Idempotent state change: guarded transitions, safe to repeat for the
  //    same payment (webhook + IPN for one payment, retries, reordering).
  if (orderId && payment.status === "approved") {
    const { error } = await supabase.from("orders").update({ payment_status: "paid" })
      .eq("id", orderId).or("payment_status.is.null,payment_status.neq.paid");   // neq alone skips NULL
    if (error) return json(500, { error: "order update failed" });
  } else if (orderId && (payment.status === "rejected" || payment.status === "cancelled")) {
    const { error } = await supabase.from("orders").update({ payment_status: "failed" })
      .eq("id", orderId).or("payment_status.is.null,payment_status.not.in.(paid,failed)");
    if (error) return json(500, { error: "order update failed" });
  }

  // 2. Record the event once. A duplicate (unique violation 23505) stops here,
  //    so non-idempotent side effects (emails, stock, invoices) go after it.
  const { error: dup } = await supabase.from("mp_webhook_events").insert({
    event_key: eventKey(payment),
    payment_id: String(payment.id),
    status: payment.status,
    source: n.kind,
  });
  if (dup?.code === "23505") return json(200, { duplicate: true });
  if (dup) return json(500, { error: "event record failed" });

  // Non-idempotent side effects for the first delivery of this payment status go here.

  return json(200, { ok: true });
});
