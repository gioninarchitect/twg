/**
 * Content Service - Hybrid Database-Driven with Local Fallbacks
 *
 * Architecture:
 * 1. Try to fetch from Supabase (when online)
 * 2. Cache content locally in AsyncStorage
 * 3. Fall back to bundled JSON files (offline or no data)
 *
 * This ensures 100% functionality even without internet.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isOnline } from './supabase';

// Import bundled fallback content for each language
import fallbackContentEn from '../../assets/content.json';
import fallbackContentAf from '../../assets/content_af.json';

// Types
export interface DayContent {
  day_number: number;
  title: string;
  phase_name: string;
  phase_key: string;
  reflection_content: string;
  scripture_text: string;
  scripture_reference: string;
  thought_of_day: string;
  prayer_text: string;
  journal_prompt: string;
  audio_reflection_url?: string;
  audio_prayer_url?: string;
}

export interface FrontMatter {
  dedication: string;
  opening_letter: string;
  about_author: string;
  introduction: string;
  how_to_use: string;
  why_forty_days: string;
}

export interface ContentMetadata {
  title: string;
  author: string;
  copyright: string;
}

export interface Phase {
  phase_key: string;
  phase_name: string;
  phase_description?: string;
  phase_order: number;
}

export interface LocalizedContent {
  metadata: ContentMetadata;
  frontMatter: FrontMatter;
  phases: Phase[];
  days: DayContent[];
  language: string;
  source: 'database' | 'cache' | 'fallback';
  lastUpdated: string;
}

// Storage keys
const STORAGE_KEYS = {
  CONTENT_PREFIX: 'twg_content_',
  CACHE_META: 'twg_content_cache_meta',
};

// Cache duration: 24 hours
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Get the storage key for a language
 */
function getContentKey(language: string): string {
  return `${STORAGE_KEYS.CONTENT_PREFIX}${language}`;
}

/**
 * Transform database day to DayContent format
 */
function transformDbDay(dbDay: any): DayContent {
  return {
    day_number: dbDay.day_number,
    title: dbDay.title,
    phase_name: dbDay.phase_name || dbDay.phase_key,
    phase_key: dbDay.phase_key,
    reflection_content: dbDay.reflection_content,
    scripture_text: dbDay.scripture_text,
    scripture_reference: dbDay.scripture_reference,
    thought_of_day: dbDay.thought_of_day,
    prayer_text: dbDay.prayer_text,
    journal_prompt: dbDay.journal_prompt,
    audio_reflection_url: dbDay.audio_reflection_url,
    audio_prayer_url: dbDay.audio_prayer_url,
  };
}

/**
 * Transform bundled JSON day to DayContent format
 */
function transformBundledDay(day: any): DayContent {
  return {
    day_number: day.day_number,
    title: day.title,
    phase_name: day.phase_name,
    phase_key: day.phase_name.toLowerCase(),
    reflection_content: day.reflection_content,
    scripture_text: day.scripture_text,
    scripture_reference: day.scripture_reference,
    thought_of_day: day.thought_of_day,
    prayer_text: day.prayer_text,
    journal_prompt: day.journal_prompt,
  };
}

/**
 * Get bundled fallback content for a language
 */
function getBundledFallback(language: string): LocalizedContent | null {
  // Currently we only have English bundled
  // As new languages are added, import and switch here
  if (language === 'en') {
    const bundled = fallbackContentEn as any;
    return {
      metadata: {
        title: bundled.metadata?.title || 'Tea With God: A 40-Day Devotional',
        author: bundled.metadata?.author || 'Lani Butler',
        copyright: bundled.metadata?.copyright || '2025-2026',
      },
      frontMatter: {
        dedication: bundled.frontMatter?.dedication || '',
        opening_letter: bundled.frontMatter?.openingLetter || '',
        about_author: bundled.frontMatter?.aboutAuthor || '',
        introduction: bundled.frontMatter?.introduction || '',
        how_to_use: bundled.frontMatter?.howToUse || '',
        why_forty_days: bundled.frontMatter?.whyFortyDays || '',
      },
      phases: [
        { phase_key: 'valley', phase_name: 'Valley', phase_order: 1 },
        { phase_key: 'waiting', phase_name: 'Waiting', phase_order: 2 },
        { phase_key: 'rising', phase_name: 'Rising', phase_order: 3 },
        { phase_key: 'becoming', phase_name: 'Becoming', phase_order: 4 },
      ],
      days: (bundled.days || []).map(transformBundledDay),
      language: 'en',
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    };
  }

  // For Afrikaans, use bundled Afrikaans content
  if (language === 'af') {
    const bundled = fallbackContentAf as any;
    return {
      metadata: {
        title: bundled.metadata?.title || 'Tee Met God: \'n 40-Dae Devosieboek',
        author: bundled.metadata?.author || 'Lani Butler',
        copyright: bundled.metadata?.copyright || '2025-2026',
      },
      frontMatter: {
        dedication: bundled.frontMatter?.dedication || '',
        opening_letter: bundled.frontMatter?.openingLetter || '',
        about_author: bundled.frontMatter?.aboutAuthor || '',
        introduction: bundled.frontMatter?.introduction || '',
        how_to_use: bundled.frontMatter?.howToUse || '',
        why_forty_days: bundled.frontMatter?.whyFortyDays || '',
      },
      phases: [
        { phase_key: 'valley', phase_name: 'Vallei', phase_order: 1 },
        { phase_key: 'waiting', phase_name: 'Wag', phase_order: 2 },
        { phase_key: 'rising', phase_name: 'Opstaan', phase_order: 3 },
        { phase_key: 'becoming', phase_name: 'Word', phase_order: 4 },
      ],
      days: (bundled.days || []).map(transformBundledDay),
      language: 'af',
      source: 'fallback',
      lastUpdated: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * Fetch content from Supabase database
 */
async function fetchFromDatabase(language: string): Promise<LocalizedContent | null> {
  try {
    // Fetch all content in parallel
    const [metadataRes, frontMatterRes, phasesRes, daysRes] = await Promise.all([
      supabase
        .from('content_metadata')
        .select('*')
        .eq('language_code', language)
        .single(),
      supabase
        .from('content_front_matter')
        .select('*')
        .eq('language_code', language)
        .single(),
      supabase
        .from('content_phases')
        .select('*')
        .eq('language_code', language)
        .order('phase_order'),
      supabase
        .from('content_days')
        .select('*')
        .eq('language_code', language)
        .order('day_number'),
    ]);

    // Check if we have content
    if (!daysRes.data || daysRes.data.length === 0) {
      console.log(`[ContentService] No database content for language: ${language}`);
      return null;
    }

    // Get phase names for mapping
    const phaseMap = new Map<string, string>();
    if (phasesRes.data) {
      phasesRes.data.forEach((p: any) => {
        phaseMap.set(p.phase_key, p.phase_name);
      });
    }

    // Transform days with phase names
    const days = daysRes.data.map((day: any) => ({
      ...transformDbDay(day),
      phase_name: phaseMap.get(day.phase_key) || day.phase_key,
    }));

    return {
      metadata: metadataRes.data ? {
        title: metadataRes.data.title,
        author: metadataRes.data.author,
        copyright: metadataRes.data.copyright,
      } : {
        title: 'Tea With God',
        author: 'Lani Butler',
        copyright: '2025-2026',
      },
      frontMatter: frontMatterRes.data ? {
        dedication: frontMatterRes.data.dedication || '',
        opening_letter: frontMatterRes.data.opening_letter || '',
        about_author: frontMatterRes.data.about_author || '',
        introduction: frontMatterRes.data.introduction || '',
        how_to_use: frontMatterRes.data.how_to_use || '',
        why_forty_days: frontMatterRes.data.why_forty_days || '',
      } : {
        dedication: '',
        opening_letter: '',
        about_author: '',
        introduction: '',
        how_to_use: '',
        why_forty_days: '',
      },
      phases: phasesRes.data?.map((p: any) => ({
        phase_key: p.phase_key,
        phase_name: p.phase_name,
        phase_description: p.phase_description,
        phase_order: p.phase_order,
      })) || [],
      days,
      language,
      source: 'database',
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[ContentService] Database fetch error:', error);
    return null;
  }
}

/**
 * Load content from local cache
 */
async function loadFromCache(language: string): Promise<LocalizedContent | null> {
  try {
    const cached = await AsyncStorage.getItem(getContentKey(language));
    if (!cached) return null;

    const content = JSON.parse(cached) as LocalizedContent;

    // Check if cache is still valid
    const cacheAge = Date.now() - new Date(content.lastUpdated).getTime();
    if (cacheAge > CACHE_DURATION_MS) {
      console.log(`[ContentService] Cache expired for language: ${language}`);
      return null;
    }

    return {
      ...content,
      source: 'cache',
    };
  } catch (error) {
    console.error('[ContentService] Cache load error:', error);
    return null;
  }
}

/**
 * Save content to local cache
 */
async function saveToCache(content: LocalizedContent): Promise<void> {
  try {
    await AsyncStorage.setItem(
      getContentKey(content.language),
      JSON.stringify(content)
    );
    console.log(`[ContentService] Cached content for language: ${content.language}`);
  } catch (error) {
    console.error('[ContentService] Cache save error:', error);
  }
}

/**
 * Main function: Get localized content
 *
 * Priority:
 * 1. Database (if online and has content)
 * 2. Local cache (if valid)
 * 3. Bundled fallback files
 *
 * @param language - ISO 639-1 language code (e.g., 'en', 'af')
 * @param forceRefresh - Force database fetch even if cached
 */
export async function getLocalizedContent(
  language: string,
  forceRefresh: boolean = false
): Promise<LocalizedContent> {
  console.log(`[ContentService] Getting content for language: ${language}`);

  // 1. Try cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = await loadFromCache(language);
    if (cached) {
      console.log(`[ContentService] Using cached content for: ${language}`);
      // Trigger background refresh if online
      refreshInBackground(language);
      return cached;
    }
  }

  // 2. Try database if online
  const online = await isOnline();
  if (online) {
    const dbContent = await fetchFromDatabase(language);
    if (dbContent) {
      console.log(`[ContentService] Using database content for: ${language}`);
      // Cache for offline use
      await saveToCache(dbContent);
      return dbContent;
    }
  }

  // 3. Fall back to bundled content
  const bundled = getBundledFallback(language);
  if (bundled) {
    console.log(`[ContentService] Using bundled fallback for: ${language}`);
    return bundled;
  }

  // 4. Last resort: English fallback
  const englishFallback = getBundledFallback('en');
  if (englishFallback) {
    console.log(`[ContentService] Using English fallback (no ${language} content available)`);
    return {
      ...englishFallback,
      language,
    };
  }

  // This should never happen, but just in case
  throw new Error(`No content available for language: ${language}`);
}

/**
 * Background refresh: Update cache from database without blocking
 */
async function refreshInBackground(language: string): Promise<void> {
  try {
    const online = await isOnline();
    if (!online) return;

    const dbContent = await fetchFromDatabase(language);
    if (dbContent) {
      await saveToCache(dbContent);
      console.log(`[ContentService] Background refresh complete for: ${language}`);
    }
  } catch (error) {
    // Silent fail - background refresh is optional
    console.log('[ContentService] Background refresh failed (non-critical)');
  }
}

/**
 * Get a single day's content
 */
export async function getDayContent(
  language: string,
  dayNumber: number
): Promise<DayContent | null> {
  const content = await getLocalizedContent(language);
  return content.days.find(d => d.day_number === dayNumber) || null;
}

/**
 * Get all days for a specific phase
 */
export async function getPhaseContent(
  language: string,
  phaseKey: string
): Promise<DayContent[]> {
  const content = await getLocalizedContent(language);
  return content.days.filter(d => d.phase_key === phaseKey);
}

/**
 * Get available languages (from database or defaults)
 */
export async function getAvailableLanguages(): Promise<Array<{
  code: string;
  name: string;
  native_name: string;
  enabled: boolean;
}>> {
  try {
    const online = await isOnline();
    if (online) {
      const { data, error } = await supabase
        .from('supported_languages')
        .select('*')
        .eq('enabled', true)
        .order('code');

      if (data && data.length > 0) {
        return data;
      }
    }
  } catch (error) {
    console.log('[ContentService] Could not fetch languages from database');
  }

  // Fallback to hardcoded list
  return [
    { code: 'en', name: 'English', native_name: 'English', enabled: true },
    { code: 'af', name: 'Afrikaans', native_name: 'Afrikaans', enabled: true },
  ];
}

/**
 * Clear cached content for a language
 */
export async function clearContentCache(language?: string): Promise<void> {
  try {
    if (language) {
      await AsyncStorage.removeItem(getContentKey(language));
    } else {
      // Clear all content caches
      const keys = await AsyncStorage.getAllKeys();
      const contentKeys = keys.filter(k => k.startsWith(STORAGE_KEYS.CONTENT_PREFIX));
      await AsyncStorage.multiRemove(contentKeys);
    }
    console.log('[ContentService] Cache cleared');
  } catch (error) {
    console.error('[ContentService] Cache clear error:', error);
  }
}

/**
 * Check if content is available for a language
 */
export async function isLanguageAvailable(language: string): Promise<boolean> {
  // Check cache first
  const cached = await loadFromCache(language);
  if (cached) return true;

  // Check database
  const online = await isOnline();
  if (online) {
    try {
      const { count } = await supabase
        .from('content_days')
        .select('*', { count: 'exact', head: true })
        .eq('language_code', language);
      if (count && count > 0) return true;
    } catch {
      // Ignore
    }
  }

  // Check bundled fallback
  const bundled = getBundledFallback(language);
  return bundled !== null;
}

export default {
  getLocalizedContent,
  getDayContent,
  getPhaseContent,
  getAvailableLanguages,
  clearContentCache,
  isLanguageAvailable,
};
