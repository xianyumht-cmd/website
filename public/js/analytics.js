(function() {
    'use strict';
    var initialized = false;
    function initAnalytics() {
        if (initialized) return;
        initialized = true;
        window.LA = window.LA || { init: function() {} };
        if (typeof window.LA.init === 'function') {
            window.LA.init({ id: '3OsinsCksDM34iaJ', ck: '3OsinsCksDM34iaJ', autoTrack: true });
        }
    }
    function injectSdk() {
        if (document.getElementById('LA_COLLECT')) {
            initAnalytics();
            return;
        }
        var sdk = document.createElement('script');
        sdk.charset = 'UTF-8';
        sdk.id = 'LA_COLLECT';
        sdk.src = 'https://sdk.51.la/js-sdk-pro.min.js';
        sdk.async = true;
        sdk.defer = true;
        var fallbackTimer = setTimeout(initAnalytics, 3000);
        sdk.onload = function() {
            clearTimeout(fallbackTimer);
            initAnalytics();
        };
        sdk.onerror = function() {
            clearTimeout(fallbackTimer);
        };
        document.head.appendChild(sdk);
    }
    function scheduleLoad() {
        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(injectSdk, { timeout: 2000 });
            return;
        }
        setTimeout(injectSdk, 800);
    }
    if (document.readyState === 'complete') {
        scheduleLoad();
    } else {
        window.addEventListener('load', scheduleLoad, { once: true });
    }
})();
