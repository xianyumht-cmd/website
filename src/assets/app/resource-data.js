function getCookie(name) {
  const prefix = `${name}=`;
  const value = document.cookie
    .split(';')
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)) : null;
}

export function initializeResourceData(translations) {
  const fallbackLanguage = translations.zh ? 'zh' : Object.keys(translations)[0];
  const savedLanguage = getCookie('language') || getCookie('site_language');
  const initialLanguage = translations[savedLanguage] ? savedLanguage : fallbackLanguage;

  const buildData = (language) => {
    const selected = translations[language] || translations[fallbackLanguage] || {};
    return {
      gameInfo: selected.gameInfo || {},
      sections: selected.sections || [],
      sidebar_footer: selected.sidebar_footer || []
    };
  };

  window.navDataTranslations = translations;
  window.currentNavLanguage = initialLanguage;
  window.getNavData = buildData;
  window.navData = buildData(initialLanguage);

  document.addEventListener('navLanguageChanged', (event) => {
    const language = translations[event.detail?.language] ? event.detail.language : fallbackLanguage;
    window.currentNavLanguage = language;
    window.navData = buildData(language);
    document.dispatchEvent(new CustomEvent('navDataUpdated', {
      detail: { language, navData: window.navData }
    }));
  });
}
