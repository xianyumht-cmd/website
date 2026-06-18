// Runtime patches for navigation data that is rendered by nav-core.js.
// Keep this file small and explicit so link/date hotfixes do not require rewriting the large nav-data file.

const patchedGameInfo = {
    zh: {
        version: "16.11",
        updateDate: "2026年6月11日",
        nextUpdateDate: "2026年6月25日"
    },
    en: {
        version: "16.11",
        updateDate: "June 11, 2026",
        nextUpdateDate: "June 25, 2026"
    }
};

const urlPatches = new Map([
    ["gitee.com/xiazai888/xiazai/raw/master/xiazai", "https://gitee.com/xiazai888/xiazai/raw/master/xiazai"],
    ["https://xn--8pv109c.top/blog/", "https://blog.xn--8pv109c.top/"]
]);

function patchSections(sections) {
    if (!Array.isArray(sections)) return;
    sections.forEach(section => {
        if (!Array.isArray(section.items)) return;
        section.items.forEach(item => {
            if (item && urlPatches.has(item.url)) {
                item.url = urlPatches.get(item.url);
            }
        });
    });
}

function patchNavData() {
    const translations = window.navDataTranslations;
    if (!translations) return;

    Object.entries(patchedGameInfo).forEach(([lang, gameInfo]) => {
        if (translations[lang] && translations[lang].gameInfo) {
            Object.assign(translations[lang].gameInfo, gameInfo);
        }
    });

    Object.values(translations).forEach(data => {
        patchSections(data && data.sections);
    });

    const currentLanguage = window.currentNavLanguage || "zh";
    const currentData = translations[currentLanguage] || translations.zh;
    if (window.navData && currentData) {
        window.navData.gameInfo = currentData.gameInfo;
        window.navData.sections = currentData.sections;
    }
}

patchNavData();
