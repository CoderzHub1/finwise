import { useTranslation } from '@/context/TranslationContext';
import styles from '@/styles/LanguageSelector.module.css';

export default function LanguageSelector() {
  const { currentLanguage, changeLanguage, supportedLanguages } = useTranslation();

  const handleLanguageChange = (e) => {
    changeLanguage(e.target.value);
  };

  return (
    <div className={styles.languageSelectorContainer}>
      <label htmlFor="language-select" className={styles.label}>
        🌐 Language
      </label>
      <select
        id="language-select"
        value={currentLanguage}
        onChange={handleLanguageChange}
        className={styles.select}
      >
        {supportedLanguages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </select>
    </div>
  );
}
