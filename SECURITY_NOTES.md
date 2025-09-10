## Supabase RLS and Security Notes

### Tables with RLS
- `public.customers`: Owner-only policies for SELECT/INSERT/UPDATE/DELETE based on `auth.uid() = user_id`.
- `public.transactions`: Owner-only policies; `amount`, `type`, `timestamp` are NOT NULL.
- `public.customer_interactions`: Owner-only policies.
- `public.receipts` (if present): Owner-only policies.

All above tables have a BEFORE INSERT trigger `public.set_user_id()` to default `user_id` to `auth.uid()` when not provided by the client, ensuring server-side ownership enforcement.

### `financial_insights` view
Recreated as a plain SECURITY INVOKER view selecting from `public.transactions`. Because RLS is enabled on base tables, callers only see their own rows.

### `security_audit_log`
RLS enabled. Default deny-all policy blocks all access for non-service users. A read policy allows SELECT only when the JWT role is `service_role`, keeping logs unreadable to normal users.

### Testing RLS
Use the SQL in `migrations/2025-09-09_rls_test.sql` to simulate JWT claims:
1. Set `request.jwt.claims` to user A, insert rows.
2. Switch to user B and verify you cannot see A's rows.
3. Verify authenticated users cannot read `security_audit_log`.
4. Switch role to `service_role` and verify reading `security_audit_log` succeeds.

### Future
If multi-user merchants are required, introduce a `memberships` table and update policies to permit team access. Consider adding a `support_readonly` role with scoped RPCs for internal support.
