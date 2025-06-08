// Simple Node.js script to generate placeholder cover images
// Run with: node generate-covers.cjs

const fs = require('fs');
const path = require('path');

// Create simple SVG cover images for each vibe
const vibes = [
  { name: 'Casual Hang', colors: ['#10B981', '#3B82F6'], emoji: '😎' },
  { name: 'Party Mode', colors: ['#EF4444', '#EC4899'], emoji: '🎉' },
  { name: 'Shots Night', colors: ['#F59E0B', '#F97316'], emoji: '🥃' },
  { name: 'Chill Vibes', colors: ['#3B82F6', '#8B5CF6'], emoji: '🌙' },
  { name: 'Wild Night', colors: ['#8B5CF6', '#EF4444'], emoji: '🔥' },
  { name: 'Classy Evening', colors: ['#F59E0B', '#EAB308'], emoji: '🥂' },
  { name: 'default-event-cover', colors: ['#6B7280', '#4B5563'], emoji: '✨' }
];

function createSVGCover(vibe) {
  const width = 800;
  const height = 450;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${vibe.colors[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${vibe.colors[1]};stop-opacity:1" />
    </linearGradient>
    <pattern id="pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="url(#grad)"/>
      <rect x="0" y="0" width="20" height="20" fill="rgba(0,0,0,0.1)"/>
      <rect x="20" y="20" width="20" height="20" fill="rgba(0,0,0,0.1)"/>
    </pattern>
  </defs>
  
  <!-- Background gradient -->
  <rect width="100%" height="100%" fill="url(#pattern)"/>
  
  <!-- Overlay gradient -->
  <rect width="100%" height="100%" fill="url(#grad)" opacity="0.8"/>
  
  <!-- Bottom gradient for text readability -->
  <defs>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(0,0,0,0);stop-opacity:0" />
      <stop offset="100%" style="stop-color:rgba(0,0,0,0.6);stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#textGrad)"/>
  
  <!-- Emoji -->
  <text x="50%" y="45%" text-anchor="middle" font-size="72" font-family="Arial, sans-serif">${vibe.emoji}</text>
  
  <!-- Title -->
  <text x="50%" y="65%" text-anchor="middle" font-size="36" font-weight="bold" fill="white" font-family="Arial, sans-serif">${vibe.name.replace('default-event-cover', 'Event')}</text>
  
  <!-- Border -->
  <rect x="2" y="2" width="${width-4}" height="${height-4}" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="4"/>
</svg>`;
}

// Generate SVG files
vibes.forEach(vibe => {
  const svg = createSVGCover(vibe);
  const filename = `${vibe.name}.svg`;
  fs.writeFileSync(filename, svg);
  console.log(`Generated ${filename}`);
});

console.log('All cover images generated!');
console.log('Note: For production, convert these SVGs to WebP format for better performance.');
