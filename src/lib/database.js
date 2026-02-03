import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

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
export async function upsertUser({ id, name, age, selfieUrl, status, location, phoneNumber }) {
  const { data, error} = await supabase
    .from('users')
    .upsert(
      {
        id,
        name,
        age,
        selfie_url: selfieUrl,
        status,
        location: location ? `POINT(${location.longitude} ${location.latitude})` : null,
        phone_number: phoneNumber || null,
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
export async function findNearbyUsers(userId, location, radiusMeters = 100) {
  // Use PostGIS to find users within radius
  // ST_DWithin uses geography type which handles Earth's curvature
  const { data, error } = await supabase.rpc('find_nearby_users', {
    user_lat: location.latitude,
    user_lng: location.longitude,
    radius_meters: radiusMeters,
    current_user_id: userId,
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
 * Upload selfie to Supabase Storage
 */
export async function uploadSelfie(userId, photoUri) {
  try {
    console.log('uploadSelfie: Starting upload for', userId);
    console.log('uploadSelfie: Photo URI:', photoUri);

    // Create a unique filename
    const filename = `${userId}-${Date.now()}.jpg`;

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('uploadSelfie: File read successfully, size:', base64.length);

    // Convert base64 to ArrayBuffer for upload
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    console.log('uploadSelfie: Converted to byte array, size:', byteArray.length);
    console.log('uploadSelfie: Uploading to Supabase...');

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('selfies')
      .upload(filename, byteArray.buffer, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('uploadSelfie: Upload error:', error);
      throw error;
    }

    console.log('uploadSelfie: Upload successful!', data);

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
