/**
 * Language Context
 *
 * Provides language state and switching functionality across the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LANGUAGES, LanguageCode, changeLanguage, getCurrentLanguage } from '../i18n';

interface LanguageContextType {
  currentLanguage: LanguageCode;
  setLanguage: (lang: LanguageCode) => Promise<void>;
  languages: typeof LANGUAGES;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface Props {
  children: ReactNode;
}

export function LanguageProvider({ children }: Props) {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [isLoading, setIsLoading] = useState(true);

  // Initialize language from storage
  useEffect(() => {
    const initLanguage = async () => {
      try {
        const saved = await AsyncStorage.getItem('twg_language');
        if (saved && (saved === 'en' || saved === 'af')) {
          setCurrentLanguage(saved as LanguageCode);
        } else {
          setCurrentLanguage(getCurrentLanguage());
        }
      } catch (e) {
        console.log('Error loading language:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initLanguage();
  }, []);

  // Sync with i18n changes
  useEffect(() => {
    const handleLanguageChange = (lang: string) => {
      if (lang === 'en' || lang === 'af') {
        setCurrentLanguage(lang as LanguageCode);
      }
    };
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const setLanguage = async (lang: LanguageCode) => {
    setIsLoading(true);
    try {
      await changeLanguage(lang);
      setCurrentLanguage(lang);
    } catch (e) {
      console.log('Error setting language:', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        setLanguage,
        languages: LANGUAGES,
        isLoading,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
