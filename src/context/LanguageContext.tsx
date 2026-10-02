import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language, translations, TranslationDictionary } from '../i18n/translations';

export type TranslateFunction = {
  (key: string, params?: Record<string, string | number>): string;
} & TranslationDictionary;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslateFunction;
  translate: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'arogyavahini_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
      if (saved && ['en', 'kn', 'hi'].includes(saved)) {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  const translate = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const activeDict = (translations[language] || translations.en) as any;
      const fallbackDict = translations.en as any;

      let text = activeDict[key] ?? fallbackDict[key];
      if (text === undefined || text === null) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(`[i18n] Missing translation for key: "${key}" in language: "${language}"`);
        }
        text = key;
      }

      if (params && typeof text === 'string') {
        let interpolated = text;
        Object.entries(params).forEach(([paramKey, paramValue]) => {
          interpolated = interpolated.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
        });
        return interpolated;
      }

      return String(text);
    },
    [language]
  );

  const t = useMemo(() => {
    const fn = (key: string, params?: Record<string, string | number>) => translate(key, params);
    const activeDict = translations[language] || translations.en;
    // Layer English first, then active language to guarantee every key has a non-undefined string
    return Object.assign(fn, translations.en, activeDict) as TranslateFunction;
  }, [language, translate]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
