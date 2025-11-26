#!/bin/bash
# Executive analytics email script with cohort retention analysis
# Usage:
#   ./scripts/send-executive-report.sh [email]
#   ./scripts/send-executive-report.sh other@email.com

echo "📊 Sending Sentreso executive dashboard with cohort retention analysis..."

# Use provided email or default
RECIPIENT_EMAIL="${1:-kaneaziz@gmail.com}"

# Run the executive analytics script
node scripts/email-executive-analytics.js "$RECIPIENT_EMAIL"

echo "✅ Executive dashboard sent to $RECIPIENT_EMAIL"
