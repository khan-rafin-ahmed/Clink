/**
 * Generate HTML preview files for email templates
 * Run with: node generate-email-previews.cjs
 */

const fs = require('fs');
const path = require('path');

function generateEventInvitationEmailPreview() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Thirstee - Event Invitation Preview</title>
    <style>
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #08090A !important;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #FFFFFF;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #08090A;
        }
        
        .header {
            background-color: #08090A;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FFFFFF;
            text-decoration: none;
            text-shadow: none;
        }
        
        .tagline {
            font-size: 14px;
            color: #B3B3B3;
            margin-top: 8px;
            opacity: 1;
        }
        
        .content {
            padding: 40px 20px;
            background-color: #08090A;
        }
        
        .footer {
            padding: 30px 20px;
            background-color: #08090A;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .footer-text {
            font-size: 12px;
            color: #B3B3B3;
            line-height: 1.5;
        }
        
        .footer-text a {
            color: #00FFA3;
            text-decoration: none;
        }
        
        .glass-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
            backdrop-filter: blur(10px);
        }
        
        .card-title {
            font-size: 20px;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 16px;
        }
        
        .card-detail {
            margin: 12px 0;
            color: #B3B3B3;
            font-size: 15px;
            line-height: 1.6;
        }
        
        .card-detail strong {
            color: #FFFFFF;
        }
        
        .btn-primary {
            display: inline-block;
            padding: 12px 24px;
            background-color: #FFFFFF;
            color: #08090A !important;
            text-decoration: none;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 15px;
            text-align: center;
            margin: 8px;
            border: none;
            transition: all 0.2s ease;
        }
        
        .btn-secondary {
            display: inline-block;
            padding: 12px 24px;
            background-color: #07080A;
            color: #FFFFFF !important;
            text-decoration: none;
            border-radius: 9999px;
            font-weight: 500;
            font-size: 15px;
            text-align: center;
            margin: 8px;
            border: 1px solid rgba(255,255,255,0.1);
            transition: all 0.2s ease;
        }
        
        .vibe-badge {
            display: inline-block;
            background: rgba(255,255,255,0.08);
            color: #FFFFFF;
            padding: 6px 12px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            margin: 12px 0;
            border: 1px solid rgba(255,255,255,0.1);
        }
        
        @media only screen and (max-width: 600px) {
            .btn-primary, .btn-secondary {
                display: block !important;
                width: 90% !important;
                margin: 10px auto !important;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🤘 Thirstee</div>
            <div class="tagline">Tap. Plan. Thirstee.</div>
        </div>
        
        <div class="content">
            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">
              🥂 You're Invited to Raise Hell!
            </h1>
            
            <p style="font-size: 16px; color: #B3B3B3; line-height: 1.6; text-align: center; margin-bottom: 24px;">
              <strong style="color: #FFFFFF;">Roughin</strong> invited you to a Session
            </p>
            
            <div class="glass-card">
              <div class="card-title">Messi's Birthday Celebration</div>
              
              <div class="vibe-badge">🥂 CLASSY VIBES</div>
              
              <div class="card-detail">
                <strong>📅 Date:</strong> Tuesday, June 24, 2025 at 8:00 PM
              </div>
              
              <div class="card-detail">
                <strong>📍 Location:</strong> Rooftop Bar Downtown
              </div>
              
              <div class="card-detail" style="margin-top: 16px;">
                <strong>📝 Details:</strong><br>
                Come celebrate with the crew! Drinks, music, and good vibes all night.
              </div>
            </div>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="#" class="btn-primary">🍺 Accept Invitation</a>
              <a href="#" class="btn-secondary">😔 Can't Make It</a>
            </div>
            
            <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
              <a href="#" style="color: #00FFA3; text-decoration: underline;">View full event details</a>
            </p>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                © 2025 Thirstee. Built with 🍻 & 🤘 by Roughin<br>
                <br>
                <a href="#" class="footer-text">Unsubscribe</a> | 
                <a href="#" class="footer-text">Update Preferences</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

function generateCrewInvitationEmailPreview() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thirstee - Crew Invitation Preview</title>
    <style>
        body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: #08090A !important;
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
            color: #FFFFFF;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #08090A;
        }
        
        .header {
            background-color: #08090A;
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #FFFFFF;
        }
        
        .tagline {
            font-size: 14px;
            color: #B3B3B3;
            margin-top: 8px;
        }
        
        .content {
            padding: 40px 20px;
            background-color: #08090A;
        }
        
        .footer {
            padding: 30px 20px;
            background-color: #08090A;
            text-align: center;
            border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .footer-text {
            font-size: 12px;
            color: #B3B3B3;
            line-height: 1.5;
        }
        
        .footer-text a {
            color: #00FFA3;
            text-decoration: none;
        }
        
        .glass-card {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 24px;
            margin: 24px 0;
            backdrop-filter: blur(10px);
        }
        
        .card-title {
            font-size: 20px;
            font-weight: 600;
            color: #FFFFFF;
            margin-bottom: 16px;
        }
        
        .card-detail {
            margin: 12px 0;
            color: #B3B3B3;
            font-size: 15px;
            line-height: 1.6;
        }
        
        .card-detail strong {
            color: #FFFFFF;
        }
        
        .btn-primary {
            display: inline-block;
            padding: 12px 24px;
            background-color: #FFFFFF;
            color: #08090A !important;
            text-decoration: none;
            border-radius: 9999px;
            font-weight: 600;
            font-size: 15px;
            text-align: center;
            margin: 8px;
            border: none;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">🤘 Thirstee</div>
            <div class="tagline">Join the Crew!</div>
        </div>
        
        <div class="content">
            <h1 style="color: #FFFFFF; font-size: 24px; font-weight: 600; margin-bottom: 20px; text-align: center;">🍻 Crew Invitation</h1>

            <p style="font-size: 16px; color: #B3B3B3; line-height: 1.6; text-align: center; margin-bottom: 24px;"><strong style="color: #FFFFFF;">Roughin</strong> has invited you to join their crew</p>

            <div class="glass-card">
              <div class="card-title">Beer Bros</div>

              <div class="card-detail">
                👥 5 members
              </div>

              <div class="card-detail" style="margin-top: 16px;">
                <strong>📝 Description:</strong><br>
                A crew for beer enthusiasts who love trying new brews and having a good time.
              </div>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="#" class="btn-primary">🤘 View Invitation</a>
            </div>

            <p style="font-size: 14px; color: #B3B3B3; text-align: center;">
              If button doesn't work: <a href="#" style="color: #00FFA3; text-decoration: underline;">View in browser</a>
            </p>
        </div>
        
        <div class="footer">
            <div class="footer-text">
                © 2025 Thirstee. Built with 🍻 & 🤘 by Roughin<br>
                <br>
                <a href="#" class="footer-text">Unsubscribe</a> | 
                <a href="#" class="footer-text">Update Preferences</a>
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Generate preview files
console.log('🎨 Generating email template previews...\n');

try {
  // Create previews directory if it doesn't exist
  const previewsDir = path.join(__dirname, 'email-previews');
  if (!fs.existsSync(previewsDir)) {
    fs.mkdirSync(previewsDir);
  }

  // Generate event invitation preview
  const eventPreview = generateEventInvitationEmailPreview();
  fs.writeFileSync(path.join(previewsDir, 'event-invitation-preview.html'), eventPreview);
  console.log('✅ Event invitation preview generated: email-previews/event-invitation-preview.html');

  // Generate crew invitation preview
  const crewPreview = generateCrewInvitationEmailPreview();
  fs.writeFileSync(path.join(previewsDir, 'crew-invitation-preview.html'), crewPreview);
  console.log('✅ Crew invitation preview generated: email-previews/crew-invitation-preview.html');

  console.log('\n🎉 Email previews generated successfully!');
  console.log('\n📖 To view the previews:');
  console.log('1. Open the HTML files in your browser');
  console.log('2. Test on different screen sizes to verify responsive design');
  console.log('3. Check that all colors match the design system');

} catch (error) {
  console.error('❌ Error generating email previews:', error);
  process.exit(1);
}
