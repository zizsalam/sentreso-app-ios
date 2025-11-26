#!/bin/bash
# Daily analytics email script
# Usage: ./scripts/send-daily-analytics.sh

echo "📊 Sending daily Sentreso field analytics..."

# Set your email here
RECIPIENT_EMAIL="kaneaziz@gmail.com"

# Run the analytics script
node scripts/email-field-analytics.js "$RECIPIENT_EMAIL"

echo "✅ Daily analytics email sent to $RECIPIENT_EMAIL"
