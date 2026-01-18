/**
 * i18n Configuration for Tea With God Mobile App
 *
 * Supports English (en) and Afrikaans (af)
 * Uses device locale detection with fallback to English
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import af from './locales/af.json';

const LANGUAGE_KEY = 'twg_language';

// Supported languages
export const LANGUAGES = {
  en: { name: 'English', nativeName: 'English' },
  af: { name: 'Afrikaans', nativeName: 'Afrikaans' },
};

export type LanguageCode = keyof typeof LANGUAGES;

// Get device language, fallback to 'en'
const getDeviceLanguage = (): LanguageCode => {
  const locale = Localization.getLocales()[0]?.languageCode || 'en';
  // Only return af if device is set to Afrikaans
  if (locale === 'af') return 'af';
  return 'en';
};

// Initialize i18n
const initI18n = async () => {
  // Try to get saved language preference
  let savedLanguage: LanguageCode | null = null;
  try {
    savedLanguage = (await AsyncStorage.getItem(LANGUAGE_KEY)) as LanguageCode | null;
  } catch (e) {
    console.log('Error loading saved language:', e);
  }

  // TESTING: Force Afrikaans for testing translations
  const language = savedLanguage || 'af'; // getDeviceLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: en },
        af: { translation: af },
      },
      lng: language,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already escapes
      },
      react: {
        useSuspense: false, // Disable suspense for React Native
      },
    });

  return i18n;
};

// Change language and persist
export const changeLanguage = async (lang: LanguageCode) => {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  } catch (e) {
    console.log('Error changing language:', e);
  }
};

// Get current language
export const getCurrentLanguage = (): LanguageCode => {
  return (i18n.language as LanguageCode) || 'en';
};

// Initialize and export
initI18n();

export default i18n;
