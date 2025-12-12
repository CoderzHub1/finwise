import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { translateText, translateBatch, SUPPORTED_LANGUAGES } from '@/utils/translationService';

const TranslationContext = createContext();

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
}

export function TranslationProvider({ children }) {
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);

  // Load saved language preference from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferredLanguage');
    if (savedLanguage && SUPPORTED_LANGUAGES.some(l => l.code === savedLanguage)) {
      setCurrentLanguage(savedLanguage);
    }
  }, []);

  // Save language preference to localStorage
  const changeLanguage = useCallback((languageCode) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('preferredLanguage', languageCode);
  }, []);

  /**
   * Translate a single text string
   * @param {string} text - Text to translate
   * @param {string} sourceLang - Source language (default: 'en')
   * @returns {Promise<string>} Translated text
   */
  const translate = useCallback(async (text, sourceLang = 'en') => {
    if (!text || typeof text !== 'string') return text;
    
    try {
      setIsTranslating(true);
      const translated = await translateText(text, currentLanguage, sourceLang);
      return translated;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  /**
   * Translate multiple text strings in batch
   * @param {string[]} texts - Array of texts to translate
   * @param {string} sourceLang - Source language (default: 'en')
   * @returns {Promise<string[]>} Array of translated texts
   */
  const translateMultiple = useCallback(async (texts, sourceLang = 'en') => {
    if (!Array.isArray(texts) || texts.length === 0) return texts;
    
    try {
      setIsTranslating(true);
      const translated = await translateBatch(texts, currentLanguage, sourceLang);
      return translated;
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts;
    } finally {
      setIsTranslating(false);
    }
  }, [currentLanguage]);

  /**
   * Translate an object's values
   * @param {Object} obj - Object with string values to translate
   * @param {string} sourceLang - Source language (default: 'en')
   * @returns {Promise<Object>} Object with translated values
   */
  const translateObject = useCallback(async (obj, sourceLang = 'en') => {
    if (!obj || typeof obj !== 'object') return obj;
    
    const keys = Object.keys(obj);
    const values = Object.values(obj).map(v => String(v));
    
    try {
      const translatedValues = await translateMultiple(values, sourceLang);
      const result = {};
      keys.forEach((key, index) => {
        result[key] = translatedValues[index];
      });
      return result;
    } catch (error) {
      console.error('Object translation error:', error);
      return obj;
    }
  }, [translateMultiple]);

  /**
   * Get a translation function bound to a specific component
   * Returns original text immediately if language is English,
   * otherwise returns translated text asynchronously
   */
  const t = useCallback((text, sourceLang = 'en') => {
    if (currentLanguage === 'en') {
      return text;
    }
    return translate(text, sourceLang);
  }, [currentLanguage, translate]);

  const value = {
    currentLanguage,
    changeLanguage,
    translate,
    translateMultiple,
    translateObject,
    t,
    isTranslating,
    supportedLanguages: SUPPORTED_LANGUAGES,
  };

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}
