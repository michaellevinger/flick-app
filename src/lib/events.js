import { supabase } from './supabase';

/**
 * Generate a unique festival ID
 * Format: evt_<random_string>
 */
function generateFestivalId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `evt_${timestamp}_${randomStr}`;
}

/**
 * Create a new event/festival
 * @param {Object} eventData - Event details
 * @param {string} eventData.name - Event name (required)
 * @param {Date} eventData.startDate - Event start date (required)
 * @param {Date} eventData.endDate - Event end date (required)
 * @param {string} eventData.sponsorName - Sponsor name (optional)
 * @param {string} eventData.hostUserId - Host user ID (optional, for auth tracking)
 * @returns {Promise<Object>} Created festival object with id, name, dates, etc.
 */
export async function createEvent({ name, startDate, endDate, sponsorName, hostUserId }) {
  try {
    // Generate unique festival ID
    const festivalId = generateFestivalId();

    // Insert into festivals table
    const { data, error } = await supabase
      .from('festivals')
      .insert({
        id: festivalId,
        name: name.trim(),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        sponsor_name: sponsorName?.trim() || null,
        host_user_id: hostUserId || null,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      throw error;
    }

    return {
      id: data.id,
      name: data.name,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      sponsorName: data.sponsor_name,
      hostUserId: data.host_user_id,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('createEvent error:', error);
    throw error;
  }
}

/**
 * Get event details by festival ID
 * @param {string} festivalId - Festival ID
 * @returns {Promise<Object|null>} Festival object or null if not found
 */
export async function getEvent(festivalId) {
  try {
    const { data, error } = await supabase
      .from('festivals')
      .select('*')
      .eq('id', festivalId)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return null;
    }

    return {
      id: data.id,
      name: data.name,
      startDate: new Date(data.start_date),
      endDate: new Date(data.end_date),
      sponsorName: data.sponsor_name,
      hostUserId: data.host_user_id,
      isActive: data.is_active,
      createdAt: new Date(data.created_at),
    };
  } catch (error) {
    console.error('getEvent error:', error);
    return null;
  }
}

/**
 * Get all events created by a host user
 * @param {string} hostUserId - Host user ID
 * @returns {Promise<Array>} Array of festival objects
 */
export async function getHostEvents(hostUserId) {
  try {
    const { data, error } = await supabase
      .from('festivals')
      .select('*')
      .eq('host_user_id', hostUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching host events:', error);
      return [];
    }

    return data.map(event => ({
      id: event.id,
      name: event.name,
      startDate: new Date(event.start_date),
      endDate: new Date(event.end_date),
      sponsorName: event.sponsor_name,
      hostUserId: event.host_user_id,
      isActive: event.is_active,
      createdAt: new Date(event.created_at),
    }));
  } catch (error) {
    console.error('getHostEvents error:', error);
    return [];
  }
}

/**
 * Validate event creation data
 * @param {Object} eventData - Event details to validate
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateEventData({ name, startDate, endDate }) {
  const errors = {};

  // Name validation
  if (!name || name.trim().length < 3) {
    errors.name = 'Event name must be at least 3 characters';
  }

  if (name && name.trim().length > 100) {
    errors.name = 'Event name must be less than 100 characters';
  }

  // Start date validation
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!startDate) {
    errors.startDate = 'Start date is required';
  } else if (startDate < today) {
    errors.startDate = 'Start date must be today or later';
  }

  // End date validation
  if (!endDate) {
    errors.endDate = 'End date is required';
  } else if (startDate && endDate <= startDate) {
    errors.endDate = 'End date must be after start date';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
