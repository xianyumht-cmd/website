export const getCurrentNavLanguage = () => window.currentNavLanguage || (window.languageSwitcher && window.languageSwitcher.currentLanguage) || "zh";

const navUiText = {
    zh: {
        pageTitle: "脚本.top 资源导航 - 工具与实用资源",
        pageDescription: "脚本.top 资源导航，按分类整理常用工具、游戏相关资源与实用站点，支持搜索、中英切换和移动端浏览。",
        updateTime: "更新时间：",
        currentVersion: "当前游戏版本:",
        updatedAt: "更新时间:",
        nextUpdate: "预计下版本更新时间:",
        feedbackEmail: "未找到新FF或地址失效反馈邮箱:",
        searchPlaceholder: "输入关键词，筛选资源",
        searchInputLabel: "搜索资源",
        notice: "页面将永久存在，失效请邮箱反馈",
        searchLabel: "搜索",
        home: "主站",
        visitors: "最近活跃访客",
        directoryTitle: "资源导航",
        directoryIntro: "按分类浏览，或直接搜索名称与说明。",
        skipLink: "跳到主要内容",
        quickTools: "快捷工具",
        topButton: "返回顶部",
        themeTitle: "切换主题模式",
        languageTitle: "切换语言",
        switchToEnglish: "Switch to English",
        themeAuto: "自动模式",
        themeLight: "浅色模式",
        themeDark: "深色模式",
        justUpdated: "刚刚更新",
        minuteAgo: "分钟前更新",
        hourAgo: "小时前更新",
        dayAgo: "天前更新"
    },
    en: {
        pageTitle: "Script.top Resource Directory - Tools and Useful Resources",
        pageDescription: "Browse the Script.top resource directory by category or search tools, game resources and useful sites on desktop or mobile.",
        updateTime: "Updated: ",
        currentVersion: "Current game version:",
        updatedAt: "Updated:",
        nextUpdate: "Expected next update:",
        feedbackEmail: "Missing new FF or invalid link feedback:",
        searchPlaceholder: "Enter keywords to filter resources",
        searchInputLabel: "Search resources",
        notice: "This page will remain available. Please report invalid links by email.",
        searchLabel: "Search",
        home: "Home",
        visitors: "Recent visitors",
        directoryTitle: "Resource directory",
        directoryIntro: "Browse by category or search names and descriptions.",
        skipLink: "Skip to main content",
        quickTools: "Quick tools",
        topButton: "Back to top",
        themeTitle: "Switch theme mode",
        languageTitle: "Switch language",
        switchToChinese: "Switch to Chinese",
        themeAuto: "Auto mode",
        themeLight: "Light mode",
        themeDark: "Dark mode",
        justUpdated: "Just updated",
        minuteAgo: " minutes ago",
        hourAgo: " hours ago",
        dayAgo: " days ago"
    }
};

export function navText(key) {
    const lang = getCurrentNavLanguage();
    return (navUiText[lang] && navUiText[lang][key]) || navUiText.zh[key] || key;
}

export function formatVersionDate(value) {
    const raw = String(value || '').trim();
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return raw;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (getCurrentNavLanguage() === 'en') {
        const names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${names[month - 1]} ${day}, ${year}`;
    }
    return `${year}年${month}月${day}日`;
}

export function parseVersionDate(value) {
    const raw = String(value || '').trim();
    const zhMatch = raw.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (zhMatch) {
        return new Date(`${zhMatch[1]}-${zhMatch[2].padStart(2, '0')}-${zhMatch[3].padStart(2, '0')}`);
    }
    return new Date(raw);
}

function updateDocumentMetadata() {
    const title = navText('pageTitle');
    const description = navText('pageDescription');
    document.title = title;

    const descriptionMeta = document.querySelector('meta[name="description"]');
    if (descriptionMeta) descriptionMeta.setAttribute('content', description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDescription = document.querySelector('meta[property="og:description"]');
    if (ogDescription) ogDescription.setAttribute('content', description);

    const ogLocale = document.querySelector('meta[property="og:locale"]');
    if (ogLocale) ogLocale.setAttribute('content', getCurrentNavLanguage() === 'en' ? 'en_US' : 'zh_CN');
}

export function applyNavStaticLanguage() {
    updateDocumentMetadata();

    const homeText = document.querySelector('#navbar .fa-house + span');
    if (homeText) homeText.textContent = navText('home');

    const visitorContainer = document.getElementById('online_user_container');
    if (visitorContainer) {
        const count = (visitorContainer.textContent || '').match(/\d+/);
        visitorContainer.textContent = count ? `${navText('visitors')} ${count[0]}` : navText('visitors');
    }

    const updateLabel = document.querySelector('#navbar .fa-clock-o + span');
    if (updateLabel) updateLabel.textContent = navText('updateTime');

    const directoryTitle = document.querySelector('.nav-directory-head h1');
    if (directoryTitle) directoryTitle.textContent = navText('directoryTitle');

    const directoryIntro = document.querySelector('.nav-directory-head p');
    if (directoryIntro) directoryIntro.textContent = navText('directoryIntro');

    const skipLink = document.querySelector('.nav-skip-link');
    if (skipLink) skipLink.textContent = navText('skipLink');

    const quickTools = document.querySelector('.fk_service');
    if (quickTools) quickTools.setAttribute('aria-label', navText('quickTools'));

    const searchText = document.getElementById('search-text');
    if (searchText) {
        searchText.placeholder = navText('searchPlaceholder');
        searchText.setAttribute('aria-label', navText('searchInputLabel'));
    }

    const searchButton = document.querySelector('#ss button:not(.search-clear)');
    if (searchButton) searchButton.setAttribute('aria-label', navText('searchLabel'));

    const notice = document.querySelector('#notice li');
    if (notice) notice.textContent = navText('notice');

    const lang = getCurrentNavLanguage();
    const topButton = document.querySelector('.fk_service_top');
    if (topButton) {
        topButton.title = navText('topButton');
        topButton.setAttribute('aria-label', navText('topButton'));
        topButton.setAttribute('data-tooltip', navText('topButton'));
    }

    document.querySelectorAll('.fk_service_ax, .nav-mobile-theme-toggle').forEach((themeButton) => {
        themeButton.title = navText('themeTitle');
        themeButton.setAttribute('aria-label', navText('themeTitle'));
    });

    const langButton = document.querySelector('.fk_service_bx');
    if (langButton) {
        langButton.title = navText('languageTitle');
        langButton.setAttribute('aria-label', navText('languageTitle'));
    }

    const langText = document.getElementById('lang-text');
    if (langText) langText.textContent = lang === 'zh' ? navText('switchToEnglish') : navText('switchToChinese');

    const themeText = document.getElementById('theme-text');
    if (themeText && window.themeMode) {
        const modeKey = window.themeMode.current === 'light' ? 'themeLight' : window.themeMode.current === 'dark' ? 'themeDark' : 'themeAuto';
        themeText.textContent = navText(modeKey);
    }
}
