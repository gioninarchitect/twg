/**
 * Tea With God - Internationalization (i18n) System
 * Supports English (en) and Afrikaans (af)
 */

const i18n = {
  currentLang: 'en',
  translations: {},
  defaultLang: 'en',
  supportedLangs: ['en', 'af'],

  /**
   * Initialize the i18n system
   */
  async init() {
    console.log('[i18n] Initializing...');
    // Detect language from URL path or localStorage
    this.currentLang = this.detectLanguage();
    console.log('[i18n] Detected language:', this.currentLang);

    // Load translations
    await this.loadTranslations(this.currentLang);
    console.log('[i18n] Initial translations loaded');

    // Apply translations to DOM
    this.applyTranslations();
    console.log('[i18n] Initial translations applied');

    // Update lang attribute
    document.documentElement.lang = this.currentLang;

    // Update language switcher state
    this.updateLanguageSwitcher();

    return this;
  },

  /**
   * Detect language from URL or localStorage
   */
  detectLanguage() {
    // Check URL path first (e.g., /af/index.html or /af/)
    const path = window.location.pathname;
    const pathMatch = path.match(/^\/(en|af)(\/|$)/);
    if (pathMatch && this.supportedLangs.includes(pathMatch[1])) {
      return pathMatch[1];
    }

    // Check localStorage
    const stored = localStorage.getItem('twg-language');
    if (stored && this.supportedLangs.includes(stored)) {
      return stored;
    }

    // Check browser language
    const browserLang = navigator.language.split('-')[0];
    if (this.supportedLangs.includes(browserLang)) {
      return browserLang;
    }

    return this.defaultLang;
  },

  /**
   * Load translation file
   */
  async loadTranslations(lang) {
    try {
      // Determine the base path for translations
      const basePath = this.getBasePath();
      const response = await fetch(`${basePath}translations/${lang}.json`);
      if (!response.ok) throw new Error(`Failed to load ${lang} translations`);
      this.translations = await response.json();
    } catch (error) {
      console.warn(`Failed to load translations for ${lang}:`, error);
      // Fallback to English if loading fails
      if (lang !== 'en') {
        await this.loadTranslations('en');
      }
    }
  },

  /**
   * Get base path for resources (handles nested pages)
   */
  getBasePath() {
    const path = window.location.pathname;
    // Count depth: /b2b/index.html = 1, /admin/index.html = 1
    const depth = (path.match(/\//g) || []).length - 1;
    if (path.includes('/af/') || path.includes('/en/')) {
      // Language prefix adds extra depth
      return depth > 1 ? '../'.repeat(depth - 1) : './';
    }
    return depth > 0 ? '../'.repeat(depth) : './';
  },

  /**
   * Get translation by key (supports nested keys with dot notation)
   */
  t(key, replacements = {}) {
    const keys = key.split('.');
    let value = this.translations;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing: ${key}`);
        return key; // Return key as fallback
      }
    }

    // Apply replacements (e.g., {{name}} -> value)
    if (typeof value === 'string') {
      Object.keys(replacements).forEach(placeholder => {
        value = value.replace(new RegExp(`{{${placeholder}}}`, 'g'), replacements[placeholder]);
      });
    }

    return value;
  },

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  applyTranslations() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = this.t(key);
      if (translation !== key) {
        el.textContent = translation;
      }
    });

    // Translate HTML content (for elements with HTML in translations)
    document.querySelectorAll('[data-i18n-html]').forEach(el => {
      const key = el.getAttribute('data-i18n-html');
      const translation = this.t(key);
      if (translation !== key) {
        el.innerHTML = translation;
      }
    });

    // Translate placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const translation = this.t(key);
      if (translation !== key) {
        el.placeholder = translation;
      }
    });

    // Translate titles/tooltips
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      const translation = this.t(key);
      if (translation !== key) {
        el.title = translation;
        // Also update alt attribute for images
        if (el.tagName === 'IMG') {
          el.alt = translation;
        }
      }
    });

    // Translate aria-labels
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria');
      const translation = this.t(key);
      if (translation !== key) {
        el.setAttribute('aria-label', translation);
      }
    });

    // Update page title
    const titleKey = document.querySelector('title')?.getAttribute('data-i18n');
    if (titleKey) {
      document.title = this.t(titleKey);
    }
  },

  /**
   * Switch language
   */
  async switchLanguage(lang) {
    console.log('[i18n] switchLanguage called with:', lang);
    if (!this.supportedLangs.includes(lang)) {
      console.warn(`Unsupported language: ${lang}`);
      return;
    }

    // Save preference
    localStorage.setItem('twg-language', lang);
    this.currentLang = lang;
    console.log('[i18n] Language set to:', lang);

    // Reload translations and apply
    await this.loadTranslations(lang);
    console.log('[i18n] Translations loaded, keys:', Object.keys(this.translations));
    this.applyTranslations();
    console.log('[i18n] Translations applied');

    // Update lang attribute
    document.documentElement.lang = lang;

    // Update language switcher state
    this.updateLanguageSwitcher();

    // Dispatch event for other components
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
  },

  /**
   * Update language switcher UI
   */
  updateLanguageSwitcher() {
    document.querySelectorAll('[data-lang-switch]').forEach(el => {
      const lang = el.getAttribute('data-lang-switch');
      el.classList.toggle('active', lang === this.currentLang);
    });
  },

  /**
   * Get current language
   */
  getLang() {
    return this.currentLang;
  },

  /**
   * Check if current language is RTL (for future expansion)
   */
  isRTL() {
    return false; // Neither English nor Afrikaans is RTL
  }
};

// Language switcher component HTML
i18n.createLanguageSwitcher = function() {
  return `
    <div class="lang-switcher">
      <button data-lang-switch="en" onclick="i18n.switchLanguage('en')" class="${this.currentLang === 'en' ? 'active' : ''}">
        EN
      </button>
      <span class="lang-divider">|</span>
      <button data-lang-switch="af" onclick="i18n.switchLanguage('af')" class="${this.currentLang === 'af' ? 'active' : ''}">
        AF
      </button>
    </div>
  `;
};

// CSS for language switcher
const langSwitcherStyles = `
  .lang-switcher {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.875rem;
  }

  .lang-switcher button {
    background: none;
    border: none;
    color: var(--text-secondary, rgba(250, 250, 250, 0.6));
    cursor: pointer;
    padding: 4px 8px;
    font-family: inherit;
    font-weight: 500;
    transition: color 0.2s;
  }

  .lang-switcher button:hover {
    color: var(--text-primary, #FAFAFA);
  }

  .lang-switcher button.active {
    color: var(--gold, #D4AF37);
    font-weight: 600;
  }

  .lang-divider {
    color: var(--text-muted, rgba(250, 250, 250, 0.4));
  }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = langSwitcherStyles;
document.head.appendChild(styleSheet);

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init());
} else {
  i18n.init();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}
