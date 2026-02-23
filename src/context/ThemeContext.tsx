
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'EN' | 'HI' | 'TE' | 'KN';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  isHighContrast: boolean;
  toggleHighContrast: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('civicflow-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('civicflow-contrast') === 'high';
  });

  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('civicflow-lang') as Language) || 'EN';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('civicflow-theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('civicflow-theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isHighContrast) {
      root.classList.add('high-contrast');
      localStorage.setItem('civicflow-contrast', 'high');
    } else {
      root.classList.remove('high-contrast');
      localStorage.setItem('civicflow-contrast', 'normal');
    }
  }, [isHighContrast]);

  const toggleDarkMode = () => setIsDarkMode(prev => !prev);
  const toggleHighContrast = () => setIsHighContrast(prev => !prev);
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('civicflow-lang', lang);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, isHighContrast, toggleHighContrast, language, setLanguage }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
