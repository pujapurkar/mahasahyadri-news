'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'en' | 'mr';
type LanguageContextType = { language: Lang; setLanguage: (lang: Lang) => void; };

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',           // ← default 'en' करा
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Lang>('en'); // ← 'en' default
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored === 'en' || stored === 'mr') {
      setLanguageState(stored);
    }
    setHydrated(true);
  }, []);

  const setLanguage = (lang: Lang) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
  };

  // ✅ null नाही — children render करा, फक्त hide करा flash होऊ नये म्हणून
  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      <div style={{ visibility: hydrated ? 'visible' : 'hidden' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);