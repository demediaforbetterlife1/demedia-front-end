/**
 * Phone Number Normalization Utility
 * Handles international phone numbers with country-specific prefixes
 */

/**
 * Normalizes a phone number by removing leading zeros and non-digit characters
 * @param phoneNumber - The phone number to normalize
 * @param countryCode - The country code (e.g., "+20", "+63", "+1")
 * @returns Normalized phone number with country code
 */
export function normalizePhoneNumber(phoneNumber: string, countryCode: string): string {
  // Remove all non-digit characters except the leading +
  let cleaned = phoneNumber.replace(/[^\d]/g, '');
  
  // Remove leading zeros (common in many countries like Egypt, Philippines, etc.)
  cleaned = cleaned.replace(/^0+/, '');
  
  // If the number already starts with the country code digits (without +), remove them
  const countryCodeDigits = countryCode.replace('+', '');
  if (cleaned.startsWith(countryCodeDigits)) {
    cleaned = cleaned.substring(countryCodeDigits.length);
  }
  
  // Return the full international format
  return countryCode + cleaned;
}

/**
 * Validates if a phone number is in a valid format
 * @param phoneNumber - The phone number to validate (can include country code)
 * @returns true if valid, false otherwise
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Check if it starts with + and has 8-15 digits (international standard)
  // E.164 format: +[country code][subscriber number]
  // Total length: 8-15 digits (including country code)
  const e164Regex = /^\+[1-9]\d{7,14}$/;
  
  return e164Regex.test(cleaned);
}

/**
 * Formats a phone number for display
 * @param phoneNumber - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // If it starts with +, it's already in international format
  if (phoneNumber.startsWith('+')) {
    return phoneNumber;
  }
  
  // Otherwise, just return as is
  return phoneNumber;
}

/**
 * Extracts the local number (without country code) for display
 * @param phoneNumber - The full phone number with country code
 * @param countryCode - The country code to remove
 * @returns Local phone number
 */
export function getLocalNumber(phoneNumber: string, countryCode: string): string {
  if (!phoneNumber) return '';
  
  const countryCodeDigits = countryCode.replace('+', '');
  
  // Remove + and country code
  let local = phoneNumber.replace(/^\+/, '');
  if (local.startsWith(countryCodeDigits)) {
    local = local.substring(countryCodeDigits.length);
  }
  
  return local;
}

/**
 * Country-specific phone number rules
 */
export const COUNTRY_PHONE_RULES = {
  // Egypt: 10 digits after removing leading 0
  '+20': { minLength: 10, maxLength: 10, hasLeadingZero: true },
  // Philippines: 10 digits after removing leading 0
  '+63': { minLength: 10, maxLength: 10, hasLeadingZero: true },
  // USA/Canada: 10 digits
  '+1': { minLength: 10, maxLength: 10, hasLeadingZero: false },
  // UK: 10 digits after removing leading 0
  '+44': { minLength: 10, maxLength: 10, hasLeadingZero: true },
  // India: 10 digits after removing leading 0
  '+91': { minLength: 10, maxLength: 10, hasLeadingZero: true },
  // Saudi Arabia: 9 digits after removing leading 0
  '+966': { minLength: 9, maxLength: 9, hasLeadingZero: true },
  // UAE: 9 digits after removing leading 0
  '+971': { minLength: 9, maxLength: 9, hasLeadingZero: true },
  // Default for other countries
  default: { minLength: 7, maxLength: 15, hasLeadingZero: true },
};

/**
 * Validates phone number based on country-specific rules
 * @param phoneNumber - The local phone number (without country code)
 * @param countryCode - The country code
 * @returns Validation result with error message if invalid
 */
export function validatePhoneByCountry(
  phoneNumber: string,
  countryCode: string
): { valid: boolean; error?: string } {
  const cleaned = phoneNumber.replace(/[^\d]/g, '');
  const rules = COUNTRY_PHONE_RULES[countryCode as keyof typeof COUNTRY_PHONE_RULES] || COUNTRY_PHONE_RULES.default;
  
  // Remove leading zero for validation
  const withoutLeadingZero = cleaned.replace(/^0+/, '');
  
  if (withoutLeadingZero.length < rules.minLength) {
    return {
      valid: false,
      error: `Phone number must be at least ${rules.minLength} digits`,
    };
  }
  
  if (withoutLeadingZero.length > rules.maxLength) {
    return {
      valid: false,
      error: `Phone number must be at most ${rules.maxLength} digits`,
    };
  }
  
  return { valid: true };
}
