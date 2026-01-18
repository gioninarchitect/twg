/**
 * Content Context - Localized Content Provider
 *
 * Provides localized devotional content to the entire app.
 * Integrates with:
 * - i18n for language selection
 * - ContentService for database/cache/fallback loading
 *
 * This context ensures all screens access content through a single,
 * language-aware source.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useTranslation } from 'react-i18next';
import contentService, {
  LocalizedContent,
  DayContent,
  FrontMatter,
  ContentMetadata,
  Phase,
} from '../services/contentService';

interface ContentContextValue {
  // Loading state
  isLoading: boolean;
  error: string | null;

  // Content data
  metadata: ContentMetadata | null;
  frontMatter: FrontMatter | null;
  phases: Phase[];
  days: DayContent[];

  // Content source info
  contentSource: 'database' | 'cache' | 'fallback' | null;
  currentLanguage: string;

  // Helper functions
  getDay: (dayNumber: number) => DayContent | null;
  getDaysByPhase: (phaseKey: string) => DayContent[];
  getPhase: (phaseKey: string) => Phase | null;
  getPhaseName: (phaseKey: string) => string;

  // Actions
  refreshContent: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const ContentContext = createContext<ContentContextValue | null>(null);

interface ContentProviderProps {
  children: ReactNode;
}

export function ContentProvider({ children }: ContentProviderProps) {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language || 'en';

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<LocalizedContent | null>(null);

  // Load content when language changes
  useEffect(() => {
    loadContent();
  }, [currentLanguage]);

  const loadContent = useCallback(async (forceRefresh: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`[ContentContext] Loading content for language: ${currentLanguage}`);
      const localizedContent = await contentService.getLocalizedContent(
        currentLanguage,
        forceRefresh
      );
      setContent(localizedContent);
      console.log(`[ContentContext] Content loaded from: ${localizedContent.source}`);
    } catch (err) {
      console.error('[ContentContext] Failed to load content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load content');
    } finally {
      setIsLoading(false);
    }
  }, [currentLanguage]);

  const refreshContent = useCallback(async () => {
    await loadContent(true);
  }, [loadContent]);

  const clearCache = useCallback(async () => {
    await contentService.clearContentCache();
    await loadContent(true);
  }, [loadContent]);

  const getDay = useCallback((dayNumber: number): DayContent | null => {
    if (!content) return null;
    return content.days.find(d => d.day_number === dayNumber) || null;
  }, [content]);

  const getDaysByPhase = useCallback((phaseKey: string): DayContent[] => {
    if (!content) return [];
    return content.days.filter(d => d.phase_key.toLowerCase() === phaseKey.toLowerCase());
  }, [content]);

  const getPhase = useCallback((phaseKey: string): Phase | null => {
    if (!content) return null;
    return content.phases.find(p => p.phase_key.toLowerCase() === phaseKey.toLowerCase()) || null;
  }, [content]);

  const getPhaseName = useCallback((phaseKey: string): string => {
    const phase = getPhase(phaseKey);
    if (phase) return phase.phase_name;

    // Fallback: capitalize the key
    return phaseKey.charAt(0).toUpperCase() + phaseKey.slice(1);
  }, [getPhase]);

  const value: ContentContextValue = {
    isLoading,
    error,
    metadata: content?.metadata || null,
    frontMatter: content?.frontMatter || null,
    phases: content?.phases || [],
    days: content?.days || [],
    contentSource: content?.source || null,
    currentLanguage,
    getDay,
    getDaysByPhase,
    getPhase,
    getPhaseName,
    refreshContent,
    clearCache,
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

/**
 * Hook to access content context
 */
export function useContent(): ContentContextValue {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
}

/**
 * Hook to get a specific day's content
 */
export function useDayContent(dayNumber: number): {
  day: DayContent | null;
  isLoading: boolean;
  error: string | null;
} {
  const { getDay, isLoading, error } = useContent();
  return {
    day: getDay(dayNumber),
    isLoading,
    error,
  };
}

/**
 * Hook to get days for a specific phase
 */
export function usePhaseContent(phaseKey: string): {
  days: DayContent[];
  phase: Phase | null;
  isLoading: boolean;
} {
  const { getDaysByPhase, getPhase, isLoading } = useContent();
  return {
    days: getDaysByPhase(phaseKey),
    phase: getPhase(phaseKey),
    isLoading,
  };
}

export default ContentContext;
