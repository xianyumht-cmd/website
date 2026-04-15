'use strict';

// Explicitly define window.locationApp immediately in global scope
window.locationApp = window.locationApp || {};

const linkConfig = {
    qunliao1: 'https://an.24vv.cn/s',
    qunliao2: 'https://blog.xn--8pv109c.top/',
    qunliao3: 'https://kkk.ewnco.cn/shop/99BA0CEF',
    qunliao4: 'down/nav/',
    qunliao5: 'https://an.krlkm.cn/s/'
};

function openLink(url, target = '_blank') {
    // 恢复标准逻辑：直接在新标签页打开，确保最大兼容性
    try {
        window.open(url, target);
        console.log('Opened link:', url);
    } catch (error) {
        console.error('Failed to open link:', error);
        // 降级处理
        const link = document.createElement('a');
        link.href = url;
        link.target = target;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function getUrl(id) {
    return linkConfig[id];
}

function initializeLinks() {
    console.log('Initializing links...');
    Object.keys(linkConfig).forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            console.log('Found element:', id);
            element.style.cursor = 'pointer';
            element.addEventListener('click', function(e) {
                console.log('Clicked:', id);
                e.preventDefault();
                
                // 立即执行打开逻辑，避免被浏览器拦截
                if (id === 'qunliao4') {
                    window.location.href = 'down/nav/';
                } else {
                    openLink(linkConfig[id]);
                }

                // 动画效果并行执行
                element.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    element.style.transform = '';
                }, 150);
            });
            element.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    element.click();
                }
            });
        }
    });
}

function preloadLinks() {
    Object.values(linkConfig).forEach(url => {
        if (url.startsWith('http')) {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = url;
            document.head.appendChild(link);
        }
    });
}

function init() {
    initializeLinks();
    console.log('Location.js initialized successfully');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Assign methods to global object
window.locationApp.init = init;
window.locationApp.openLink = openLink;
window.locationApp.getUrl = getUrl;
