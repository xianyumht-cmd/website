/**
 * Navigation Core Logic
 * Replaces inline scripts and unsafe innerHTML usage.
 */

import init, { generate_menu_html } from './pkg/nav_logic.js';

// Initialize Wasm
const wasmReady = init().catch(err => {
    console.error("Failed to initialize Wasm module:", err);
});

// 安全地获取全局数据
const getNavData = () => {
    return window.navData;
};

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
        var day = ["日", "一", "二", "三", "四", "五", "六"][e.getDay()];
        return `${t}年${n}月${r}日&nbsp;${g}:${a}:${o}&nbsp;星期${day}`;
    }

    // Update Time Functionality
    var lastUpdateDate = null;
    function resolveLastUpdateDate() {
        try {
            if (window.navData && window.navData.gameInfo && window.navData.gameInfo.updateDate) {
                var parsed = new Date(window.navData.gameInfo.updateDate);
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
            el.textContent = "刚刚更新";
            return;
        }
        var diffHours = Math.floor(diffMinutes / 60);
        if (diffHours <= 0) {
            el.textContent = diffMinutes + "分钟前更新";
        } else if (diffHours < 24) {
            el.textContent = diffHours + "小时前更新";
        } else {
            var diffDays = Math.floor(diffHours / 24);
            el.textContent = diffDays + "天前更新";
        }
    }

    // Scroll Effect
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
            box.innerHTML = getTime(); // Time string contains &nbsp;, so innerHTML is acceptable here for specific formatting, but textContent is safer if we change format. Kept for compatibility with HTML entities.
        }, 1000);
    }

    // Bulletin Auto-scroll
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

    // Initialize Content
    generateContentSafe();
    resolveLastUpdateDate();
    updateUpdateTime();
    setInterval(updateUpdateTime, 60 * 1000);
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

/**
 * Safe Content Generation
 * Uses DOM API instead of innerHTML for structural generation
 */
function generateContentSafe(retryCount = 0) {
    if (typeof navData === 'undefined') {
        if (retryCount < 50) { // Retry for 5 seconds (50 * 100ms)
            // console.log('navData not loaded yet, retrying... ' + (retryCount + 1));
            setTimeout(() => generateContentSafe(retryCount + 1), 100);
            return;
        }
        console.error('navData failed to load after multiple retries.');
        return;
    }

    // 1. Generate Sidebar Menu
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
        // 使用 Wasm 生成菜单，如果 Wasm 未就绪则回退到 JS
        wasmReady.then(() => {
            try {
                console.log("Using Wasm for menu generation");
                const menuHtml = generate_menu_html(JSON.stringify(navData.sections));
                mainMenu.innerHTML = menuHtml;
                
                // Append 'Game Resources' link (static)
                const gameLi = document.createElement('li');
                gameLi.className = 'submit-tag';
                gameLi.innerHTML = `<a href="/down/games/index.html">
                    <i class="fa-solid fa-gamepad"></i>
                    <span class="tooltip-blue" style="width: 60px;">游戏资源</span>
                </a>`;
                mainMenu.appendChild(gameLi);

                // Append 'About' link (static)
                const hr = document.createElement('hr');
                Object.assign(hr.style, { marginBottom: '32px', borderTop: 'none' });
                mainMenu.appendChild(hr);

                const gameLi = document.createElement('li');
        gameLi.className = 'submit-tag';
        gameLi.innerHTML = `<a href="/down/games/index.html"><i class="fa-solid fa-gamepad"></i><span class="tooltip-blue" style="width: 60px;">游戏资源</span></a>`;
        container.appendChild(gameLi);

        const aboutLi = document.createElement('li');
                aboutLi.className = 'submit-tag';
                aboutLi.innerHTML = `<a href="/about.html">
                    <i class="fa-solid fa-circle-info"></i>
                    <span class="tooltip-blue" style="width: 60px;">关于本站</span>
                </a>`;
                mainMenu.appendChild(aboutLi);
            } catch (e) {
                console.error("Wasm generation failed, falling back to JS:", e);
                fallbackJsMenuGeneration(mainMenu, navData);
            }
        }).catch(() => {
            console.warn("Wasm not ready, falling back to JS");
            fallbackJsMenuGeneration(mainMenu, navData);
        });
    }

    // 2. Generate Bulletin
    const bulletinContent = document.getElementById('bulletin-content');

    // Helper: JS Fallback for Menu Generation
    function fallbackJsMenuGeneration(container, data) {
        container.innerHTML = '';
        data.sections.forEach(section => {
            const li = document.createElement('li');
            li.innerHTML = `<a class="smooth" href="#${section.id}"><i class="${section.icon}"></i><span class="title">${section.title}</span></a>`;
            container.appendChild(li);
        });
        
        const hr = document.createElement('hr');
        Object.assign(hr.style, { marginBottom: '32px', borderTop: 'none' });
        container.appendChild(hr);

        const aboutLi = document.createElement('li');
        aboutLi.className = 'submit-tag';
        aboutLi.innerHTML = `<a href="/about.html"><i class="fa-solid fa-circle-info"></i><span class="tooltip-blue" style="width: 60px;">关于本站</span></a>`;
        container.appendChild(aboutLi);
    }
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
            ...createItem('当前游戏版本:', navData.gameInfo.version),
            ...createItem('更新时间:', navData.gameInfo.updateDate),
            ...createItem('预计下版本更新时间:', navData.gameInfo.nextUpdateDate),
            ...createItem('未找到新FF或地址失效反馈邮箱:', navData.gameInfo.feedbackEmail, true)
        ];

        items.forEach(el => li.appendChild(el));
        bulletinContent.appendChild(li);
    }

    // 3. Generate Content Sections
    const contentSections = document.getElementById('content-sections');
    if (contentSections) {
        contentSections.textContent = '';
        
        const tasks = navData.sections.map(section => () => {
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
                avatarDiv.textContent = item.avatar; // Safe text
                
                // Lazy Load Image logic
                if (item.imgUrl) {
                     const img = document.createElement('img');
                     img.dataset.src = item.imgUrl;
                     img.className = 'lazy-load';
                     img.style.display = 'none'; // Hide initially
                     img.onload = () => {
                         img.style.display = 'block';
                         avatarDiv.style.display = 'none'; // Hide text avatar if image loads
                     };
                     userImgLink.appendChild(img);
                     
                     // Create intersection observer for lazy loading
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
                strongTitle.textContent = item.title; // Safe text
                
                userNameLink.appendChild(strongTitle);
                
                const pDesc = document.createElement('p');
                pDesc.className = 'overflowClip_2';
                pDesc.textContent = item.description; // Safe text
                
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

        const runChunk = (deadline) => {
            const start = performance.now();
            while (tasks.length) {
                if (deadline && deadline.timeRemaining && deadline.timeRemaining() < 8) break;
                if (!deadline && performance.now() - start > 12) break;
                const fn = tasks.shift();
                fn && fn();
            }
            if (tasks.length) {
                if ('requestIdleCallback' in window) {
                    requestIdleCallback(runChunk, { timeout: 200 });
                } else {
                    setTimeout(runChunk, 0);
                }
            }
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(runChunk, { timeout: 200 });
        } else {
            setTimeout(runChunk, 0);
        }
    }
}
