# 🌐 Multi-Language Translation Feature

## Overview

FinWise now supports **30+ languages** using **deep-translator** - a FREE Python library that provides translation without any API keys or costs. Users can select their preferred language from the My Account page, and the entire application will be translated in real-time.

**Key Advantage**: Translation is handled by the backend using the free deep-translator library - no API keys, no costs, no external services!

## 🎯 Features

- ✅ **30+ Supported Languages** - All major world languages
- ✅ **100% FREE** - No API costs, no usage limits
- ✅ **No API Keys Required** - Works out of the box
- ✅ **Backend Translation** - Translation logic in Python backend
- ✅ **Real-time Translation** - Instant UI updates when language changes
- ✅ **Translation Caching** - Improves performance with local caching
- ✅ **Persistent Preference** - Selected language is saved to localStorage
- ✅ **Easy Integration** - Simple hooks for component translation
- ✅ **Default English** - No translation needed for English

## 📋 Setup Instructions

### Quick Setup (2 Minutes)

#### 1. Install Backend Dependency

The `deep-translator` package is already in `requirements.txt`. Just install it:

```powershell
cd backend
pip install -r requirements.txt
```

Or install individually:
```powershell
pip install deep-translator
```

#### 2. Start Backend Server

```powershell
cd backend
python main.py
```

The backend will start on `http://localhost:5000` with translation endpoints ready.

#### 3. Start Frontend Server

```powershell
cd frontend
npm run dev
```

**That's it!** Translation is now enabled. No API keys, no configuration files, no external services needed!

## 🎨 Usage Guide

### For Users

1. Navigate to **My Account** page
2. At the top of the page, you'll see the language selector
3. Click the dropdown and select your preferred language
4. The entire page will be translated automatically
5. Your preference is saved and will persist across sessions

### For Developers

#### Adding Translation to a Component

**Option 1: Using `useTranslatedContent` hook (Recommended)**

```javascript
import { useTranslatedContent } from '@/hooks/useTranslatedContent';

export default function MyComponent() {
  const content = useTranslatedContent({
    title: 'Dashboard',
    subtitle: 'Welcome to your financial overview',
    button: 'Add Transaction',
    message: 'Your data has been saved'
  });

  return (
    <div>
      <h1>{content.title}</h1>
      <p>{content.subtitle}</p>
      <button>{content.button}</button>
    </div>
  );
}
```

**Option 2: Using `useTranslation` context directly**

```javascript
import { useEffect, useState } from 'react';
import { useTranslation } from '@/context/TranslationContext';

export default function MyComponent() {
  const { translate, currentLanguage } = useTranslation();
  const [title, setTitle] = useState('Dashboard');

  useEffect(() => {
    const translateTitle = async () => {
      if (currentLanguage === 'en') {
        setTitle('Dashboard');
      } else {
        const translated = await translate('Dashboard');
        setTitle(translated);
      }
    };
    translateTitle();
  }, [currentLanguage, translate]);

  return <h1>{title}</h1>;
}
```

**Option 3: Using `useTranslatedText` hook for single strings**

```javascript
import { useTranslatedText } from '@/hooks/useTranslatedContent';

export default function MyComponent() {
  const welcomeMessage = useTranslatedText('Welcome back!');
  
  return <h1>{welcomeMessage}</h1>;
}
```

#### Adding Language Selector to Other Pages

```javascript
import LanguageSelector from '@/components/LanguageSelector';

export default function MyPage() {
  return (
    <div>
      <LanguageSelector />
      {/* Your page content */}
    </div>
  );
}
```

## 🏗️ Architecture

### File Structure

```
frontend/
├── context/
│   └── TranslationContext.js      # Translation state management
├── utils/
│   └── translationService.js      # Google Translate API integration
├── hooks/
│   └── useTranslatedContent.js    # Custom hooks for components
├── components/
│   └── LanguageSelector.js        # Language selection dropdown
└── styles/
    └── LanguageSelector.module.css
```

### Key Components

1. **TranslationContext**: Manages global translation state
2. **translationService**: Handles API calls and caching
3. **LanguageSelector**: UI component for language selection
4. **useTranslatedContent**: Custom hook for easy component translation

## 📊 Supported Languages (30+)

The application supports all major languages available in LibreTranslate:

**Major World Languages:**
- 🇬🇧 English (default)
- 🇪🇸 Spanish (Español)
- 🇫🇷 French (Français)
- 🇩🇪 German (Deutsch)
- 🇨🇳 Chinese (中文)
- 🇯🇵 Japanese (日本語)
- 🇰🇷 Korean (한국어)
- 🇮🇳 Hindi (हिन्दी)
- 🇵🇹 Portuguese (Português)
- 🇷🇺 Russian (Русский)
- 🇮🇹 Italian (Italiano)
- 🇸🇦 Arabic (العربية)

**Additional Languages:**
- Azerbaijani, Catalan, Czech, Danish, Dutch, Esperanto
- Finnish, Greek, Hebrew, Hungarian, Indonesian, Irish
- Persian, Polish, Slovak, Swedish, Thai, Turkish
- Ukrainian, Vietnamese

**Complete list**: See `utils/translationService.js` or `backend/translation.py`

## 💰 Cost Considerations

### Pricing

**Backend Translation (Using deep-translator):**
- **Cost**: **100% FREE** ✅
- **Setup**: `pip install deep-translator`
- **Usage**: Unlimited translations
- **API Keys**: NOT required
- **Requirements**: Python 3.8+

### Cost Comparison

| Service | Cost (1M characters) | Setup | API Key Required |
|---------|---------------------|-------|------------------|
| deep-translator (Backend) | **FREE** ✅ | pip install | NO ✅ |
| Google Translate API | $20/month | Cloud setup | YES |
| LibreTranslate Self-hosted | FREE | pip install + 3GB models | NO |

### Performance Optimizations

1. **Caching**: Automatic translation caching in frontend
2. **English Default**: No translation when English is selected
3. **Batch API**: Multiple texts translated in single request
4. **Local Storage**: Language preference persists
5. **Backend Processing**: Translation logic handled server-side

## 🔒 Security & Privacy

### Backend Translation Benefits

1. ✅ **No API Keys**: deep-translator works without any API keys
2. ✅ **No External Services**: Translation happens in your backend
3. ✅ **No Costs**: Completely free to use
4. ✅ **Open Source**: Fully auditable Python library
5. ✅ **Simple Setup**: Just install with pip

### Architecture

```
Frontend (Next.js) 
    ↓ Fetch API
Backend (Flask) → deep-translator → Google Translate (free)
    ↓
Translated Text
```

The deep-translator library uses Google Translate's free web interface (not the paid API), so you get translations without any API keys or costs!

## 🐛 Troubleshooting

### Translation not working?

1. **Check Backend Status**: Is the Flask backend running?
   ```powershell
   # Test the translation endpoint
   curl http://localhost:5000/api/translate/languages
   ```

2. **Verify deep-translator**: Is the package installed?
   ```powershell
   pip show deep-translator
   ```

3. **Restart Servers**: Restart both backend and frontend:
   ```powershell
   # Terminal 1: Backend
   cd backend
   python main.py
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

4. **Check Console**: Open browser console for error messages

5. **Check Backend Logs**: Look at backend terminal for any errors

### Performance issues?

1. **Clear Cache**: Call `clearTranslationCache()` if needed
2. **Use Batch Translation**: Translate multiple texts at once
3. **Optimize Components**: Use `useTranslatedContent` hook for better performance

## 🚀 Future Enhancements

Potential improvements:

- [ ] Add language detection for user input
- [ ] Implement server-side translation for SEO
- [ ] Add RTL (right-to-left) support for Arabic, Hebrew, etc.
- [ ] Create translation management dashboard
- [ ] Add support for custom glossaries
- [ ] Implement offline translation cache

## 📚 Resources

### deep-translator
- [GitHub Repository](https://github.com/nidhaloff/deep-translator)
- [PyPI Package](https://pypi.org/project/deep-translator/)
- [Documentation](https://deep-translator.readthedocs.io/)

### Backend Files
- `backend/translation.py` - Translation service implementation
- `backend/main.py` - API endpoints for translation
- `backend/requirements.txt` - Python dependencies

### Frontend Files
- `frontend/utils/translationService.js` - Frontend service that calls backend
- `frontend/context/TranslationContext.js` - React Context for translation state
- `frontend/components/LanguageSelector.js` - Language dropdown component
- `frontend/hooks/useTranslatedContent.js` - Custom hook for easy translation

## 📝 Notes

- deep-translator uses Google Translate's free web interface
- Translation quality is good for most common languages
- No API keys or external services required
- Backend handles all translation logic
- Some technical terms may not translate perfectly
- Numbers, dates, and currency symbols are not translated
- User-generated content (like category names) is not automatically translated

## 🏗️ Technical Architecture

### Backend (Python/Flask)
- `translation.py`: Core translation logic using deep-translator
- Endpoints: `/api/translate`, `/api/translate/batch`, `/api/translate/languages`
- Free Google Translate via deep-translator library

### Frontend (Next.js/React)
- Translation Context provides global language state
- Components call backend API endpoints
- Client-side caching for performance
- localStorage for language persistence

---

**Need Help?** Check the backend logs or open an issue in the repository.
