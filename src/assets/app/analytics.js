(function() {
    'use strict';

    var laInitialized = false;

    function isLocalPreview() {
        return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname);
    }

    function runWhenIdle(task, timeout) {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(task, { timeout: timeout || 2000 });
            return;
        }
        setTimeout(task, Math.min(timeout || 800, 800));
    }

    function initLaAnalytics() {
        if (laInitialized) return;
        if (!window.LA || typeof window.LA.init !== 'function') return;

        try {
            window.LA.init({ id: '3OsinsCksDM34iaJ', ck: '3OsinsCksDM34iaJ', autoTrack: true });
            laInitialized = true;
        } catch (_) {
            laInitialized = false;
        }
    }

    function injectLaSdk() {
        if (isLocalPreview()) return;

        var existing = document.getElementById('LA_COLLECT');
        if (existing) {
            initLaAnalytics();
            existing.addEventListener('load', initLaAnalytics, { once: true });
            return;
        }

        var sdk = document.createElement('script');
        sdk.charset = 'UTF-8';
        sdk.id = 'LA_COLLECT';
        sdk.src = 'https://sdk.51.la/js-sdk-pro.min.js';
        sdk.async = true;
        sdk.defer = true;
        sdk.onload = initLaAnalytics;
        document.head.appendChild(sdk);
    }

    function injectVisitorWidget() {
        if (isLocalPreview()) return;

        var container = document.getElementById('online_user_container');
        if (!container || document.getElementById('LA-DATA-WIDGET')) return;

        var widget = document.createElement('script');
        widget.id = 'LA-DATA-WIDGET';
        widget.crossOrigin = 'anonymous';
        widget.charset = 'UTF-8';
        widget.src = 'https://v6-widget.51.la/v6/3OsinsCksDM34iaJ/quote.js?theme=0&f=12&display=0,1,0,0,0,0,0,0';
        widget.async = true;
        widget.defer = true;
        widget.onerror = function() {
            var fallback = document.getElementById('online_user');
            if (fallback && !fallback.textContent.trim()) fallback.textContent = '最近活跃访客 --';
        };
        container.appendChild(widget);
    }

    function injectBaiduAnalytics() {
        if (isLocalPreview()) return;

        var analyticsId = document.documentElement.dataset.baiduAnalytics;
        if (!analyticsId || document.getElementById('BAIDU_ANALYTICS')) return;

        window._hmt = window._hmt || [];
        var script = document.createElement('script');
        script.id = 'BAIDU_ANALYTICS';
        script.src = 'https://hm.baidu.com/hm.js?' + encodeURIComponent(analyticsId);
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
    }

    function scheduleDeferredAnalytics() {
        runWhenIdle(injectVisitorWidget, 1500);
        setTimeout(function() {
            runWhenIdle(injectLaSdk, 2000);
        }, 800);
        setTimeout(function() {
            runWhenIdle(injectBaiduAnalytics, 3000);
        }, 1600);
    }

    if (document.readyState === 'complete') {
        scheduleDeferredAnalytics();
    } else {
        window.addEventListener('load', scheduleDeferredAnalytics, { once: true });
    }
})();
