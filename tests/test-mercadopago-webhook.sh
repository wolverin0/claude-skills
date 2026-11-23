#!/bin/bash
# tests/test-mercadopago-webhook.sh
# MercadoPago webhook helpers: x-signature HMAC-SHA256 agrees across three
# implementations (Python hmac, Web Crypto in mp-webhook-signature.mjs, openssl),
# notifications are classified (webhook / legacy IPN), and check-config enforces
# verify_jwt = false.

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
PY="$(command -v python3 || command -v python)"
TOOL=skills/mercadopago-integration/scripts/mp_webhook_tool.py
MJS="$ROOT/skills/mercadopago-integration/assets/mp-webhook-signature.mjs"
TMP="$ROOT/tests/tmp-mp"
export MP_WEBHOOK_SECRET="test-secret-not-real"

pass() { echo -e "${GREEN}✓ PASS${NC}"; }
fail() { echo -e "${RED}✗ FAIL${NC}"; printf '  %s\n' "$@"; return 1; }

# node <script> with the module URL in $MOD
js() {
    local url
    url=$(node -e 'console.log(require("url").pathToFileURL(process.argv[1]).href)' "$MJS")
    MOD="$url" node --input-type=module -e "$1"
}

header_from_sign() { "$PY" -B "$TOOL" sign "$@" | sed -n 's/^x-signature: //p'; }

# Test 1: Python, Web Crypto and openssl compute the same v1; data.id case is preserved
# (official SDK test: test_uppercase_dataid_is_preserved)
test_three_implementations_agree() {
    echo -n "Test 1: Python, Web Crypto and openssl agree (data.id case preserved)... "
    local hdr py_v1 ossl_v1 out
    hdr=$(header_from_sign --data-id ABC123 --request-id req-1 --ts 1742505638683)
    py_v1=${hdr##*v1=}
    ossl_v1=$(printf '%s' "id:ABC123;request-id:req-1;ts:1742505638683;" \
        | openssl dgst -sha256 -hmac "$MP_WEBHOOK_SECRET" | sed 's/^.*= //')
    [[ "$py_v1" == "$ossl_v1" ]] || { fail "python $py_v1 != openssl $ossl_v1"; return 1; }
    out=$(HDR="$hdr" js 'const m = await import(process.env.MOD);
      const r = await m.verifyMpSignature({xSignature: process.env.HDR, xRequestId: "req-1", dataId: "ABC123", secret: process.env.MP_WEBHOOK_SECRET});
      console.log(r.valid, r.reason);')
    [[ "$out" == "true ok" ]] || { fail "web crypto: $out"; return 1; }
    pass
}

# Test 2: wrong secret, tampered ts and wrong id are rejected by both verifiers
test_tampering_rejected() {
    echo -n "Test 2: Wrong secret, tampered ts or id are rejected... "
    local hdr bad_ts out rc=0
    hdr=$(header_from_sign --data-id 999 --request-id req-2 --ts 1742505638683)
    bad_ts=${hdr/ts=1742505638683/ts=1742505638684}
    out=$(HDR="$hdr" BAD="$bad_ts" js 'const m = await import(process.env.MOD); const s = process.env.MP_WEBHOOK_SECRET;
      const a = await m.verifyMpSignature({xSignature: process.env.HDR, xRequestId: "req-2", dataId: "999", secret: "other"});
      const b = await m.verifyMpSignature({xSignature: process.env.BAD, xRequestId: "req-2", dataId: "999", secret: s});
      const c = await m.verifyMpSignature({xSignature: process.env.HDR, xRequestId: "req-2", dataId: "998", secret: s});
      console.log(a.valid, b.valid, c.valid);')
    [[ "$out" == "false false false" ]] || { fail "web crypto accepted a tampered notification: $out"; return 1; }
    "$PY" -B "$TOOL" verify --x-signature "$bad_ts" --data-id 999 --request-id req-2 >/dev/null || rc=$?
    [[ $rc -eq 1 ]] || { fail "python verify accepted a tampered ts"; return 1; }
    pass
}

# Test 3: a missing x-request-id is left out of the manifest by both sides
test_missing_part_omitted() {
    echo -n "Test 3: Missing request-id is omitted from the manifest... "
    local hdr out
    hdr=$("$PY" -B "$TOOL" sign --data-id 42 --request-id "" --ts 1700000000 | sed -n 's/^x-signature: //p')
    out=$(HDR="$hdr" js 'const m = await import(process.env.MOD);
      console.log(m.buildManifest({dataId: "42", requestId: null, ts: "1700000000"}));
      const r = await m.verifyMpSignature({xSignature: process.env.HDR, xRequestId: null, dataId: "42", secret: process.env.MP_WEBHOOK_SECRET});
      console.log(r.valid);')
    [[ "$out" == $'id:42;ts:1700000000;\ntrue' ]] || { fail "$out"; return 1; }
    pass
}

# Test 4: replay window: an old timestamp fails when a tolerance is set (s and ms)
test_timestamp_tolerance() {
    echo -n "Test 4: Old timestamps fail the tolerance window (s and ms)... "
    local hdr_ms hdr_s out
    hdr_ms=$(header_from_sign --data-id 7 --request-id r --ts 1700000000000)
    hdr_s=$(header_from_sign --data-id 7 --request-id r --ts 1700000000)
    out=$(A="$hdr_ms" B="$hdr_s" js 'const m = await import(process.env.MOD); const s = process.env.MP_WEBHOOK_SECRET;
      const now = 1700000000000;
      const ok = await m.verifyMpSignature({xSignature: process.env.A, xRequestId: "r", dataId: "7", secret: s, toleranceSec: 600, nowMs: now + 60000});
      const okS = await m.verifyMpSignature({xSignature: process.env.B, xRequestId: "r", dataId: "7", secret: s, toleranceSec: 600, nowMs: now + 60000});
      const old = await m.verifyMpSignature({xSignature: process.env.A, xRequestId: "r", dataId: "7", secret: s, toleranceSec: 600, nowMs: now + 3600000});
      console.log(ok.valid, okS.valid, old.valid, old.reason);')
    [[ "$out" == "true true false timestamp outside tolerance" ]] || { fail "$out"; return 1; }
    pass
}

# Test 5: webhook, legacy IPN and other topics are told apart; dedupe key is per payment+status
test_parse_notification() {
    echo -n "Test 5: Webhook vs legacy IPN classification and event key... "
    local out
    out=$(js 'const m = await import(process.env.MOD);
      const w = m.parseNotification(new URL("https://x/f?data.id=123&type=payment"), {action: "payment.updated", data: {id: "123"}});
      const i = m.parseNotification(new URL("https://x/f?topic=payment&id=123"), {});
      const o = m.parseNotification(new URL("https://x/f?topic=merchant_order&id=9"), {});
      const u = m.parseNotification(new URL("https://x/f"), {});
      console.log([w.kind, w.topic, w.id, i.kind, i.topic, i.id, o.topic, u.kind, m.eventKey({id: 123, status: "approved"})].join(" "));')
    [[ "$out" == "webhook payment 123 ipn payment 123 merchant_order unknown payment:123:approved" ]] || { fail "$out"; return 1; }
    pass
}

# Test 6: check-config requires [functions.<name>] verify_jwt = false
test_check_config() {
    echo -n "Test 6: check-config enforces verify_jwt = false... "
    rm -rf "$TMP"; mkdir -p "$TMP"
    printf '[functions.mercadopago-webhook]\nverify_jwt = false\n' > "$TMP/ok.toml"
    printf '[functions.mercadopago-webhook]\nverify_jwt = true\n' > "$TMP/on.toml"
    printf '[api]\nport = 54321\n' > "$TMP/missing.toml"
    local rc_ok=0 rc_on=0 rc_missing=0
    "$PY" -B "$TOOL" check-config "$TMP/ok.toml" >/dev/null || rc_ok=$?
    "$PY" -B "$TOOL" check-config "$TMP/on.toml" >/dev/null || rc_on=$?
    "$PY" -B "$TOOL" check-config "$TMP/missing.toml" >/dev/null || rc_missing=$?
    rm -rf "$TMP"
    [[ $rc_ok -eq 0 && $rc_on -eq 1 && $rc_missing -eq 1 ]] || { fail "rc ok=$rc_ok on=$rc_on missing=$rc_missing"; return 1; }
    pass
}

echo ""
echo "Running MercadoPago Webhook Tests"
echo "=================================="
echo ""
total=0; passed=0
for t in test_three_implementations_agree test_tampering_rejected test_missing_part_omitted \
         test_timestamp_tolerance test_parse_notification test_check_config; do
    total=$((total + 1))
    if $t; then passed=$((passed + 1)); fi
done
echo ""
echo "=================================="
if [[ $passed -eq $total ]]; then
    echo -e "${GREEN}All tests passed ($passed/$total)${NC}"
    exit 0
fi
echo -e "${RED}Some tests failed ($passed/$total passed)${NC}"
exit 1
