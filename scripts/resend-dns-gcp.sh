#!/bin/bash
# Add Resend DNS records to GCP Cloud DNS for send.prosodyai.app
#
# 1. Add send.prosodyai.app in Resend: https://resend.com/domains
# 2. Copy the MX, TXT (SPF), and TXT (DKIM) values from Resend
# 3. Set these env vars or replace the placeholders below:
#    - ZONE_NAME: your GCP managed zone name (e.g. prosodyai-app-zone)
#    - MX_VALUE: from Resend (e.g. feedback-smtp.us-east-1.amazonses.com)
#    - SPF_VALUE: from Resend (e.g. "v=spf1 include:amazonses.com ~all")
#    - DKIM_VALUE: from Resend (the p=... key)
# 4. Run: ./scripts/resend-dns-gcp.sh

set -e

ZONE_NAME="${GCP_DNS_ZONE:-prosodyai-app-zone}"
PROJECT="${GCP_PROJECT:-$(gcloud config get-value project 2>/dev/null)}"

# Replace these with values from Resend after adding send.prosodyai.app
MX_VALUE="${RESEND_MX_VALUE:-feedback-smtp.us-east-1.amazonses.com}"
SPF_VALUE="${RESEND_SPF_VALUE:-}"
DKIM_VALUE="${RESEND_DKIM_VALUE:-}"

if [ -z "$SPF_VALUE" ] || [ -z "$DKIM_VALUE" ]; then
  echo "Usage: Get values from https://resend.com/domains after adding send.prosodyai.app"
  echo ""
  echo "Then run:"
  echo "  RESEND_MX_VALUE='feedback-smtp.us-east-1.amazonses.com' \\"
  echo "  RESEND_SPF_VALUE='\"v=spf1 include:amazonses.com ~all\"' \\"
  echo "  RESEND_DKIM_VALUE='p=YOUR_DKIM_KEY_FROM_RESEND' \\"
  echo "  GCP_DNS_ZONE='your-zone-name' \\"
  echo "  ./scripts/resend-dns-gcp.sh"
  exit 1
fi

echo "Adding Resend DNS records to zone $ZONE_NAME (project: $PROJECT)"

# MX record (send.prosodyai.app)
gcloud dns record-sets create send.prosodyai.app. \
  --zone="$ZONE_NAME" \
  --type=MX \
  --ttl=300 \
  --rrdatas="10 $MX_VALUE."

# TXT SPF record (send.prosodyai.app)
gcloud dns record-sets create send.prosodyai.app. \
  --zone="$ZONE_NAME" \
  --type=TXT \
  --ttl=300 \
  --rrdatas="$SPF_VALUE"

# TXT DKIM record (resend._domainkey.send.prosodyai.app)
gcloud dns record-sets create resend._domainkey.send.prosodyai.app. \
  --zone="$ZONE_NAME" \
  --type=TXT \
  --ttl=300 \
  --rrdatas="$DKIM_VALUE"

echo "Done. Verify in Resend: https://resend.com/domains"
echo "DNS propagation may take a few minutes."
