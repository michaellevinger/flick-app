import { supabase } from './supabase';

/**
 * Save customization draft to festival
 * @param {string} festivalId - Festival ID
 * @param {Object} customization - Customization data
 * @param {string} customization.primary_color - Primary theme color
 * @param {string} customization.secondary_color - Secondary theme color
 * @param {string} customization.custom_title - Custom event title
 * @param {string} customization.subtitle - Event subtitle
 * @param {Array} customization.custom_questions - Array of custom questions
 * @returns {Promise<Object>} Updated festival object
 */
export async function saveCustomizationDraft(festivalId, customization) {
  try {
    const {
      primary_color,
      secondary_color,
      custom_title,
      subtitle,
      custom_questions
    } = customization;

    const { data, error } = await supabase
      .from('festivals')
      .update({
        primary_color,
        secondary_color,
        custom_title,
        subtitle,
        custom_questions,
        customization_completed: true
      })
      .eq('id', festivalId)
      .select()
      .single();

    if (error) {
      console.error('Error saving customization:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to save customization draft:', error);
    throw error;
  }
}

/**
 * Get customization for a festival
 * @param {string} festivalId - Festival ID
 * @returns {Promise<Object>} Customization data
 */
export async function getCustomization(festivalId) {
  try {
    const { data, error } = await supabase
      .from('festivals')
      .select('primary_color, secondary_color, custom_title, subtitle, custom_questions, customization_completed')
      .eq('id', festivalId)
      .single();

    if (error) {
      console.error('Error fetching customization:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get customization:', error);
    throw error;
  }
}

/**
 * Publish event (make it live)
 * @param {string} festivalId - Festival ID
 * @returns {Promise<Object>} Updated festival object
 */
export async function publishEvent(festivalId) {
  try {
    const { data, error } = await supabase
      .from('festivals')
      .update({ is_published: true })
      .eq('id', festivalId)
      .select()
      .single();

    if (error) {
      console.error('Error publishing event:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to publish event:', error);
    throw error;
  }
}

/**
 * Pre-made icebreaker question templates
 * Couples can select from these or create their own
 */
export const PRESET_QUESTIONS = [
  {
    id: 'q1',
    text: 'Meet me at the bar',
    type: 'prompt',
    icon: '🍸'
  },
  {
    id: 'q2',
    text: 'Want to dance to the next song?',
    type: 'prompt',
    icon: '💃'
  },
  {
    id: 'q3',
    text: "Let's grab a drink during cocktail hour",
    type: 'prompt',
    icon: '🥂'
  },
  {
    id: 'q4',
    text: 'Join me for the bouquet toss',
    type: 'prompt',
    icon: '💐'
  },
  {
    id: 'q5',
    text: 'Save me a seat at your table',
    type: 'prompt',
    icon: '🪑'
  }
];

/**
 * Validate customization data
 * @param {Object} customization - Customization object to validate
 * @returns {Object} { isValid: boolean, errors: Object }
 */
export function validateCustomization(customization) {
  const errors = {};

  // Validate color format (hex)
  const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

  if (customization.primary_color && !hexColorRegex.test(customization.primary_color)) {
    errors.primary_color = 'Invalid color format. Use hex format like #FF6B9D';
  }

  if (customization.secondary_color && !hexColorRegex.test(customization.secondary_color)) {
    errors.secondary_color = 'Invalid color format. Use hex format like #C44CE0';
  }

  // Validate title length
  if (customization.custom_title && customization.custom_title.length > 50) {
    errors.custom_title = 'Title must be 50 characters or less';
  }

  // Validate subtitle length
  if (customization.subtitle && customization.subtitle.length > 100) {
    errors.subtitle = 'Subtitle must be 100 characters or less';
  }

  // Validate custom questions
  if (customization.custom_questions) {
    if (!Array.isArray(customization.custom_questions)) {
      errors.custom_questions = 'Custom questions must be an array';
    } else if (customization.custom_questions.length > 10) {
      errors.custom_questions = 'Maximum 10 custom questions allowed';
    } else {
      // Validate individual questions
      customization.custom_questions.forEach((q, index) => {
        if (!q.text || q.text.trim().length === 0) {
          errors[`question_${index}`] = 'Question text cannot be empty';
        } else if (q.text.length > 100) {
          errors[`question_${index}`] = 'Question must be 100 characters or less';
        }
      });
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
