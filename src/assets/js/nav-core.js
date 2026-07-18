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

import { applyNavStaticLanguage, formatVersionDate, getCurrentNavLanguage, navText, parseVersionDate } from './nav-i18n.js';

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
    var sections = document.querySelectorAll("#content-sections .resource-section");
    var visibleCount = 0;
    var totalCount = 0;

    sections.forEach(function(section) {
        var sectionMatches = 0;
        section.querySelectorAll(".col-sm-3").forEach(function(card) {
            totalCount += 1;
            var cardText = (card.textContent || "").toLowerCase();
            var matched = !txt || cardText.indexOf(txt) >= 0;
            card.hidden = !matched;
            if (matched) {
                sectionMatches += 1;
                visibleCount += 1;
            }
        });
        section.hidden = Boolean(txt) && sectionMatches === 0;
    });

    var clearButton = document.getElementById("search-clear");
    if (clearButton) {
        clearButton.hidden = !txt;
        clearButton.textContent = getCurrentNavLanguage() === "en" ? "Clear" : "清除";
        clearButton.setAttribute("aria-label", getCurrentNavLanguage() === "en" ? "Clear search" : "清除搜索");
    }

    var status = document.getElementById("search-result-status");
    if (status) {
        var isEnglish = getCurrentNavLanguage() === "en";
        status.classList.toggle("is-active", Boolean(txt));
        status.textContent = txt
            ? (isEnglish ? `${visibleCount} matches for “${input.value.trim()}”` : `找到 ${visibleCount} 个与“${input.value.trim()}”相关的资源`)
            : (isEnglish ? `${totalCount} resources indexed` : `已收录 ${totalCount} 个资源，可直接搜索或按分类浏览`);
    }
};

function ensureSearchExperience() {
    var search = document.getElementById("search");
    var input = document.getElementById("search-text");
    var inputShell = document.getElementById("ss");
    if (!search || !input || !inputShell) return;

    if (!document.getElementById("search-clear")) {
        var clearButton = document.createElement("button");
        clearButton.id = "search-clear";
        clearButton.className = "search-clear";
        clearButton.type = "button";
        clearButton.hidden = true;
        clearButton.setAttribute("aria-label", "清除搜索");
        clearButton.textContent = "清除";
        clearButton.addEventListener("click", function() {
            input.value = "";
            window.txtSearch();
            input.focus();
        });
        inputShell.insertBefore(clearButton, inputShell.querySelector("button"));
    }

    if (!document.getElementById("search-result-status")) {
        var status = document.createElement("div");
        status.id = "search-result-status";
        status.className = "search-result-status";
        status.setAttribute("role", "status");
        status.setAttribute("aria-live", "polite");
        search.appendChild(status);
    }
}

function bindSearchInput() {
    var input = document.getElementById("search-text");
    if (!input || input.dataset.searchBound === "1") return;
    ensureSearchExperience();
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
            const sectionElement = document.createElement('section');
            sectionElement.className = 'resource-section';
            sectionElement.dataset.sectionId = section.id;

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
                box.tabIndex = 0;
                box.setAttribute('role', 'link');
                box.setAttribute('aria-label', `${item.title}：${item.description}`);
                box.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        box.click();
                    }
                });
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
            
            sectionElement.appendChild(sectionHeader);
            sectionElement.appendChild(row);
            contentSections.appendChild(sectionElement);
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
            } else {
                ensureSearchExperience();
                window.txtSearch();
            }
        };

        // Run the first chunk immediately instead of waiting for requestIdleCallback.
        // requestIdleCallback can be delayed on heavy pages, causing the content area to stay blank until tab focus changes.
        runChunk();
    }
}
