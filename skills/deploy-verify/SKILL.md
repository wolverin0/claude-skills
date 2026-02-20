---
name: deploy-verify
description: Use after deployments to verify health endpoints, run API smoke tests, and confirm release integrity with CLI checks.
---

# Deploy & Verify Workflow

CLI-based deployment verification without browser dependencies. Use this after deploying any service.

## Workflow

### 1. Identify Deployment Target
Determine which service was deployed and its verification endpoints:
- **Vercel/static**: Check the deployment URL with curl
- **Docker**: Check container status, then health endpoints
- **Server (SSH)**: Verify service is running, then API health

### 2. Health Check
```bash
# HTTP health check
curl -s -o /dev/null -w "%{http_code}" <URL>/health

# Full response with timing
curl -s -w "\n---\nHTTP %{http_code} | Time: %{time_total}s\n" <URL>/health

# Multiple endpoints
for endpoint in /health /api/status /api/version; do
  echo "$endpoint: $(curl -s -o /dev/null -w '%{http_code}' <URL>$endpoint)"
done
```

### 3. API Smoke Tests
Test critical endpoints with actual requests:
```bash
# GET endpoint
curl -s <URL>/api/endpoint | head -c 500

# POST with auth
curl -s -X POST <URL>/api/endpoint \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check response shape
curl -s <URL>/api/endpoint | python -m json.tool | head -20
```

### 4. Docker-Specific Checks
```bash
# Container running?
docker ps | grep <service>

# Recent logs (errors?)
docker logs <container> --tail 50 2>&1 | grep -i error

# Container health
docker inspect --format='{{.State.Health.Status}}' <container>
```

### 5. Log Monitoring
```bash
# Check for errors in last 10 minutes
docker logs <container> --since 10m 2>&1 | grep -iE "error|fatal|exception"

# Supabase: check edge function logs
# Check Supabase dashboard â†’ Edge Functions â†’ Logs

# Server logs
ssh user@server 'journalctl -u <service> --since "10 minutes ago" | grep -i error'
```

### 6. Generate Report
Output a verification summary:
```
DEPLOYMENT VERIFICATION REPORT
==============================
Service: <name>
Deployed at: <timestamp>
URL: <url>

Health Check: PASS/FAIL (HTTP <code>, <time>ms)
API Endpoints:
  - GET /api/endpoint: PASS (HTTP 200)
  - POST /api/endpoint: PASS (HTTP 201)
Container Status: Running (uptime: <time>)
Error Log: 0 errors in last 10 minutes

Overall: PASS/FAIL
```

## Rules
- **NEVER use browser tools** for deployment verification
- Always check logs after verifying endpoints
- If any check fails, investigate before reporting success
- For Docker projects: verify both container status AND API responses

