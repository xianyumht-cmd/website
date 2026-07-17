import lolVersionUrl from '../data/lol-version.json?url';

/**
 * Navigation Core Logic
 * Completely rewritten to remove Wasm and jQuery dependencies.
 * Uses native DOM API and fetch for data loading.
 */

// 安全地获取全局数据
const getNavData = () => {
    return window.navData;
};

const getCurrentNavLanguage = () => window.currentNavLanguage || (window.languageSwitcher && window.languageSwitcher.currentLanguage) || "zh";

const navUiText = {
    zh: {
        updateTime: "更新时间：",
        currentVersion: "当前游戏版本:",
        updatedAt: "更新时间:",
        nextUpdate: "预计下版本更新时间:",
        feedbackEmail: "未找到新FF或地址失效反馈邮箱:",
        searchPlaceholder: "输入关键词，自动筛选资源...",
        notice: "页面将永久存在，失效请邮箱反馈",
        searchLabel: "搜索",
        home: "主站",
        visitors: "最近活跃访客",
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
        updateTime: "Updated: ",
        currentVersion: "Current game version:",
        updatedAt: "Updated:",
        nextUpdate: "Expected next update:",
        feedbackEmail: "Missing new FF or invalid link feedback:",
        searchPlaceholder: "Enter keywords to filter resources...",
        notice: "This page will remain available. Please report invalid links by email.",
        searchLabel: "Search",
        home: "Home",
        visitors: "Recent visitors",
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

function navText(key) {
    const lang = getCurrentNavLanguage();
    return (navUiText[lang] && navUiText[lang][key]) || navUiText.zh[key] || key;
}

function formatVersionDate(value) {
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

function parseVersionDate(value) {
    const raw = String(value || '').trim();
    const zhMatch = raw.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
    if (zhMatch) {
        return new Date(`${zhMatch[1]}-${zhMatch[2].padStart(2, '0')}-${zhMatch[3].padStart(2, '0')}`);
    }
    return new Date(raw);
}

function applyNavStaticLanguage() {
    const homeText = document.querySelector('#navbar .fa-house + span');
    if (homeText) homeText.textContent = navText('home');

    const visitorContainer = document.getElementById('online_user_container');
    if (visitorContainer) {
        const count = (visitorContainer.textContent || '').match(/\d+/);
        visitorContainer.textContent = count ? `${navText('visitors')} ${count[0]}` : navText('visitors');
    }

    const updateLabel = document.querySelector('#navbar .fa-clock-o + span');
    if (updateLabel) updateLabel.textContent = navText('updateTime');

    const searchText = document.getElementById('search-text');
    if (searchText) searchText.placeholder = " " + navText('searchPlaceholder');

    const searchButton = document.querySelector('#ss button');
    if (searchButton) searchButton.setAttribute('aria-label', navText('searchLabel'));

    const notice = document.querySelector('#notice li');
    if (notice) notice.textContent = navText('notice');

    const lang = getCurrentNavLanguage();
    const topButton = document.querySelector('.fk_service_top');
    if (topButton) {
        topButton.title = navText('topButton');
        topButton.setAttribute('data-tooltip', navText('topButton'));
    }

    const themeButton = document.querySelector('.fk_service_ax');
    if (themeButton) themeButton.title = navText('themeTitle');

    const langButton = document.querySelector('.fk_service_bx');
    if (langButton) langButton.title = navText('languageTitle');

    const langText = document.getElementById('lang-text');
    if (langText) langText.textContent = lang === 'zh' ? navText('switchToEnglish') : navText('switchToChinese');

    const themeText = document.getElementById('theme-text');
    if (themeText && window.themeMode) {
        const modeKey = window.themeMode.current === 'light' ? 'themeLight' : window.themeMode.current === 'dark' ? 'themeDark' : 'themeAuto';
        themeText.textContent = navText(modeKey);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Clock Functionality
    function getTime() {
        var e = new Date();
        var t = e.getFullYear();
        var n = e.getMonth() + 1;
        var r = e.getDate();
        var g = e.getHours();
        g = g < 10 ? "0" + g : g;
        var a = e.getMinutes();
        a = a < 10 ? "0" + a : a;
        var o = e.getSeconds();
        o = o < 10 ? "0" + o : o;
        if (getCurrentNavLanguage() === "en") {
            var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][e.getMonth()];
            var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][e.getDay()];
            return `${month} ${r}, ${t}&nbsp;${g}:${a}:${o}&nbsp;${weekday}`;
        }
        var day = ["日", "一", "二", "三", "四", "五", "六"][e.getDay()];
        return `${t}年${n}月${r}日&nbsp;${g}:${a}:${o}&nbsp;星期${day}`;
    }

    // Update Time Functionality
    var lastUpdateDate = null;
    function resolveLastUpdateDate() {
        try {
            if (window.navData && window.navData.gameInfo && window.navData.gameInfo.updateDate) {
                var parsed = parseVersionDate(window.navData.gameInfo.updateDate);
                if (!isNaN(parsed.getTime())) lastUpdateDate = parsed;
            }
        } catch (e) {}
    }

    function updateUpdateTime() {
        var el = document.getElementById("sitetime");
        if (!el) return;
        var now = new Date();
        var base = lastUpdateDate || now;
        var diffTime = now - base;
        var diffMinutes = Math.floor(diffTime / (1000 * 60));
        if (diffMinutes <= 0) {
            el.textContent = navText("justUpdated");
            return;
        }
        var diffHours = Math.floor(diffMinutes / 60);
        if (diffHours <= 0) {
            el.textContent = diffMinutes + navText("minuteAgo");
        } else if (diffHours < 24) {
            el.textContent = diffHours + navText("hourAgo");
        } else {
            var diffDays = Math.floor(diffHours / 24);
            el.textContent = diffDays + navText("dayAgo");
        }
    }

    // Scroll Effect (Native replacement for jQuery scroll)
    var fade = document.getElementById("fade");
    var light = document.getElementById("light");
    var scrollPending = false;
    window.addEventListener("scroll", function() {
        if (scrollPending) return;
        scrollPending = true;
        requestAnimationFrame(function() {
            scrollPending = false;
            var top = window.pageYOffset || document.documentElement.scrollTop || 0;
            var px = 6 + top + "px";
            if (fade) fade.style.top = px;
            if (light) light.style.top = px;
        });
    }, { passive: true });

    // Clock Interval
    var box = document.querySelector(".box");
    if (box) {
        setInterval(function() {
            box.innerHTML = getTime(); // Time string contains &nbsp;
        }, 1000);
    }

    // Bulletin Auto-scroll (Native animation)
    var bulletinUl = document.querySelector(".bulletin-ul");
    if (bulletinUl && bulletinUl.children && bulletinUl.children.length > 1) {
        var autoScroll = function() {
            var first = bulletinUl.children[0];
            if (!first) return;
            var h = first.getBoundingClientRect().height;
            bulletinUl.style.transition = "margin-top 0.5s";
            bulletinUl.style.marginTop = "-" + h + "px";
            setTimeout(function() {
                bulletinUl.style.transition = "none";
                bulletinUl.appendChild(first);
                bulletinUl.style.marginTop = "0";
            }, 520);
        };
        setInterval(autoScroll, 3000);
    }

    Promise.resolve()
        .then(() => {
            if (!window.navData) throw new Error('navData is not initialized');
            return fetch(lolVersionUrl)
                .then(response => {
                    if (response.ok) return response.json();
                    throw new Error('LOL version fetch failed');
                })
                .then(data => {
                    if (window.navData && window.navData.gameInfo) {
                        window.navData.gameInfo.version = data.version;
                        window.navData.gameInfo.updateDate = formatVersionDate(data.update);
                        window.navData.gameInfo.nextUpdateDate = formatVersionDate(data.next);
                    }
                })
                .catch(() => {});
        })
        .catch(error => {
            console.error('Failed to initialize nav data:', error);
        })
        .finally(() => {
            if (window.navData) {
                applyNavStaticLanguage();
                generateContentSafe();
                resolveLastUpdateDate();
                updateUpdateTime();
            }
        });

    setInterval(updateUpdateTime, 60 * 1000);

    document.addEventListener("navDataUpdated", function(event) {
        if (event.detail && event.detail.language) {
            window.currentNavLanguage = event.detail.language;
        }
        if (event.detail && event.detail.navData) {
            window.navData = event.detail.navData;
        }
        applyNavStaticLanguage();
        var box = document.querySelector(".box");
        if (box) box.innerHTML = getTime();
        generateContentSafe();
        resolveLastUpdateDate();
        updateUpdateTime();
        window.txtSearch();
    });
});

// Search Function
window.txtSearch = function() {
    var input = document.getElementById("search-text");
    if (!input) return;
    var txt = String(input.value || "").trim().toLowerCase();
    var cards = document.querySelectorAll(".col-sm-3");
    if (!txt) {
        cards.forEach(function(el) { el.style.display = ""; });
        return;
    }
    cards.forEach(function(el) {
        var t = (el.textContent || "").toLowerCase();
        el.style.display = t.indexOf(txt) >= 0 ? "" : "none";
    });
};

function bindSearchInput() {
    var input = document.getElementById("search-text");
    if (!input || input.dataset.searchBound === "1") return;
    input.dataset.searchBound = "1";
    input.addEventListener("input", window.txtSearch);
    input.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            event.preventDefault();
            window.txtSearch();
        }
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindSearchInput);
} else {
    bindSearchInput();
}

/**
 * Safe Content Generation
 * Pure JS implementation, replacing Wasm
 */
function generateContentSafe(retryCount = 0) {
    if (!window.navData) {
        if (retryCount < 50) { 
            setTimeout(() => generateContentSafe(retryCount + 1), 100);
            return;
        }
        console.error('navData failed to load after multiple retries.');
        return;
    }
    const navData = getNavData();

    // 1. Generate Sidebar Menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        mainMenu.innerHTML = ''; // Clear existing
        
        // Generate Dynamic Sections
        navData.sections.forEach(section => {
            const li = document.createElement('li');
            li.innerHTML = `<a class="smooth" href="#${section.id}">
                <i class="${section.icon}"></i>
                <span class="title">${section.title}</span>
            </a>`;
            mainMenu.appendChild(li);
        });
        
        // Append Sidebar Footer Items from JSON
        if (navData.sidebar_footer) {
            navData.sidebar_footer.forEach(item => {
                if (item.separator) {
                    const hr = document.createElement('hr');
                    Object.assign(hr.style, { marginBottom: '32px', borderTop: 'none' });
                    mainMenu.appendChild(hr);
                }

                const li = document.createElement('li');
                li.className = 'submit-tag';
                li.innerHTML = `<a href="${item.url}">
                    <i class="${item.icon}"></i>
                    <span class="tooltip-blue" style="width: 60px;">${item.title}</span>
                </a>`;
                mainMenu.appendChild(li);
            });
        }
    }

    // 2. Generate Bulletin
    const bulletinContent = document.getElementById('bulletin-content');
    if (bulletinContent) {
        bulletinContent.textContent = '';
        const li = document.createElement('li');
        li.className = 'overflowClip_1 scrolltext-title';
        
        const createItem = (label, value, isLink = false) => {
            const labelEl = document.createElement('a');
            labelEl.setAttribute('rel', 'bulletin');
            labelEl.textContent = label;
            
            let valueEl;
            if (isLink) {
                valueEl = document.createElement('a');
                valueEl.href = `mailto:${value}`;
                valueEl.target = '_blank';
                valueEl.rel = 'noopener noreferrer';
                valueEl.style.color = 'red';
                valueEl.textContent = value;
            } else {
                valueEl = document.createElement('a');
                valueEl.style.color = 'red';
                valueEl.textContent = value;
            }
            return [labelEl, valueEl];
        };

        const items = [
            ...createItem(navText('currentVersion'), navData.gameInfo.version),
            ...createItem(navText('updatedAt'), navData.gameInfo.updateDate),
            ...createItem(navText('nextUpdate'), navData.gameInfo.nextUpdateDate),
            ...createItem(navText('feedbackEmail'), navData.gameInfo.feedbackEmail, true)
        ];

        items.forEach(el => li.appendChild(el));
        bulletinContent.appendChild(li);
    }

    // 3. Generate Content Sections
    const contentSections = document.getElementById('content-sections');
    if (contentSections) {
        contentSections.textContent = '';
        
        const tasks = navData.sections.filter(section => section.items && section.items.length > 0).map(section => () => {
            const sectionHeader = document.createElement('h4');
            sectionHeader.className = 'text-gray';
            
            const icon = document.createElement('i');
            icon.className = 'fa-solid fa-tags';
            icon.style.marginRight = '7px';
            icon.id = section.id;
            
            sectionHeader.appendChild(icon);
            sectionHeader.appendChild(document.createTextNode(section.title));
            
            const row = document.createElement('div');
            row.className = 'row';
            
            section.items.forEach(item => {
                const col = document.createElement('div');
                col.className = 'col-sm-3';
                
                const box = document.createElement('div');
                box.className = 'box2 label-info xe-conversations xe-widget';
                box.onclick = () => window.open(item.url, '_blank', 'noopener,noreferrer');
                box.setAttribute('data-original-title', item.tooltip);
                box.setAttribute('data-placement', 'bottom');
                box.setAttribute('data-toggle', 'tooltip');
                
                const entry = document.createElement('div');
                entry.className = 'xe-comment-entry';
                
                const userImgLink = document.createElement('a');
                userImgLink.className = 'xe-user-img';
                userImgLink.href = 'javascript:void(0)';
                
                const avatarDiv = document.createElement('div');
                avatarDiv.className = 'user-avatar';
                avatarDiv.style.cssText = 'background-color: #007bff; color: #fff; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center;';
                avatarDiv.textContent = item.avatar; 
                
                // Lazy Load Image logic
                if (item.imgUrl) {
                     const img = document.createElement('img');
                     img.dataset.src = item.imgUrl;
                     img.className = 'lazy-load';
                     img.style.display = 'none'; 
                     img.onload = () => {
                         img.style.display = 'block';
                         avatarDiv.style.display = 'none';
                     };
                     userImgLink.appendChild(img);
                     
                     const observer = new IntersectionObserver((entries, obs) => {
                         entries.forEach(entry => {
                             if (entry.isIntersecting) {
                                 const i = entry.target;
                                 i.src = i.dataset.src;
                                 obs.unobserve(i);
                             }
                         });
                     });
                     observer.observe(img);
                }
                
                userImgLink.appendChild(avatarDiv);
                
                const commentDiv = document.createElement('div');
                commentDiv.className = 'xe-comment';
                
                const userNameLink = document.createElement('a');
                userNameLink.className = 'overflowClip_1 xe-user-name';
                userNameLink.href = 'javascript:void(0)';
                
                const strongTitle = document.createElement('strong');
                strongTitle.textContent = item.title; 
                
                userNameLink.appendChild(strongTitle);
                
                const pDesc = document.createElement('p');
                pDesc.className = 'overflowClip_2';
                pDesc.textContent = item.description; 
                
                commentDiv.appendChild(userNameLink);
                commentDiv.appendChild(pDesc);
                
                entry.appendChild(userImgLink);
                entry.appendChild(commentDiv);
                box.appendChild(entry);
                col.appendChild(box);
                row.appendChild(col);
            });
            
            contentSections.appendChild(sectionHeader);
            contentSections.appendChild(row);
            contentSections.appendChild(document.createElement('br'));
        });

        const runChunk = () => {
            const start = performance.now();
            while (tasks.length) {
                const fn = tasks.shift();
                fn && fn();
                if (performance.now() - start > 12) break;
            }
            if (tasks.length) {
                setTimeout(runChunk, 0);
            }
        };

        // Run the first chunk immediately instead of waiting for requestIdleCallback.
        // requestIdleCallback can be delayed on heavy pages, causing the content area to stay blank until tab focus changes.
        runChunk();
    }
}
