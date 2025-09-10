-- Simulate two different users by swapping the JWT 'sub' claim.
-- DO NOT run as service_role; use SQL editor with anon/auth role where possible.

-- Helper: set a fake authenticated user A
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000aa','role','authenticated')::text, true);

-- Insert A-owned rows
insert into public.customers (id, user_id) values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000aa');
insert into public.transactions (id, user_id, amount, "type", "timestamp")
values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000aa', 1000, 'sale', now());

-- Switch to user B
select set_config('request.jwt.claims', json_build_object('sub','00000000-0000-0000-0000-0000000000bb','role','authenticated')::text, true);

-- Expect: cannot see user A rows
select * from public.transactions; -- should return 0 rows for B
select * from public.customers;    -- should return 0 rows for B

-- Expect: cannot read security_audit_log as authenticated
select count(*) from public.security_audit_log; -- should FAIL or return 0 (due to deny policy)

-- As service_role (simulated)
select set_config('request.jwt.claims', json_build_object('sub','service','role','service_role')::text, true);
select count(*) from public.security_audit_log; -- should SUCCEED
