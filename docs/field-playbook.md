# Sentreso Field Playbook (Agent Quick Guide)

Short, copy-paste friendly steps for onboarding merchants in the field.

## Auth headers

- apikey: YOUR_ANON_KEY
- Authorization: Bearer AGENT_TOKEN (agent must be logged in)

Example setup (optional):

```bash
BASE="https://avltdtbgantbxbrqdxge.supabase.co"
ANON="<YOUR_ANON_KEY>"
# Get agent token (replace credentials)
AGENT_TOKEN=$(curl -s -X POST "$BASE/auth/v1/token?grant_type=password" \
  -H "apikey: $ANON" -H "Content-Type: application/json" \
  -d '{"email":"agent@sentreso.com","password":"Password123!"}' | jq -r .access_token)
```

## Option 1 — Merchant already has an account

Create the customer record and attach the merchant’s `user_id` immediately.

```bash
curl -s -X POST "$BASE/rest/v1/customers" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "<MERCHANT_AUTH_USER_ID>",
    "name": "Kiosk Abidjan"
  }' | jq .
```

Notes:
- `created_by` is auto-stamped with the agent’s ID.
- Row is visible to the agent (RLS) and counted in `metrics_distributor`.

## Option 2 — Merchant does not have an account yet

Create a placeholder now; attach `user_id` later (one-time claim).

```bash
# Create placeholder (no user_id yet)
curl -s -X POST "$BASE/rest/v1/customers" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "name": "Kiosk Treichville"
  }' | jq .
```

After the merchant signs up and you know their `auth.users.id`, attach it once:

```bash
CUSTOMER_ID="<CUSTOMER_ROW_ID>"
MERCHANT_USER_ID="<MERCHANT_AUTH_USER_ID>"

curl -s -X PATCH "$BASE/rest/v1/customers?id=eq.$CUSTOMER_ID" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $AGENT_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{\"user_id\":\"$MERCHANT_USER_ID\"}" | jq .
```

Guardrails:
- One-time claim policy allows setting `user_id` only if it is currently NULL and you are the `created_by`.
- `created_by` is immutable; do not try to modify it.

## Check distributor productivity

```bash
curl -s "$BASE/rest/v1/metrics_distributor?select=*" \
  -H "apikey: $ANON" \
  -H "Authorization: Bearer $AGENT_TOKEN" | jq .
```

You should see your `distributor_email` and `merchants_added` count.
