(function () {
    try {
        var doc = document;
        var root = doc.documentElement;
        var dpr = Math.max(1, Math.min(3, Math.round(window.devicePixelRatio || 1)));
        root.style.setProperty('--dpr', String(dpr));
        root.style.setProperty('--hairline-scale', String(1 / dpr));

        var meta = doc.querySelector('meta[name="viewport"]');
        if (!meta) {
            meta = doc.createElement('meta');
            meta.setAttribute('name', 'viewport');
            doc.head.appendChild(meta);
        }
        var content = meta.getAttribute('content') || '';
        if (!/width\s*=/.test(content)) content = 'width=device-width, initial-scale=1';
        if (!/initial-scale\s*=/.test(content)) content += ', initial-scale=1';
        if (!/viewport-fit\s*=/.test(content)) content += ', viewport-fit=cover';
        meta.setAttribute('content', content);

        var lastW = 0;
        function updateRem() {
            var w = root.clientWidth || window.innerWidth || 375;
            if (!w || w === lastW) return;
            lastW = w;
            var base = 16;
            var rem = (w / 375) * base;
            rem = Math.max(14, Math.min(18, rem));
            root.style.setProperty('--rem', rem + 'px');
        }
        updateRem();
        window.addEventListener(
            'resize',
            function () {
                updateRem();
            },
            { passive: true }
        );
    } catch (e) {}
})();

