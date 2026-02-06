import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';
import { PROXIMITY_RADIUS } from '../constants/theme';

/**
 * Normalize user data to ensure correct types
 */
function normalizeUserData(user) {
  if (!user) return null;
  return {
    ...user,
    status: Boolean(user.status),
    age: Number(user.age),
  };
}

/**
 * Create or update a user in the database
 */
export async function upsertUser({ id, name, age, height, selfieUrl, status, location, phoneNumber, gender, lookingFor }) {
  const { data, error} = await supabase
    .from('users')
    .upsert(
      {
        id,
        name,
        age,
        height: height || null,
        selfie_url: selfieUrl,
        status,
        location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
        phone_number: phoneNumber || null,
        gender: gender || null,
        looking_for: lookingFor || null,
        last_heartbeat: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    throw error;
  }

  return normalizeUserData(data);
}

/**
 * Update user's heartbeat to prevent auto-wipe
 */
export async function updateHeartbeat(userId) {
  const { error } = await supabase
    .from('users')
    .update({ last_heartbeat: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('Error updating heartbeat:', error);
    throw error;
  }
}

/**
 * Update user's availability status
 */
export async function updateUserStatus(userId, status) {
  const { error } = await supabase
    .from('users')
    .update({ status })
    .eq('id', userId);

  if (error) {
    console.error('Error updating status:', error);
    throw error;
  }
}

/**
 * Update user's location
 */
export async function updateUserLocation(userId, location) {
  const { error } = await supabase
    .from('users')
    .update({
      location: `POINT(${location.longitude} ${location.latitude})`,
      last_heartbeat: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating location:', error);
    throw error;
  }
}

/**
 * Find users within a given radius (in meters) of a location
 * Uses PostGIS ST_DWithin for efficient geospatial queries
 */
export async function findNearbyUsers(userId, location, gender, lookingFor, radiusMeters = PROXIMITY_RADIUS) {
  // Use PostGIS to find users within radius
  // ST_DWithin uses geography type which handles Earth's curvature
  const { data, error } = await supabase.rpc('find_nearby_users', {
    user_lat: location.latitude,
    user_lng: location.longitude,
    radius_meters: radiusMeters,
    current_user_id: userId,
    current_user_gender: gender,
    current_user_looking_for: lookingFor,
  });

  if (error) {
    console.error('Error finding nearby users:', error);
    throw error;
  }

  return (data || []).map(normalizeUserData);
}

/**
 * Delete user (for cleanup/logout)
 */
export async function deleteUser(userId) {
  const { error } = await supabase.from('users').delete().eq('id', userId);

  if (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

/**
 * Upload selfie to Supabase Storage using direct HTTP upload
 */
export async function uploadSelfie(userId, photoUri) {
  try {
    console.log('uploadSelfie: Starting upload for', userId);
    console.log('uploadSelfie: Photo URI:', photoUri);

    // Create a unique filename
    const filename = `${userId}-${Date.now()}.jpg`;

    // Read file as base64
    console.log('uploadSelfie: Reading file...');
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: 'base64',
    });
    console.log('uploadSelfie: File read successfully, size:', base64.length);

    // Convert base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('uploadSelfie: Converted to binary, size:', bytes.length);

    // Get Supabase credentials (works in both dev and production)
    const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }

    // Try direct upload using XMLHttpRequest (more reliable than fetch in React Native)
    const uploadUrl = `${supabaseUrl}/storage/v1/object/selfies/${filename}`;

    console.log('uploadSelfie: Upload URL:', uploadUrl);
    console.log('uploadSelfie: Uploading via XHR...');

    const uploadResult = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.onload = () => {
        console.log('uploadSelfie: XHR complete, status:', xhr.status);
        if (xhr.status === 200 || xhr.status === 201) {
          resolve(JSON.parse(xhr.responseText));
        } else {
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        console.error('uploadSelfie: XHR error');
        reject(new Error('Network error - please check your internet connection'));
      };

      xhr.ontimeout = () => {
        console.error('uploadSelfie: XHR timeout');
        reject(new Error('Upload timeout - please try again'));
      };

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('apikey', supabaseKey);
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
      xhr.setRequestHeader('Content-Type', 'image/jpeg');
      xhr.timeout = 60000; // 60 second timeout (increased for mobile data)

      xhr.send(bytes.buffer);
    });

    console.log('uploadSelfie: Upload successful!', uploadResult);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('selfies')
      .getPublicUrl(filename);

    console.log('uploadSelfie: Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error('uploadSelfie: Error:', error);
    throw error;
  }
}

/**
 * Delete selfie from storage
 */
export async function deleteSelfie(selfieUrl) {
  try {
    // Extract filename from URL
    const urlParts = selfieUrl.split('/selfies/');
    if (urlParts.length < 2) return;

    const filename = urlParts[1];

    const { error } = await supabase.storage.from('selfies').remove([filename]);

    if (error) {
      console.error('Error deleting selfie:', error);
    }
  } catch (error) {
    console.error('Error in deleteSelfie:', error);
  }
}

/**
 * Subscribe to nearby users changes in real-time
 */
export function subscribeToNearbyUsers(userId, callback) {
  const subscription = supabase
    .channel('users_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=neq.${userId}`,
      },
      callback
    )
    .subscribe();

  return subscription;
}
