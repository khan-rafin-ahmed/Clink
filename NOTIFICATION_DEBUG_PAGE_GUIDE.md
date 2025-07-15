# Notification Debug Page Guide

## Overview

The Notification Debug Page (`/debug/notifications`) is a comprehensive testing and troubleshooting tool for the email invitation and notification synchronization system. It provides real-time debugging capabilities for all aspects of the notification flow.

## Access

**URL**: `https://www.thirstee.app/debug/notifications`

**Requirements**: 
- Must be logged in
- Intended for development/staging environments
- Full access to database functions and email system

## Features

### 1. Email Invitation Testing

**Purpose**: Test the complete email invitation flow with token generation

**Capabilities**:
- ✅ Create test events with configurable details
- ✅ Send email invitations with automatically generated tokens
- ✅ View generated accept/decline tokens for verification
- ✅ Monitor email sending status and errors
- ✅ Manual email trigger for existing invitations

**How to Use**:
1. Configure test event details (title, date, location, description)
2. Click "Create Test Event" to generate a test event
3. Enter a test user email address
4. Click "Send Email Invitation" to trigger the complete flow
5. Check the Database State tab to verify tokens were created
6. Use the generated tokens in the Token Testing section

### 2. Token Processing Testing

**Purpose**: Test specific invitation tokens and simulate email link clicks

**Capabilities**:
- ✅ Test any invitation token (accept/decline)
- ✅ Simulate email link clicks without sending emails
- ✅ View detailed token validation results
- ✅ Display database function responses and errors
- ✅ Quick-test buttons for recent tokens

**How to Use**:
1. Enter a specific token (e.g., `event_accept_0eee3cab3e7946a4839f430f5a177d12`)
2. Click "Process Token" to simulate clicking the email link
3. Review the processing result (success/failure with details)
4. Check notification sync in the Notification Sync tab

### 3. Notification Synchronization Testing

**Purpose**: Verify email responses properly update in-app notifications

**Capabilities**:
- ✅ Display current in-app notifications for the logged-in user
- ✅ Show notification state before and after email responses
- ✅ Test in-app notification responses (Accept/Decline buttons)
- ✅ Real-time notification state updates
- ✅ Detailed notification data inspection

**How to Use**:
1. Create and send test invitations
2. View current notifications in this section
3. Process email tokens in the Token Testing section
4. Refresh to see updated notification states
5. Verify notifications show response status correctly

### 4. Database State Inspection

**Purpose**: Real-time view of database tables related to invitations

**Capabilities**:
- ✅ View invitation_tokens table contents
- ✅ Display event_members records and statuses
- ✅ Show notifications table entries
- ✅ Real-time refresh of all database states
- ✅ Summary statistics and counts

**Tables Monitored**:
- **invitation_tokens**: All tokens with expiration and usage status
- **event_members**: Invitation records with user details and response status
- **notifications**: In-app notifications with response data

### 5. End-to-End Flow Testing

**Purpose**: Complete automated test of the entire invitation flow

**Capabilities**:
- ✅ Single-button complete flow test
- ✅ Step-by-step progress indicator
- ✅ Automatic verification of each stage
- ✅ Detailed success/failure reporting

**Test Flow**:
1. **Create Event**: Generates a test event
2. **Send Invitation**: Creates invitation and sends email with tokens
3. **Process Token**: Simulates email acceptance/decline
4. **Verify Sync**: Confirms notification synchronization worked

### 6. Debug Console

**Purpose**: Real-time logging and error tracking

**Capabilities**:
- ✅ Timestamped debug logs for all operations
- ✅ Color-coded log levels (info, success, error, warning)
- ✅ Detailed error messages and stack traces
- ✅ API call and response logging
- ✅ Expandable data objects for inspection

## Common Testing Scenarios

### Scenario 1: Test Email Invitation Flow
1. Go to "Email Testing" tab
2. Create a test event
3. Enter your email address as test user
4. Send invitation
5. Check "Database State" to verify tokens were created
6. Copy an accept token from the database view
7. Go to "Token Testing" and process the token
8. Verify in "Notification Sync" that the notification updated

### Scenario 2: Debug Failing Email Links
1. Take the failing token from the email link
2. Go to "Token Testing" tab
3. Paste the token and click "Process Token"
4. Review the detailed error response
5. Check "Database State" to see if token exists
6. Use Debug Console logs to identify the issue

### Scenario 3: Verify Notification Synchronization
1. Create test invitation in "Email Testing"
2. Note the notification in "Notification Sync" tab
3. Process the email token in "Token Testing"
4. Refresh "Notification Sync" to see updated state
5. Verify notification shows response status correctly

### Scenario 4: End-to-End System Validation
1. Go to "E2E Testing" tab
2. Enter a test email address
3. Click "Run End-to-End Test"
4. Watch the progress indicators
5. Review any failures in the Debug Console
6. Use other tabs to investigate specific issues

## Troubleshooting Guide

### Issue: "Token not found" errors
**Check**:
- Database State → Invitation Tokens table
- Look for the specific token
- Verify token hasn't expired or been used
- Check if email sending actually created tokens

### Issue: Email invitations not sending
**Check**:
- Debug Console for email sending errors
- Database State → Event Members table for invitation records
- Email Testing section for detailed error messages
- SendGrid configuration and API keys

### Issue: Notifications not syncing
**Check**:
- Notification Sync tab for current notification state
- Process a token and refresh to see if state changes
- Debug Console for notification update errors
- Database State → Notifications table for response data

### Issue: Database function errors
**Check**:
- Debug Console for specific SQL errors
- Token Testing for function response details
- Verify all recent migrations have been applied
- Check function permissions and signatures

## Security Notes

⚠️ **Important**: This debug page should only be accessible in development/staging environments.

**Security Considerations**:
- Exposes sensitive database information
- Can create test users and data
- Shows internal system state and errors
- Should be removed or protected in production

## Technical Implementation

**Built With**:
- React + TypeScript
- Supabase client for database operations
- Real-time database state monitoring
- Comprehensive error handling and logging

**Database Functions Used**:
- `send_event_invitation_emails_with_tokens()`
- `process_event_invitation_token()`
- `respond_to_event_invitation()`
- Direct table queries for state inspection

**Key Features**:
- Real-time data refresh
- Comprehensive error logging
- Step-by-step test execution
- Interactive token testing
- Database state visualization

This debug page is essential for maintaining and troubleshooting the notification system, providing complete visibility into the email invitation and notification synchronization flow.
