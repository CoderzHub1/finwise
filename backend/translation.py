# Translation API using LibreTranslate
# LibreTranslate is a Free and Open Source Machine Translation API
# Documentation: https://github.com/LibreTranslate/LibreTranslate

from deep_translator import GoogleTranslator
import os

# List of supported languages (same as frontend)
SUPPORTED_LANGUAGES = [
    {'code': 'en', 'name': 'English'},
    {'code': 'ar', 'name': 'Arabic (العربية)'},
    {'code': 'az', 'name': 'Azerbaijani (Azərbaycanca)'},
    {'code': 'ca', 'name': 'Catalan (Català)'},
    {'code': 'zh-CN', 'name': 'Chinese (中文)'},
    {'code': 'cs', 'name': 'Czech (Čeština)'},
    {'code': 'da', 'name': 'Danish (Dansk)'},
    {'code': 'nl', 'name': 'Dutch (Nederlands)'},
    {'code': 'eo', 'name': 'Esperanto'},
    {'code': 'fi', 'name': 'Finnish (Suomi)'},
    {'code': 'fr', 'name': 'French (Français)'},
    {'code': 'de', 'name': 'German (Deutsch)'},
    {'code': 'el', 'name': 'Greek (Ελληνικά)'},
    {'code': 'he', 'name': 'Hebrew (עברית)'},
    {'code': 'hi', 'name': 'Hindi (हिन्दी)'},
    {'code': 'hu', 'name': 'Hungarian (Magyar)'},
    {'code': 'id', 'name': 'Indonesian (Bahasa Indonesia)'},
    {'code': 'ga', 'name': 'Irish (Gaeilge)'},
    {'code': 'it', 'name': 'Italian (Italiano)'},
    {'code': 'ja', 'name': 'Japanese (日本語)'},
    {'code': 'ko', 'name': 'Korean (한국어)'},
    {'code': 'fa', 'name': 'Persian (فارسی)'},
    {'code': 'pl', 'name': 'Polish (Polski)'},
    {'code': 'pt', 'name': 'Portuguese (Português)'},
    {'code': 'ru', 'name': 'Russian (Русский)'},
    {'code': 'sk', 'name': 'Slovak (Slovenčina)'},
    {'code': 'es', 'name': 'Spanish (Español)'},
    {'code': 'sv', 'name': 'Swedish (Svenska)'},
    {'code': 'tr', 'name': 'Turkish (Türkçe)'},
    {'code': 'uk', 'name': 'Ukrainian (Українська)'},
    {'code': 'vi', 'name': 'Vietnamese (Tiếng Việt)'},
]

def translate_text(text, source_lang='en', target_lang='en'):
    """
    Translate text using deep-translator library (uses Google Translate for free)
    
    Args:
        text (str): Text to translate
        source_lang (str): Source language code (e.g., 'en')
        target_lang (str): Target language code (e.g., 'es')
    
    Returns:
        str: Translated text
    """
    # If target is same as source, return original text
    if source_lang == target_lang or target_lang == 'en':
        return text
    
    try:
        # Use deep-translator which is free and doesn't require API keys
        translator = GoogleTranslator(source=source_lang, target=target_lang)
        translated = translator.translate(text)
        return translated
    except Exception as e:
        print(f"Translation error: {str(e)}")
        # Return original text if translation fails
        return text

def translate_batch(texts, source_lang='en', target_lang='en'):
    """
    Translate multiple texts at once
    
    Args:
        texts (list): List of texts to translate
        source_lang (str): Source language code
        target_lang (str): Target language code
    
    Returns:
        list: List of translated texts
    """
    if source_lang == target_lang or target_lang == 'en':
        return texts
    
    translated_texts = []
    for text in texts:
        translated_texts.append(translate_text(text, source_lang, target_lang))
    
    return translated_texts

def get_supported_languages():
    """
    Get list of supported languages
    
    Returns:
        list: List of language dictionaries with 'code' and 'name'
    """
    return SUPPORTED_LANGUAGES
