#!/usr/bin/env node

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Sample festivals
const festivals = [
  { id: 'coachella2024', name: 'Coachella 2024', sponsor: 'Heineken' },
  { id: 'tomorrowland2024', name: 'Tomorrowland 2024', sponsor: 'Red Bull' },
  { id: 'lollapalooza2024', name: 'Lollapalooza 2024', sponsor: 'Spotify' },
  { id: 'test-festival', name: 'Test Festival', sponsor: 'Dev Testing' },
];

// Create QR codes directory
const qrDir = path.join(__dirname, 'qr-codes');
if (!fs.existsSync(qrDir)) {
  fs.mkdirSync(qrDir);
}

console.log('\n🎉 Flick QR Code Generator\n');
console.log('Generating QR codes for festivals...\n');

// Generate QR code for each festival
festivals.forEach(async (festival) => {
  const filename = `${festival.id}.png`;
  const filepath = path.join(qrDir, filename);

  try {
    // Generate QR code (just the festival ID)
    await QRCode.toFile(filepath, festival.id, {
      width: 1024,
      margin: 2,
      color: {
        dark: '#0B0F0E',
        light: '#FFFFFF',
      },
    });

    console.log(`✅ ${festival.name} (${festival.sponsor})`);
    console.log(`   Festival ID: ${festival.id}`);
    console.log(`   File: qr-codes/${filename}\n`);
  } catch (err) {
    console.error(`❌ Error generating QR for ${festival.id}:`, err.message);
  }
});

console.log('---\n');
console.log('📱 How to use:');
console.log('1. Print the QR codes from the qr-codes/ folder');
console.log('2. Display at your event (posters, wristbands, booths)');
console.log('3. Users scan → Join that festival room');
console.log('4. They only see other users in the same festival\n');

console.log('💡 To create a custom QR code:');
console.log('   node generate-qr.js <festival-id> <festival-name> <sponsor>\n');
console.log('   Example: node generate-qr.js burningman2024 "Burning Man 2024" "Red Bull"\n');

// Check if custom festival was provided via command line
if (process.argv.length >= 4) {
  const customId = process.argv[2];
  const customName = process.argv[3] || customId;
  const customSponsor = process.argv[4] || 'N/A';

  const filename = `${customId}.png`;
  const filepath = path.join(qrDir, filename);

  QRCode.toFile(filepath, customId, {
    width: 1024,
    margin: 2,
    color: {
      dark: '#0B0F0E',
      light: '#FFFFFF',
    },
  }).then(() => {
    console.log('---\n');
    console.log(`✅ Custom QR code generated:`);
    console.log(`   ${customName} (${customSponsor})`);
    console.log(`   Festival ID: ${customId}`);
    console.log(`   File: qr-codes/${filename}\n`);
  }).catch((err) => {
    console.error(`❌ Error:`, err.message);
  });
}
