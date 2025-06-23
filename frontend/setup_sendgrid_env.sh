#!/bin/bash

# Setup SendGrid Environment Variables for Supabase Edge Functions
# This script securely sets up your SendGrid API key in Supabase

echo "🔧 Setting up SendGrid environment variables for Supabase Edge Functions..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Please install it first:"
    echo "   npm install -g supabase"
    echo "   or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory. Please run this from your project root."
    exit 1
fi

echo "📧 Setting SendGrid API key..."

# Set the SendGrid API key as a secret
supabase secrets set SENDGRID_API_KEY=YOUR_SENDGRID_API_KEY_HERE

# Set the email service URL (SendGrid)
supabase secrets set EMAIL_SERVICE_URL=https://api.sendgrid.com/v3/mail/send

# Set the from email address
supabase secrets set EMAIL_FROM_ADDRESS=noreply@thirstee.app
supabase secrets set EMAIL_FROM_NAME=Thirstee

echo "✅ SendGrid environment variables set successfully!"
echo ""
echo "🔍 You can verify the secrets were set by running:"
echo "   supabase secrets list"
echo ""
echo "📝 Next steps:"
echo "   1. Run the database setup script in Supabase SQL Editor"
echo "   2. Deploy your Edge Functions: supabase functions deploy"
echo "   3. Test the email system"
