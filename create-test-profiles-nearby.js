#!/usr/bin/env node

/**
 * Create Test Profiles Near Your Location
 *
 * This script creates fake profiles within 400m of coordinates you provide.
 *
 * Usage:
 *   1. Get your coordinates from the app (see them in the console when you open radar)
 *   2. Run: node create-test-profiles-nearby.js YOUR_LAT YOUR_LNG
 *
 * Example:
 *   node create-test-profiles-nearby.js 37.7749 -122.4194
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Get coordinates from command line args
const lat = parseFloat(process.argv[2]);
const lng = parseFloat(process.argv[3]);
const count = parseInt(process.argv[4]) || 5;
const festivalId = process.argv[5] || null; // Optional festival ID

if (isNaN(lat) || isNaN(lng)) {
  console.log('\n❌ Please provide valid coordinates!\n');
  console.log('Usage: node create-test-profiles-nearby.js [LAT] [LNG] [COUNT] [FESTIVAL_ID]');
  console.log('Example: node create-test-profiles-nearby.js 37.7749 -122.4194 5 coachella2024\n');
  console.log('💡 To get your coordinates:');
  console.log('   1. Open the app');
  console.log('   2. Check the console logs - it shows your location');
  console.log('   3. Your festival ID will also be shown in the logs\n');
  process.exit(1);
}

const names = [
  'Alex', 'Bailey', 'Casey', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper',
  'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Navy', 'Oak', 'Parker',
];

const bios = [
  'Love live music 🎵',
  'Coffee enthusiast ☕',
  'Adventure seeker 🏔️',
  'Foodie 🍕',
  'Dog lover 🐕',
  'Beach person 🌊',
  'Night owl 🦉',
  'Bookworm 📚',
];

function randomNearby(centerLat, centerLng, radiusMeters) {
  const radiusDegrees = radiusMeters / 111320;
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDegrees;
  return {
    latitude: centerLat + (distance * Math.cos(angle)),
    longitude: centerLng + (distance * Math.sin(angle)),
  };
}

function generatePhoto(name, gender) {
  const initial = name[0].toUpperCase();
  const colors = {
    Male: 'FF6B9D',
    Female: 'C44CE0',
    Other: '00FF00'
  };
  return `https://ui-avatars.com/api/?name=${initial}&size=400&background=${colors[gender]}&color=fff&bold=true`;
}

async function createProfile(lat, lng, festivalId) {
  const gender = ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)];
  const name = names[Math.floor(Math.random() * names.length)];
  const age = 18 + Math.floor(Math.random() * 30);
  const height = 150 + Math.floor(Math.random() * 50);
  const lookingFor = ['Male', 'Female', 'Both'][Math.floor(Math.random() * 3)];
  const bio = bios[Math.floor(Math.random() * bios.length)];
  const location = randomNearby(lat, lng, 400);
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const userData = {
    id,
    name,
    age,
    height,
    selfie_url: generatePhoto(name, gender),
    photos: [generatePhoto(name, gender)],
    status: true,
    location: `POINT(${location.longitude} ${location.latitude})`,
    gender,
    looking_for: lookingFor,
    bio,
    last_heartbeat: new Date().toISOString(),
  };

  // Only add festival_id if provided
  if (festivalId) {
    userData.festival_id = festivalId;
  }

  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) throw error;

  console.log(`✅ ${name}, ${age} (${gender}) at ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
  return data;
}

async function main() {
  console.log('\n🎭 Creating Test Profiles\n');
  console.log(`📍 Center: ${lat}, ${lng}`);
  console.log(`🎪 Festival: ${festivalId || 'none (will match all festivals)'}`);
  console.log(`👥 Creating ${count} profiles within 400m\n`);

  for (let i = 0; i < count; i++) {
    try {
      await createProfile(lat, lng, festivalId);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed: ${error.message}`);
    }
  }

  console.log(`\n✨ Done! Profiles created near you.`);
  console.log(`\n📱 Pull to refresh in the app to see them!\n`);
}

main().catch(console.error);
