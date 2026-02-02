// 游戏资源数据配置文件
const navDataTranslations = {
    zh: {
        gameInfo: {
            version: "1.0",
            updateDate: "2026年2月2日",
            nextUpdateDate: "持续更新",
            feedbackEmail: "xianyumht@gmail.com"
        },
        sections: [
            {
                id: "热门推荐",
                title: "🔥 热门推荐",
                icon: "fa-solid fa-fire",
                items: [
                    {
                        title: "幻兽帕鲁 (学习版)",
                        description: "2025最新整合包 | 这是一个关于抓宠、建造、射击的游戏... [点击转存]",
                        avatar: "帕",
                        url: "#", 
                        tooltip: "解压码：666"
                    }
                ]
            },
            {
                id: "海外精选",
                title: "🌍 海外精选",
                icon: "fa-solid fa-globe",
                items: [
                    {
                        title: "Lethal Company",
                        description: "致命公司 | 多人联机恐怖拾荒游戏，汉化补丁已打好",
                        avatar: "L",
                        url: "#",
                        tooltip: "点击下载"
                    }
                ]
            }
        ]
    },
    en: {
        gameInfo: {
            version: "1.0",
            updateDate: "Feb 2, 2026",
            nextUpdateDate: "Ongoing",
            feedbackEmail: "xianyumht@gmail.com"
        },
        sections: [
             {
                id: "热门推荐",
                title: "🔥 Hot Picks",
                icon: "fa-solid fa-fire",
                items: [
                    {
                        title: "Palworld (Cracked)",
                        description: "2025 Latest Pack | Catching, building, shooting... [Click to Save]",
                        avatar: "P",
                        url: "#", 
                        tooltip: "Password: 666"
                    }
                ]
            }
        ]
    }
};

const navData = {
    gameInfo: navDataTranslations.zh.gameInfo,
    sections: navDataTranslations.zh.sections
};

// 暴露给全局，确保 nav-core.js 可以访问
window.navData = navData;
window.getNavData = function(lang) {
    if (lang && navDataTranslations[lang]) {
        return {
            gameInfo: navDataTranslations[lang].gameInfo,
            sections: navDataTranslations[lang].sections
        };
    }
    return navData;
};

// 全局变量设置
window.navDataTranslations = navDataTranslations;
window.currentNavLanguage = "zh";

// 兼容 nav-core.js 的事件
document.addEventListener("navLanguageChanged", function(event) {
    const language = event.detail.language;
    window.currentNavLanguage = language;
    window.navData = getNavData(language);
    
    const updateEvent = new CustomEvent("navDataUpdated", {
        detail: {
            language: language,
            navData: window.navData
        }
    });
    document.dispatchEvent(updateEvent);
});
