# 🚀 Quick Start: Adding Translation to FinWise

## ⚡ 5-Minute Setup

### Step 1: Get Your API Key (2 minutes)

1. Go to https://console.cloud.google.com/
2. Enable "Cloud Translation API"
3. Create an API Key under Credentials
4. Copy the key

### Step 2: Configure Environment (1 minute)

```bash
# In the frontend directory
cp .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY=your_key_here
```

### Step 3: Restart Server (1 minute)

```bash
npm run dev
```

### Step 4: Test It! (1 minute)

1. Open http://localhost:3000
2. Login to your account
3. Go to "My Account" page
4. Select a language from the dropdown
5. Watch the magic happen! ✨

---

## 📖 Adding Translation to Your Pages

### Method 1: Use the Custom Hook (Easiest)

```javascript
import { useTranslatedContent } from '@/hooks/useTranslatedContent';

export default function YourPage() {
  const content = useTranslatedContent({
    title: 'Your Page Title',
    description: 'Page description here',
    button: 'Click Me'
  });

  return (
    <div>
      <h1>{content.title}</h1>
      <p>{content.description}</p>
      <button>{content.button}</button>
    </div>
  );
}
```

### Method 2: Add Language Selector Anywhere

```javascript
import LanguageSelector from '@/components/LanguageSelector';

export default function AnyPage() {
  return (
    <div>
      <LanguageSelector />
      {/* Your content */}
    </div>
  );
}
```

---

## 🎯 What's Already Done

✅ **Translation Context** - Global state management  
✅ **Translation Service** - Google Translate API integration  
✅ **Language Selector** - Beautiful dropdown component  
✅ **My Account Page** - Fully translated example  
✅ **100+ Languages** - All Google Translate languages  
✅ **Caching System** - Efficient API usage  
✅ **Custom Hooks** - Easy component integration  
✅ **Persistent Storage** - User preference saved  

---

## 📋 Current Implementation

The translation feature is currently implemented on:

- ✅ **My Account Page** (`pages/myAccount.js`)
  - Language selector at the top
  - All UI text translates automatically
  - User preference is saved

---

## 🔄 How to Translate Other Pages

### Example: Translating Dashboard Page

**Before:**
```javascript
<h1>Dashboard</h1>
<p>Welcome back, {user.name}!</p>
```

**After:**
```javascript
import { useTranslatedContent } from '@/hooks/useTranslatedContent';

const content = useTranslatedContent({
  title: 'Dashboard',
  welcome: 'Welcome back'
});

<h1>{content.title}</h1>
<p>{content.welcome}, {user.name}!</p>
```

That's it! The text will automatically translate when the user changes language.

---

## 🌍 Supported Languages

**Popular languages include:**
- English, Spanish, French, German, Italian, Portuguese
- Chinese (Simplified & Traditional), Japanese, Korean
- Hindi, Arabic, Russian, Turkish, Vietnamese
- And 90+ more!

See `utils/translationService.js` for the complete list.

---

## 💡 Pro Tips

1. **Always define text in English** - It's the default language
2. **Use descriptive keys** - `welcome: 'Welcome'` not `text1: 'Welcome'`
3. **Group related text** - Keep all page text in one `useTranslatedContent()` call
4. **Add Language Selector to each page** - Or add it to Navbar for global access
5. **Test with different languages** - Try Spanish, Chinese, and Arabic

---

## 🐛 Troubleshooting

**Problem**: Translation not working?
```bash
# Solution: Check if API key is set
echo $NEXT_PUBLIC_GOOGLE_TRANSLATE_API_KEY
# If empty, add it to .env.local and restart server
```

**Problem**: Changes not appearing?
```bash
# Solution: Restart the development server
# Press Ctrl+C, then:
npm run dev
```

**Problem**: API errors in console?
- Check if Cloud Translation API is enabled in Google Cloud Console
- Verify API key is correct in `.env.local`
- Check if you've exceeded free tier quota (500k characters/month)

---

## 📊 Next Steps

Want to translate more pages? Follow this pattern:

1. **Dashboard** → Add `useTranslatedContent()` for stats and buttons
2. **Analytics** → Translate chart labels and insights
3. **Rewards** → Translate achievement descriptions
4. **News** → Translate page UI (news content comes pre-translated)
5. **Community** → Translate post UI and buttons
6. **Navbar** → Translate navigation items for global access

Check `examples/translation-examples.js` for complete examples!

---

## 📞 Need Help?

- 📚 Read: `TRANSLATION_FEATURE.md` - Comprehensive documentation
- 👀 See: `examples/translation-examples.js` - Code examples
- 🔍 Check: Google Cloud Console for API status
- 💬 Ask: Open an issue if you need assistance

---

**Happy Translating! 🌐**
