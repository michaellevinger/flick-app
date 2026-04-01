import { supabase } from './supabase';
import { normalizeUserData } from '../utils/matchUtils';
import { uploadFileToStorage } from '../utils/uploadUtils';

/**
 * Create or update a user in the database
 */
export async function upsertUser({ id, name, age, height, selfieUrl, photos, status, phoneNumber, gender, lookingFor, festivalId, bio, notificationPreferences, ageRangeMin, ageRangeMax }) {
  const { data, error} = await supabase
    .from('users')
    .upsert(
      {
        id,
        name,
        age,
        height: height || null,
        selfie_url: selfieUrl,
        photos: photos || null, // Array of photo URLs
        status,
        phone_number: phoneNumber || null,
        gender: gender || null,
        looking_for: lookingFor || null,
        festival_id: festivalId || null,
        bio: bio || null,
        notification_preferences: notificationPreferences || null,
        age_range_min: ageRangeMin ?? 20,
        age_range_max: ageRangeMax ?? 35,
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
 * Update user's bio
 */
export async function updateUserBio(userId, bio) {
  const { error } = await supabase
    .from('users')
    .update({ bio })
    .eq('id', userId);

  if (error) {
    console.error('Error updating bio:', error);
    throw error;
  }
}

/**
 * Update user's phone number
 */
export async function updateUserPhoneNumber(userId, phoneNumber) {
  const { error } = await supabase
    .from('users')
    .update({ phone_number: phoneNumber })
    .eq('id', userId);

  if (error) {
    console.error('Error updating phone number:', error);
    throw error;
  }
}

/**
 * Update user's photos (array of photo URLs)
 */
export async function updateUserPhotos(userId, photos) {
  const { error } = await supabase
    .from('users')
    .update({
      photos: photos,
      selfie_url: photos[0] // First photo is the main selfie
    })
    .eq('id', userId);

  if (error) {
    console.error('Error updating photos:', error);
    throw error;
  }
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
 * Upload multiple photos to Supabase Storage
 */
export async function uploadPhotos(userId, photoUris) {
  try {
    console.log('uploadPhotos: Starting upload for', userId, 'with', photoUris.length, 'photos');

    const uploadPromises = photoUris.map((uri, index) =>
      uploadSinglePhoto(userId, uri, index)
    );

    const urls = await Promise.all(uploadPromises);
    console.log('uploadPhotos: All photos uploaded successfully');
    return urls;
  } catch (error) {
    console.error('uploadPhotos: Error:', error);
    throw error;
  }
}

/**
 * Upload a single photo to Supabase Storage
 */
async function uploadSinglePhoto(userId, photoUri, index = 0) {
  const filename = `${userId}-${index}-${Date.now()}.jpg`;
  return uploadFileToStorage('selfies', filename, photoUri);
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

// Export festival functions
export {
  validateAndJoinFestival,
  findUsersInFestival,
  getCurrentFestival,
  leaveFestival,
  getFestivalStats
} from './festivals';
