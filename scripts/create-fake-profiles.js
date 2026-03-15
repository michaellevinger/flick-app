#!/usr/bin/env node

/**
 * Create Fake Profiles Script
 *
 * Generates test profiles in the database for radar testing.
 * Usage: node create-fake-profiles.js [latitude] [longitude] [count]
 *
 * Example: node create-fake-profiles.js 34.0522 -118.2437 10
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

// Fake names pool
const maleNames = [
  'Alex', 'Ben', 'Chris', 'David', 'Ethan', 'Frank', 'George', 'Henry',
  'Ian', 'Jack', 'Kyle', 'Luke', 'Mike', 'Nick', 'Oscar', 'Paul',
  'Quinn', 'Ryan', 'Sam', 'Tom', 'Victor', 'Will', 'Xavier', 'Zach'
];

const femaleNames = [
  'Alice', 'Beth', 'Claire', 'Diana', 'Emma', 'Fiona', 'Grace', 'Hannah',
  'Iris', 'Julia', 'Kate', 'Lucy', 'Maya', 'Nina', 'Olivia', 'Paige',
  'Quinn', 'Rachel', 'Sarah', 'Tina', 'Uma', 'Violet', 'Wendy', 'Zoe'
];

const otherNames = [
  'Alex', 'Jordan', 'Casey', 'Riley', 'Morgan', 'Taylor', 'Quinn', 'Avery'
];

const bios = [
  'Love live music and festivals 🎵',
  'Adventure seeker 🏔️',
  'Coffee enthusiast ☕',
  'Foodie exploring the world 🌍',
  'Artist & creator 🎨',
  'Fitness junkie 💪',
  'Bookworm & movie buff 📚',
  'Dog lover 🐕',
  'Beach person 🌊',
  'Night owl 🦉',
  'Morning person ☀️',
  'Photography enthusiast 📸',
  'Traveler 🗺️',
  'Musician 🎸',
  'Dancer 💃',
];

// Generate random location within radius (in meters)
function randomLocationNear(lat, lng, radiusMeters) {
  // Convert radius to degrees (rough approximation)
  const radiusDegrees = radiusMeters / 111320;

  // Random angle
  const angle = Math.random() * 2 * Math.PI;

  // Random distance within radius
  const distance = Math.random() * radiusDegrees;

  // Calculate new coordinates
  const newLat = lat + (distance * Math.cos(angle));
  const newLng = lng + (distance * Math.sin(angle));

  return { latitude: newLat, longitude: newLng };
}

// Generate a mock US phone number
function generatePhoneNumber() {
  const areaCode = 200 + Math.floor(Math.random() * 800); // 200-999
  const prefix = 200 + Math.floor(Math.random() * 800);
  const line = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `+1${areaCode}${prefix}${line}`;
}

// Generate profile photo URL (using UI Avatars)
function generatePhotoUrl(name, gender) {
  const initial = name[0].toUpperCase();
  const bgColor = gender === 'Male' ? 'FF69B4' : (gender === 'Female' ? 'C44CE0' : 'FFD700');
  return `https://ui-avatars.com/api/?name=${initial}&size=400&background=${bgColor}&color=fff&bold=true&font-size=0.4`;
}

async function createFakeProfile(centerLat, centerLng, festivalId = 'coachella2024') {
  const gender = ['Male', 'Female', 'Other'][Math.floor(Math.random() * 3)];

  let namesPool;
  if (gender === 'Male') namesPool = maleNames;
  else if (gender === 'Female') namesPool = femaleNames;
  else namesPool = otherNames;

  const name = namesPool[Math.floor(Math.random() * namesPool.length)];
  const age = 18 + Math.floor(Math.random() * 30); // Age 18-48
  const height = 150 + Math.floor(Math.random() * 50); // Height 150-200cm
  const lookingFor = ['Male', 'Female', 'Both'][Math.floor(Math.random() * 3)];
  const bio = bios[Math.floor(Math.random() * bios.length)];

  // Random location within 400m radius (keep within radar range)
  const location = randomLocationNear(centerLat, centerLng, 400);

  // Generate photo URL
  const selfieUrl = generatePhotoUrl(name, gender);
  const photos = [selfieUrl]; // Just one photo for now

  // Generate unique ID
  const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const userData = {
    id,
    name,
    age,
    height,
    selfie_url: selfieUrl,
    photos,
    status: true, // Active
    location: `POINT(${location.longitude} ${location.latitude})`,
    phone_number: generatePhoneNumber(),
    gender,
    looking_for: lookingFor,
    festival_id: festivalId,
    bio,
    last_heartbeat: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('users')
    .insert(userData)
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating profile:', error);
    throw error;
  }

  console.log(`✅ Created: ${name}, ${age} (${gender}) at ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);
  return data;
}

async function main() {
  const args = process.argv.slice(2);

  // Default to Los Angeles coordinates (Coachella area)
  const centerLat = parseFloat(args[0]) || 33.6803;
  const centerLng = parseFloat(args[1]) || -116.2378;
  const count = parseInt(args[2]) || 10;
  const festivalId = args[3] || 'coachella2024';

  console.log('\n🎭 Creating Fake Profiles for Testing\n');
  console.log(`📍 Center: ${centerLat}, ${centerLng}`);
  console.log(`🎪 Festival: ${festivalId}`);
  console.log(`👥 Count: ${count}\n`);

  const profiles = [];

  for (let i = 0; i < count; i++) {
    try {
      const profile = await createFakeProfile(centerLat, centerLng, festivalId);
      profiles.push(profile);

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to create profile ${i + 1}:`, error.message);
    }
  }

  console.log(`\n✨ Successfully created ${profiles.length} fake profiles!\n`);
  console.log('📱 Open your app and pull to refresh the radar to see them.\n');
}

main().catch(console.error);
