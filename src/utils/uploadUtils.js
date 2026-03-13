import { supabase } from '../lib/supabase';
import * as FileSystem from 'expo-file-system/legacy';
import Constants from 'expo-constants';

const SUPABASE_URL =
  Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY =
  Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Upload a local file URI to a Supabase Storage bucket via XMLHttpRequest.
 * XHR is used instead of fetch because it is more reliable for binary uploads in React Native.
 * Returns the public URL of the uploaded file.
 */
export async function uploadFileToStorage(bucket, filename, fileUri) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase credentials not configured');
  }

  // Read file as base64
  const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: 'base64' });

  // Convert base64 to binary
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${bucket}/${filename}`;

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.timeout = 60000;

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error - please check your internet connection'));
    xhr.ontimeout = () => reject(new Error('Upload timeout - please try again'));

    xhr.open('POST', uploadUrl);
    xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader('Content-Type', 'image/jpeg');
    xhr.send(bytes.buffer);
  });

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename);
  return urlData.publicUrl;
}
