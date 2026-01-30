(function() {
    'use strict';
    
    const CONFIG = {
        debug: false,
        redirectUrl: 'about:blank'
    };

    // 1. Console Clearing
    setInterval(() => {
        if (!CONFIG.debug) {
            console.clear();
            console.log('%cStop!', 'color: red; font-size: 50px; font-weight: bold;');
            console.log('%cThis is a restricted area.', 'font-size: 20px;');
        }
    }, 1000);

    // 2. Debugger Trap
    setInterval(() => {
        if (!CONFIG.debug) {
            (function() {}.constructor('debugger')());
        }
    }, 500);

    // 3. DevTools Detection (Dimensions)
    const threshold = 160;
    const checkDevTools = () => {
        const widthThreshold = window.outerWidth - window.innerWidth > threshold;
        const heightThreshold = window.outerHeight - window.innerHeight > threshold;
        
        if ((widthThreshold || heightThreshold) && !CONFIG.debug) {
            triggerDefense();
        }
    };
    window.addEventListener('resize', checkDevTools);
    setInterval(checkDevTools, 1000);

    // 4. Time Drift Detection (Breakpoint detection)
    let lastTime = Date.now();
    setInterval(() => {
        const currentTime = Date.now();
        if (currentTime - lastTime > 1000) { // If blocked by debugger for more than 1s (interval is 100ms usually, let's say 500ms check)
             // Actually logic: check if interval took significantly longer than expected
        }
        lastTime = currentTime;
    }, 500);
    
    function triggerDefense() {
        try {
            localStorage.clear();
            sessionStorage.clear();
            // window.location.href = CONFIG.redirectUrl; // Uncomment for production
            document.body.innerHTML = '<h1>Security Violation Detected</h1>';
        } catch(e) {}
    }
})();
