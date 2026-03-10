import gamesDataUrl from '../../assets/data/games-data.json?url'

async function loadGamesData() {
  const response = await fetch(gamesDataUrl)
  if (!response.ok) {
    throw new Error(`Failed to load games data: ${response.status}`)
  }
  const gamesDataTranslations = await response.json()
  const defaultLang = 'zh'
  const fallback = gamesDataTranslations[defaultLang] || { gameInfo: {}, sections: [] }
  const buildNavData = (lang) => {
    if (lang && gamesDataTranslations[lang]) {
      return {
        gameInfo: gamesDataTranslations[lang].gameInfo,
        sections: gamesDataTranslations[lang].sections
      }
    }
    return {
      gameInfo: fallback.gameInfo,
      sections: fallback.sections
    }
  }
  window.navDataTranslations = gamesDataTranslations
  window.currentNavLanguage = defaultLang
  window.getNavData = buildNavData
  window.navData = buildNavData(defaultLang)
  document.addEventListener('navLanguageChanged', function(event) {
    const language = event.detail.language
    window.currentNavLanguage = language
    window.navData = buildNavData(language)
    const updateEvent = new CustomEvent('navDataUpdated', {
      detail: {
        language,
        navData: window.navData
      }
    })
    document.dispatchEvent(updateEvent)
  })
}

loadGamesData().catch((error) => {
  console.error(error)
})
