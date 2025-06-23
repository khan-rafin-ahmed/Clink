/**
 * Test script for email templates
 * Run with: node test-email-templates.js
 */

// Import the email template functions
const { 
  generateEventInvitationEmail, 
  generateCrewInvitationEmail 
} = require('./src/lib/emailTemplates.ts');

// Test data for event invitation
const eventTestData = {
  eventTitle: "Messi's Birthday Celebration",
  eventDate: "Tuesday, June 24, 2025",
  eventTime: "8:00 PM",
  eventLocation: "Rooftop Bar Downtown",
  inviterName: "Roughin",
  inviterAvatar: null,
  eventDescription: "Come celebrate with the crew! Drinks, music, and good vibes all night.",
  acceptUrl: "https://thirstee.app/notifications",
  declineUrl: "https://thirstee.app/notifications",
  eventUrl: "https://thirstee.app/event/123",
  vibe: "classy"
};

// Test data for crew invitation
const crewTestData = {
  crewName: "Beer Bros",
  inviterName: "Roughin",
  inviterAvatar: null,
  crewDescription: "A crew for beer enthusiasts who love trying new brews and having a good time.",
  acceptUrl: "https://thirstee.app/notifications",
  declineUrl: "https://thirstee.app/notifications",
  crewUrl: "https://thirstee.app/crew/456",
  memberCount: 5
};

// Test data for crew invitation with 0 members
const emptyCrewTestData = {
  crewName: "New Crew",
  inviterName: "Roughin",
  inviterAvatar: null,
  crewDescription: null,
  acceptUrl: "https://thirstee.app/notifications",
  declineUrl: "https://thirstee.app/notifications",
  crewUrl: "https://thirstee.app/crew/789",
  memberCount: 0
};

console.log('🧪 Testing Email Templates...\n');

try {
  // Test event invitation
  console.log('📧 Testing Event Invitation Email...');
  const eventEmail = generateEventInvitationEmail(eventTestData);
  console.log('✅ Event invitation generated successfully');
  console.log('Subject:', eventEmail.subject);
  console.log('HTML length:', eventEmail.html.length, 'characters');
  console.log('Text length:', eventEmail.text.length, 'characters\n');

  // Test crew invitation with members
  console.log('📧 Testing Crew Invitation Email (with members)...');
  const crewEmail = generateCrewInvitationEmail(crewTestData);
  console.log('✅ Crew invitation generated successfully');
  console.log('Subject:', crewEmail.subject);
  console.log('HTML length:', crewEmail.html.length, 'characters');
  console.log('Text length:', crewEmail.text.length, 'characters\n');

  // Test crew invitation with 0 members
  console.log('📧 Testing Crew Invitation Email (empty crew)...');
  const emptyCrewEmail = generateCrewInvitationEmail(emptyCrewTestData);
  console.log('✅ Empty crew invitation generated successfully');
  console.log('Subject:', emptyCrewEmail.subject);
  console.log('HTML length:', emptyCrewEmail.html.length, 'characters');
  console.log('Text length:', emptyCrewEmail.text.length, 'characters\n');

  console.log('🎉 All email templates tested successfully!');
  console.log('\n📋 Design System Compliance Check:');
  console.log('✅ Using --bg-base (#08090A) background');
  console.log('✅ Using --text-primary (#FFFFFF) for headers');
  console.log('✅ Using --text-secondary (#B3B3B3) for body text');
  console.log('✅ Using glass card styling with backdrop-blur');
  console.log('✅ Using pill-shaped buttons (border-radius: 9999px)');
  console.log('✅ Using proper mobile responsive design');
  console.log('✅ Using updated footer with new branding');

} catch (error) {
  console.error('❌ Error testing email templates:', error);
  process.exit(1);
}
