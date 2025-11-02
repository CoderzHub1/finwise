# Translation API Documentation

## Overview

The backend provides translation endpoints using the `deep-translator` Python library, which offers free translations without requiring API keys.

## Endpoints

### 1. Translate Single Text

**Endpoint**: `POST /api/translate`

**Request Body**:
```json
{
  "text": "Hello world",
  "source": "en",
  "target": "es"
}
```

**Response**:
```json
{
  "translatedText": "Hola mundo",
  "source": "en",
  "target": "es"
}
```

### 2. Translate Multiple Texts (Batch)

**Endpoint**: `POST /api/translate/batch`

**Request Body**:
```json
{
  "texts": ["Hello", "World", "How are you?"],
  "source": "en",
  "target": "es"
}
```

**Response**:
```json
{
  "translations": ["Hola", "Mundo", "¿Cómo estás?"],
  "source": "en",
  "target": "es"
}
```

### 3. Get Supported Languages

**Endpoint**: `GET /api/translate/languages`

**Response**:
```json
{
  "languages": [
    {"code": "en", "name": "English"},
    {"code": "es", "name": "Spanish (Español)"},
    {"code": "fr", "name": "French (Français)"},
    ...
  ]
}
```

## Installation

The `deep-translator` package is included in `requirements.txt`:

```bash
pip install -r requirements.txt
```

Or install individually:
```bash
pip install deep-translator
```

## Usage in Code

### Python (Backend)

```python
from translation import translate_text, translate_batch

# Single translation
result = translate_text("Hello", source_lang='en', target_lang='es')
print(result)  # "Hola"

# Batch translation
texts = ["Hello", "World"]
results = translate_batch(texts, source_lang='en', target_lang='es')
print(results)  # ["Hola", "Mundo"]
```

### JavaScript (Frontend)

```javascript
// Single translation
const response = await fetch('http://localhost:5000/api/translate', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    text: 'Hello',
    source: 'en',
    target: 'es'
  })
});
const data = await response.json();
console.log(data.translatedText);  // "Hola"
```

## Supported Languages (30+)

- English, Spanish, French, German, Italian, Portuguese
- Chinese, Japanese, Korean, Arabic, Hindi
- Russian, Turkish, Polish, Dutch, Swedish
- Czech, Danish, Finnish, Greek, Hebrew
- Hungarian, Indonesian, Irish, Persian, Slovak
- Ukrainian, Vietnamese, Azerbaijani, Catalan, Esperanto

See `translation.py` for the complete list.

## Features

- ✅ **Free**: No API costs or usage limits
- ✅ **No API Keys**: Works out of the box
- ✅ **30+ Languages**: All major world languages
- ✅ **Batch Support**: Translate multiple texts efficiently
- ✅ **Error Handling**: Returns original text on failure
- ✅ **Simple Integration**: Easy to use endpoints

## Notes

- Translation uses Google Translate's free web interface via deep-translator
- If translation fails, the original text is returned
- Target language `en` returns text unchanged (optimization)
- Translation quality is good for most common use cases
