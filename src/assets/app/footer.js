(function() {
    'use strict';

    window.openSmartLink = function(url) {
        window.open(url, '_blank', 'noopener,noreferrer');
    };

    const footerText = {
        zh: {
            home: '首页',
            shop: '超凡发卡',
            feedback: '问题反馈',
            blog: '博客文章',
            nav: '网址导航',
            business: '商务合作',
            privacy: '隐私政策',
            sitemap: 'XML 地图',
            pacman: '吃豆人',
            links: '友情链接：',
            baidu: '百度搜索',
            so: '360搜索',
            sogou: '搜狗搜索',
            values: '富强、民主、文明、和谐，自由、平等、公正、法治，爱国、敬业、诚信、友善',
            sslAlt: 'MySSL 安全认证'
        },
        en: {
            home: 'Home',
            shop: 'Card Shop',
            feedback: 'Feedback',
            blog: 'Blog',
            nav: 'Resource Nav',
            business: 'Business',
            privacy: 'Privacy',
            sitemap: 'XML Sitemap',
            pacman: 'Pac-Man',
            links: 'Links:',
            baidu: 'Baidu',
            so: '360 Search',
            sogou: 'Sogou',
            values: 'Prosperity, democracy, civility, harmony, freedom, equality, justice, rule of law, patriotism, dedication, integrity, friendship',
            sslAlt: 'MySSL certification'
        }
    };

    function getFooterLang() {
        return (window.languageSwitcher && window.languageSwitcher.currentLanguage) || window.currentNavLanguage || 'zh';
    }

    function applyFooterLanguage() {
        const lang = getFooterLang() === 'en' ? 'en' : 'zh';
        const text = footerText[lang];
        document.querySelectorAll('[data-footer-text]').forEach((el) => {
            const key = el.getAttribute('data-footer-text');
            if (text[key]) el.textContent = text[key];
        });
        const sslImage = document.querySelector('[data-footer-alt="ssl"]');
        if (sslImage) sslImage.alt = text.sslAlt;
    }

    const footerHTML = `
    <footer style="width: 100%; text-align: center; color: #999; font-size: 12px; padding: 20px 0; background: transparent; margin-top: auto;">
        <div style="margin-bottom: 5px;">
            <p style="margin: 0; font-size: 12px; display: inline-block; color: #999; transform: scale(0.9);">
                &copy; 2026 脚本.top |
                <a href="/" target="_blank" style="color: #999; text-decoration: none;" data-footer-text="home">首页</a> |
                <a href="https://an.24vv.cn/s/" target="_blank" style="color: #999; text-decoration: none;" id="qunliao1" data-footer-text="shop">超凡发卡</a> |
                <a href="mailto:xianyumht@gmail.com" style="color: #999; text-decoration: none;" data-footer-text="feedback">问题反馈</a> |
                <a href="https://blog.xn--8pv109c.top/" target="_blank" style="color: #999; text-decoration: none;" id="qunliao2" data-footer-text="blog">博客文章</a> |
                <a href="https://xn--8pv109c.top/down/nav/" target="_blank" style="color: #999; text-decoration: none;" id="qunliao4" data-footer-text="nav">网址导航</a> |
                <a href="https://xn--8pv109c.top/about.html" target="_blank" style="color: #999; text-decoration: none;" data-footer-text="business">商务合作</a> |
                <a href="https://xn--8pv109c.top/privacy.html" target="_blank" style="color: #999; text-decoration: none;" data-footer-text="privacy">隐私政策</a> |
                <a href="https://xn--8pv109c.top/sitemap.xml" target="_blank" style="color: #999; text-decoration: none;" data-footer-text="sitemap">XML 地图</a> |
                <a href="https://xn--8pv109c.top/down/tdr/index.html" target="_blank" style="color: #999; text-decoration: none;" data-footer-text="pacman">吃豆人</a>
            </p>
        </div>
        <div style="margin-bottom: 5px; font-size: 12px; color: #999; transform: scale(0.9);">
            <span data-footer-text="links">友情链接：</span>
            <a href="https://www.baidu.com" target="_blank" rel="nofollow noopener noreferrer" style="color: #999; text-decoration: none; margin: 0 5px;" data-footer-text="baidu">百度搜索</a>
            <a href="https://www.so.com" target="_blank" rel="nofollow noopener noreferrer" style="color: #999; text-decoration: none; margin: 0 5px;" data-footer-text="so">360搜索</a>
            <a href="https://www.sogou.com" target="_blank" rel="nofollow noopener noreferrer" style="color: #999; text-decoration: none; margin: 0 5px;" data-footer-text="sogou">搜狗搜索</a>
        </div>
        <p style="margin: 0; font-size: 12px; opacity: 0.8; transform: scale(0.8); color: #999;" data-footer-text="values">富强、民主、文明、和谐，自由、平等、公正、法治，爱国、敬业、诚信、友善</p>
        <div style="margin-top: 10px;">
            <a href="https://beian.miit.gov.cn/" target="_blank" style="color: #999; text-decoration: none; font-size: 12px; transform: scale(0.9); display: inline-block;">鄂ICP备2024055850号-4</a>
        </div>
        <div style="margin-top: 10px;">
            <a href="https://myssl.com/xn--8pv109c.top?from=mysslid" target="_blank" rel="noopener noreferrer">
                <img src="https://static.myssl.com/res/images/myssl-id1.png" alt="MySSL 安全认证" data-footer-alt="ssl" loading="lazy" decoding="async" referrerpolicy="no-referrer" style="max-height:50px; display:block; margin:0 auto;">
            </a>
        </div>
    </footer>
    `;

    const placeholder = document.getElementById('global-footer-placeholder');
    if (placeholder) {
        placeholder.innerHTML = footerHTML;
    } else {
        const footerContainer = document.createElement('div');
        footerContainer.id = 'global-footer-container';
        footerContainer.innerHTML = footerHTML;
        document.body.appendChild(footerContainer);
    }

    applyFooterLanguage();
    document.querySelectorAll('a[target="_blank"]').forEach((link) => {
        const rel = new Set((link.getAttribute('rel') || '').split(/\s+/).filter(Boolean));
        rel.add('noopener');
        rel.add('noreferrer');
        link.setAttribute('rel', Array.from(rel).join(' '));
    });
    document.addEventListener('navDataUpdated', applyFooterLanguage);
    document.addEventListener('navLanguageChanged', applyFooterLanguage);
})();
