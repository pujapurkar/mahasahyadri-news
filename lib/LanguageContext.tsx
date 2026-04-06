'use client';
import { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'en' | 'mr';
type LanguageContextType = { language: Lang; setLanguage: (lang: Lang) => void; };

const LanguageContext = createContext<LanguageContextType>({
  language: 'mr',
  setLanguage: () => {},
});

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Lang>('mr'); // always 'mr' on server
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // runs only on client, after mount
    const stored = localStorage.getItem('lang') as Lang | null;
    if (stored === 'en' || stored === 'mr') {
      setLanguageState(stored);
    }
    setHydrated(true);
  }, []);

  const setLanguage = (lang: Lang) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang); // write immediately, don't rely on useEffect
  };

  if (!hydrated) return null; // prevent flash of wrong language

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);