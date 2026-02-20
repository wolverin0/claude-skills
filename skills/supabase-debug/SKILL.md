---
name: supabase-debug
description: Use when diagnosing Supabase issues like RLS, auth, empty queries, webhooks, and performance problems in production apps.
---

# Supabase Debugging Patterns

Quick-reference debugging skill for Supabase-backed projects (9/11 active projects use Supabase).

## Common Issues & Fixes

### Empty Data / Missing Records
```
Symptom: Query returns empty array but data exists in DB
```
1. **Check RLS policies** â€” most common cause
   ```sql
   -- View policies on a table
   SELECT * FROM pg_policies WHERE tablename = 'your_table';
   ```
2. **Check auth state** â€” is user authenticated?
   ```typescript
   const { data: { user } } = await supabase.auth.getUser();
   console.log('Auth state:', user?.id, user?.role);
   ```
3. **Check tenant filtering** â€” multi-tenant apps filter by `company_id`
   ```typescript
   // Verify the company_id matches
   const { data } = await supabase.from('table').select('*').eq('company_id', companyId);
   ```

### Auth Issues
```
Symptom: 401 Unauthorized, session expired, login loops
```
1. Check if token is expired: `supabase.auth.getSession()`
2. Verify redirect URLs in Supabase dashboard match app URL
3. For OAuth: check provider settings in Supabase Auth config
4. Clear local storage and re-authenticate

### RPC / Edge Function Failures
```
Symptom: Function call returns error or unexpected result
```
1. Check Supabase dashboard â†’ Edge Functions â†’ Logs
2. Verify function exists and is deployed: `supabase functions list`
3. Check function has correct permissions (auth required vs public)
4. Test directly: `curl -X POST <supabase_url>/functions/v1/<function_name>`

### Migration Issues
```
Symptom: Schema mismatch, missing columns/tables
```
1. Check migration status: `supabase migration list`
2. Run pending: `supabase db push`
3. If stuck: check `supabase/migrations/` for conflicting files
4. Nuclear option: `supabase db reset` (WARNING: destroys data)

### Real-time Subscription Not Working
```
Symptom: UI not updating when data changes
```
1. Verify Realtime is enabled for the table in Supabase dashboard
2. Check subscription filter matches: `.on('postgres_changes', { event: '*', schema: 'public', table: 'your_table' })`
3. RLS applies to realtime too â€” check policies
4. Check browser console for WebSocket errors

## Quick Diagnostic Commands

```bash
# Check Supabase project status
npx supabase status

# View recent logs
npx supabase functions logs <function-name> --tail

# Test RLS as a specific user
npx supabase db test

# Check table structure
npx supabase db dump --schema public | grep "CREATE TABLE your_table" -A 20
```

## Project-Specific Notes

| Project | Supabase URL Pattern | Schema | Special Notes |
|---------|---------------------|--------|--------------|
| argentina-sales-hub | orqkgmcwkkzt... | public | 85+ migrations, multi-tenant via company_id |
| douglas-haig | via project config | public | QR codes with 24h expiry |
| elbraserito | nzqnibcdgqjp... | elbraserito | Custom schema, not public |
| fitflow-pro-connect2 | via project config | public | localStorage fallback |
| goodmorning/nereidas | via project config | public | Real-time order subscriptions |
| mutual | ueagbmyhdvje... | public + socios + financial + properties + loans | Multi-schema! |
| pedrito | via project config | public | Legacy SQLite references exist but unused |

