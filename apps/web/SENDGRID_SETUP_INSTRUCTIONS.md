# 📧 SendGrid Setup Instructions for Thirstee

## 🔐 Setting Up SendGrid API Key Securely

### Method 1: Using Supabase CLI (Recommended)

1. **Make sure you're logged into Supabase CLI:**
   ```bash
   supabase login
   ```

2. **Run the setup script:**
   ```bash
   chmod +x setup_sendgrid_env.sh
   ./setup_sendgrid_env.sh
   ```

### Method 2: Using Supabase Dashboard

1. **Go to your Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard/project/arpphimkotjvnfoacquj
   - Navigate to: **Settings** → **Edge Functions** → **Environment Variables**

2. **Add these environment variables:**
   ```
   SENDGRID_API_KEY = YOUR_SENDGRID_API_KEY_HERE
   EMAIL_SERVICE_URL = https://api.sendgrid.com/v3/mail/send
   EMAIL_FROM_ADDRESS = noreply@thirstee.app
   EMAIL_FROM_NAME = Thirstee
   ```

## 🗄️ Database Setup

1. **Run the database check script first:**
   - Copy the contents of `check_database_status.sql`
   - Paste in Supabase SQL Editor
   - Run to see what's already set up

2. **Run the email system setup:**
   - Copy the contents of `fixed_email_setup.sql`
   - Paste in Supabase SQL Editor
   - Run to create tables, functions, and policies

## 🚀 Deploy Edge Functions

1. **Deploy the send-email function:**
   ```bash
   supabase functions deploy send-email
   ```

2. **Verify deployment:**
   ```bash
   supabase functions list
   ```

## 🧪 Test the Email System

1. **Test the Edge Function directly:**
   ```bash
   curl -X POST 'https://arpphimkotjvnfoacquj.supabase.co/functions/v1/send-email' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{
       "to": "your-email@example.com",
       "subject": "Test Email from Thirstee",
       "html": "<h1>Hello from Thirstee!</h1><p>This is a test email.</p>",
       "text": "Hello from Thirstee! This is a test email.",
       "type": "event_invitation"
     }'
   ```

2. **Test through your app:**
   - Create an event
   - Invite someone
   - Check if email is logged in `email_logs` table

## 🔍 Troubleshooting

### Common Issues:

1. **"Function not found" error:**
   - Make sure you've deployed the Edge Function
   - Check function name matches exactly

2. **"Permission denied" error:**
   - Verify RLS policies are set up correctly
   - Check if user is authenticated

3. **"SendGrid API error" error:**
   - Verify API key is correct
   - Check SendGrid account status
   - Ensure from email is verified in SendGrid

4. **Emails not sending:**
   - Check `email_logs` table for error messages
   - Verify environment variables are set
   - Check SendGrid activity logs

### Verification Queries:

```sql
-- Check if email tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_name IN ('email_logs', 'email_preferences');

-- Check recent email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 5;

-- Check email preferences for a user
SELECT * FROM email_preferences WHERE user_id = 'YOUR_USER_ID';

-- Test email function
SELECT * FROM send_event_invitation_emails('EVENT_ID', 'INVITER_ID');
```

## 📝 Next Steps After Setup

1. **Configure SendGrid:**
   - Verify your sender email in SendGrid
   - Set up domain authentication (optional but recommended)
   - Configure email templates in SendGrid (optional)

2. **Update your app:**
   - Test event invitations
   - Test email preferences
   - Add email notification UI components

3. **Monitor:**
   - Check email delivery rates
   - Monitor bounce rates
   - Set up alerts for failed emails

## 🔒 Security Notes

- ✅ API key is stored as Supabase secret (not in code)
- ✅ RLS policies protect email data
- ✅ Service role has limited permissions
- ✅ User preferences are respected
- ✅ Email addresses are validated

## 📧 Email Types Supported

- **Event Invitations:** When users are invited to events
- **Event Reminders:** 1 hour before events start
- **Crew Invitations:** When invited to join crews (future)
- **Welcome Emails:** New user onboarding (future)
- **Password Reset:** Account security (future)
