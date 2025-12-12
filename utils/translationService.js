// Translation API Service - Calls Backend API
// Backend uses deep-translator library (free, no API keys required)

// Supported languages list
export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'az', name: 'Azerbaijani (Azərbaycanca)' },
  { code: 'ca', name: 'Catalan (Català)' },
  { code: 'zh-CN', name: 'Chinese (中文)' },
  { code: 'cs', name: 'Czech (Čeština)' },
  { code: 'da', name: 'Danish (Dansk)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
  { code: 'eo', name: 'Esperanto' },
  { code: 'fi', name: 'Finnish (Suomi)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'el', name: 'Greek (Ελληνικά)' },
  { code: 'he', name: 'Hebrew (עברית)' },
  { code: 'hi', name: 'Hindi (हिन्दी)' },
  { code: 'hu', name: 'Hungarian (Magyar)' },
  { code: 'id', name: 'Indonesian (Bahasa Indonesia)' },
  { code: 'ga', name: 'Irish (Gaeilge)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'fa', name: 'Persian (فارسی)' },
  { code: 'pl', name: 'Polish (Polski)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'sk', name: 'Slovak (Slovenčina)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'sv', name: 'Swedish (Svenska)' },
  { code: 'tr', name: 'Turkish (Türkçe)' },
  { code: 'uk', name: 'Ukrainian (Українська)' },
  { code: 'vi', name: 'Vietnamese (Tiếng Việt)' }
];

// Backend API URL
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// In-memory cache for translations to reduce API calls
const translationCache = new Map();

/**
 * Generate a cache key for storing translations
 */
function getCacheKey(text, targetLang, sourceLang = 'en') {
  return `${sourceLang}:${targetLang}:${text}`;
}

/**
 * Translate text using backend API
 * @param {string|string[]} text - Text or array of texts to translate
 * @param {string} targetLang - Target language code (e.g., 'es', 'fr', 'de')
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string|string[]>} Translated text or array of translated texts
 */
export async function translateText(text, targetLang, sourceLang = 'en') {
  // If target language is English, no translation needed
  if (targetLang === 'en') {
    return text;
  }

  // Handle array of texts
  if (Array.isArray(text)) {
    return await translateBatch(text, targetLang, sourceLang);
  }

  // Check cache first
  const cacheKey = getCacheKey(text, targetLang, sourceLang);
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey);
  }

  try {
    const response = await fetch(`${API_URL}/api/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        source: sourceLang,
        target: targetLang
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.translatedText) {
      const translatedText = data.translatedText;
      
      // Cache the translation
      translationCache.set(cacheKey, translatedText);
      
      return translatedText;
    }

    throw new Error('Invalid response from translation API');
  } catch (error) {
    console.error('Translation error:', error);
    console.warn('Make sure backend server is running on port 5000');
    // Return original text if translation fails
    return text;
  }
}

/**
 * Translate multiple texts using backend batch API
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string[]>} Array of translated texts
 */
export async function translateBatch(texts, targetLang, sourceLang = 'en') {
  if (targetLang === 'en') {
    return texts;
  }

  try {
    // Check which texts are already cached
    const results = new Array(texts.length);
    const textsToTranslate = [];
    const indicesToTranslate = [];

    texts.forEach((text, index) => {
      const cacheKey = getCacheKey(text, targetLang, sourceLang);
      if (translationCache.has(cacheKey)) {
        results[index] = translationCache.get(cacheKey);
      } else {
        textsToTranslate.push(text);
        indicesToTranslate.push(index);
      }
    });

    // If all texts are cached, return immediately
    if (textsToTranslate.length === 0) {
      return results;
    }

    // Call backend batch API
    const response = await fetch(`${API_URL}/api/translate/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        texts: textsToTranslate,
        source: sourceLang,
        target: targetLang
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const data = await response.json();
    const translations = data.translations;
    
    // Store translations in results array and cache
    translations.forEach((translatedText, i) => {
      const originalIndex = indicesToTranslate[i];
      const originalText = textsToTranslate[i];
      
      // Cache the translation
      const cacheKey = getCacheKey(originalText, targetLang, sourceLang);
      translationCache.set(cacheKey, translatedText);
      
      results[originalIndex] = translatedText;
    });

    return results;
  } catch (error) {
    console.error('Batch translation error:', error);
    console.warn('Make sure LibreTranslate is running. Install with: pip install libretranslate && libretranslate');
    // Return original texts if translation fails
    return texts;
  }
}

/**
 * Clear the translation cache
 */
export function clearTranslationCache() {
  translationCache.clear();
}

/**
 * Get language name from code
 */
export function getLanguageName(code) {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang ? lang.name : code;
}

/**
 * Check if a language code is supported
 */
export function isLanguageSupported(code) {
  return SUPPORTED_LANGUAGES.some(l => l.code === code);
}
