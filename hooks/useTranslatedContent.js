import { useState, useEffect } from 'react';
// import { useTranslation } from '@/context/TranslationContext';

/**
 * Custom hook for translating static text content in components
 * Automatically re-translates when language changes
 * 
 * @param {Object} defaultContent - Object with English text as default
 * @returns {Object} Translated content object
 * 
 * @example
 * const content = useTranslatedContent({
 *   title: 'Dashboard',
 *   subtitle: 'Welcome to your financial overview',
 *   button: 'Add Transaction'
 * });
 * 
 * // Use in JSX:
 * <h1>{content.title}</h1>
 * <p>{content.subtitle}</p>
 * <button>{content.button}</button>
 */
export function useTranslatedContent(defaultContent) {
  /*
  const { translate, currentLanguage } = useTranslation();
  const [translatedContent, setTranslatedContent] = useState(defaultContent);

  useEffect(() => {
    const translateContent = async () => {
      if (currentLanguage === 'en') {
        setTranslatedContent(defaultContent);
        return;
      }

      const keys = Object.keys(defaultContent);
      const values = Object.values(defaultContent);
      
      try {
        const translations = await Promise.all(
          values.map(text => translate(String(text)))
        );

        const result = {};
        keys.forEach((key, index) => {
          result[key] = translations[index];
        });

        setTranslatedContent(result);
      } catch (error) {
        console.error('Content translation error:', error);
        setTranslatedContent(defaultContent);
      }
    };

    translateContent();
  }, [currentLanguage, translate]);

  return translatedContent;
  */
  return defaultContent;
}

/**
 * Custom hook for translating a single text string
 * Returns the translated text that updates when language changes
 * 
 * @param {string} text - The text to translate
 * @param {string} sourceLang - Source language (default: 'en')
 * @returns {string} Translated text
 * 
 * @example
 * const welcomeMessage = useTranslatedText('Welcome back!');
 * return <h1>{welcomeMessage}</h1>;
 */
export function useTranslatedText(text, sourceLang = 'en') {
  /*
  const { translate, currentLanguage } = useTranslation();
  const [translatedText, setTranslatedText] = useState(text);

  useEffect(() => {
    const translateSingle = async () => {
      if (currentLanguage === 'en') {
        setTranslatedText(text);
        return;
      }

      try {
        const result = await translate(text, sourceLang);
        setTranslatedText(result);
      } catch (error) {
        console.error('Text translation error:', error);
        setTranslatedText(text);
      }
    };

    translateSingle();
  }, [text, currentLanguage, translate, sourceLang]);

  return translatedText;
  */
  return text;
}
