# 📧 Formspree Auto-Reply Setup Guide

Automatically respond to Formspree form submissions from `support@sentreso.com`.

## 🎯 What This Does

When someone submits the form on www.sentreso.com:

1. ✅ **You receive** the submission in your email (Formspree default)
2. ✅ **User receives** an automated professional reply from `support@sentreso.com`
3. ✅ **Submission is logged** in your database (optional, for tracking)
4. ✅ **Team gets notified** via internal email

## 📋 Response Templates

### For Merchants (commerçant)
- Welcome message with app download links
- Step-by-step onboarding instructions
- Benefits overview
- Contact information

### For Distributors (distributeur)
- Welcome to the team message
- Next steps explanation
- Program overview
- Call-to-action

### Generic Response
- Acknowledgment of submission
- Timeline for follow-up
- Contact information

## 🚀 Setup Instructions

### Step 1: Deploy the Edge Function

```bash
# Deploy the function
supabase functions deploy handle-form-submission

# Set environment variables in Supabase Dashboard
# Go to: Settings → Edge Functions → Secrets
# Add these secrets (use your own values, never commit real keys):
# - MAILGUN_API_KEY = <your-mailgun-api-key>
# - MAILGUN_DOMAIN = sentreso.com
# - MAILGUN_BASE = https://api.eu.mailgun.net/v3
# - SUPPORT_FROM = support@sentreso.com
```

### Step 2: Create Database Table (Optional)

Run this in Supabase SQL Editor:

```sql
-- Copy and paste contents of:
-- supabase/migrations/20251012_form_submissions.sql
```

Or via CLI:
```bash
supabase db push
```

### Step 3: Configure Formspree Webhook

1. **Go to Formspree Dashboard**
   - Login at https://formspree.io/
   - Go to your form settings

2. **Add Webhook**
   - Click "Integrations" or "Webhooks"
   - Add new webhook URL:
     ```
     https://avltdtbgantbxbrqdxge.supabase.co/functions/v1/handle-form-submission
     ```

3. **Configure Webhook**
   - ✅ Enable webhook
   - ✅ Trigger on: "New submission"
   - ✅ Send all form fields
   - Save settings

### Step 4: Test the Setup

Submit a test form with:
- Email: `your-valid-email@example.com`
- Phone: `771234567`
- Profile: `commercant`
- Platform: `ios`

You should:
1. ✅ Receive Formspree notification email (existing)
2. ✅ Test user receives automated reply from support@sentreso.com
3. ✅ You receive internal notification about the submission
4. ✅ Submission appears in database (if table created)

## 📊 Monitoring Submissions

### View Recent Submissions

```sql
SELECT * FROM recent_form_submissions;
```

### View All Submissions

```sql
SELECT
  email,
  phone,
  profile,
  platform,
  submitted_at,
  responded_at
FROM form_submissions
ORDER BY submitted_at DESC;
```

### Check Response Rate

```sql
SELECT
  COUNT(*) as total_submissions,
  COUNT(responded_at) as responded,
  ROUND(100.0 * COUNT(responded_at) / COUNT(*), 1) as response_rate_pct
FROM form_submissions
WHERE submitted_at >= CURRENT_DATE - INTERVAL '7 days';
```

## 🎨 Customizing Responses

Edit `supabase/functions/handle-form-submission/index.ts`:

### Change Merchant Response

```typescript
function generateMerchantResponse(email: string, phone?: string, platform?: string): string {
  return `Your custom message here...`;
}
```

### Change Internal Notification Recipient

```typescript
formData.append('to', 'your-email@example.com'); // Change recipient
```

### Add More Fields

```typescript
interface FormSubmission {
  email: string;
  phone?: string;
  profile?: string;
  platform?: string;
  name?: string;
  message?: string;
  company?: string;        // Add new field
  country?: string;        // Add new field
  [key: string]: any;
}
```

## 📧 Email Templates

### Current Templates Include:

1. **Merchant Welcome**
   - App download links (iOS/Android)
   - Account creation instructions
   - Features overview
   - Support contact info

2. **Distributor Welcome**
   - Team welcome message
   - Next steps
   - Program benefits
   - Contact details

3. **Generic Response**
   - Acknowledgment
   - Response timeline
   - Contact information

## 🔧 Advanced Features

### Add SMS Notifications

Install Twilio and add to the Edge Function:

```typescript
// Send SMS to team
await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT/Messages.json', {
  method: 'POST',
  headers: {
    'Authorization': 'Basic ' + btoa('YOUR_SID:YOUR_TOKEN'),
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    From: '+1234567890',
    To: phone,
    Body: `Nouvelle inscription: ${email}`
  })
});
```

### Add to CRM

Send submission to your CRM:

```typescript
// Example: HubSpot
await fetch('https://api.hubapi.com/contacts/v1/contact/', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_HUBSPOT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    properties: [
      { property: 'email', value: email },
      { property: 'phone', value: phone },
      { property: 'profile', value: profile }
    ]
  })
});
```

### Schedule Follow-ups

Use pg_cron to schedule follow-up reminders:

```sql
-- Create follow-up reminder function
create or replace function send_followup_reminders()
returns void as $$
begin
  -- Find submissions without response after 24 hours
  perform
    net.http_post(
      url := 'https://avltdtbgantbxbrqdxge.supabase.co/functions/v1/send-email',
      body := jsonb_build_object(
        'to', 'kaneaziz@gmail.com',
        'subject', '⏰ Follow-up needed',
        'body', 'Submissions waiting for response: ' || count(*)
      )
    )
  from form_submissions
  where submitted_at < now() - interval '24 hours'
    and responded_at is null;
end;
$$ language plpgsql;

-- Schedule daily check at 9 AM
select cron.schedule(
  'followup-reminders',
  '0 9 * * *',
  'select send_followup_reminders();'
);
```

## 🐛 Troubleshooting

### User not receiving auto-reply

1. Check Mailgun logs in dashboard
2. Verify email address is valid
3. Check spam folder
4. Test Mailgun with: `node scripts/email-metrics-manual.js your-valid-email@example.com`

### Webhook not firing

1. Check Formspree webhook logs
2. Verify webhook URL is correct
3. Test Edge Function directly:
   ```bash
   curl -X POST https://avltdtbgantbxbrqdxge.supabase.co/functions/v1/handle-form-submission \
     -H "Content-Type: application/json" \
     -d '{"email":"your-valid-email@example.com","phone":"771234567","profile":"commercant","platform":"ios"}'
   ```

### Submissions not in database

1. Check if table exists: `SELECT * FROM form_submissions LIMIT 1;`
2. Run migration: `supabase db push`
3. Check Edge Function logs in Supabase Dashboard

### Email formatting issues

1. Test with plain text first
2. Add HTML version if needed
3. Check Mailgun template compatibility

## 📊 Sample Queries

### Today's Submissions

```sql
SELECT * FROM form_submissions
WHERE submitted_at::date = CURRENT_DATE
ORDER BY submitted_at DESC;
```

### Submissions by Profile

```sql
SELECT
  profile,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE platform = 'ios') as ios_count,
  COUNT(*) FILTER (WHERE platform = 'android') as android_count
FROM form_submissions
GROUP BY profile
ORDER BY count DESC;
```

### Conversion Funnel

```sql
SELECT
  'Form Submitted' as stage,
  COUNT(*) as count
FROM form_submissions
WHERE submitted_at >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT
  'Account Created' as stage,
  COUNT(DISTINCT user_id) as count
FROM profiles
WHERE onboarded_at >= CURRENT_DATE - INTERVAL '30 days'

UNION ALL

SELECT
  'First Transaction' as stage,
  COUNT(DISTINCT user_id) as count
FROM profiles
WHERE activated_at >= CURRENT_DATE - INTERVAL '30 days';
```

## 🎉 Success!

You now have:
- ✅ Automated email responses
- ✅ Professional templates
- ✅ Submission tracking
- ✅ Internal notifications
- ✅ Analytics & monitoring

Users will receive instant, professional responses from `support@sentreso.com`! 📧

## 📞 Support

Questions? Check:
- Supabase Dashboard → Edge Functions → Logs
- Mailgun Dashboard → Logs
- Formspree Dashboard → Submissions

Or contact: kaneaziz@gmail.com
