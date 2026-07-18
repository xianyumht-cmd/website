import siteConfig from '../data/site-config.json';
import './layout.css';

const text = {
  zh: {
    home: '首页',
    shop: '超凡发卡',
    nav: '资源导航',
    news: '新闻公告',
    business: '商务合作',
    privacy: '隐私政策',
    feedback: '问题反馈',
    pacman: '吃豆人'
  },
  en: {
    home: 'Home',
    shop: 'Card Shop',
    nav: 'Resources',
    news: 'News',
    business: 'Business',
    privacy: 'Privacy',
    feedback: 'Feedback',
    pacman: 'Pac-Man'
  }
};

function currentLanguage() {
  const language = window.languageSwitcher?.currentLanguage || window.currentNavLanguage;
  return language === 'en' ? 'en' : 'zh';
}

function externalAttributes(url) {
  return /^https?:/.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
}

function headerMarkup(language) {
  const labels = text[language];
  const links = siteConfig.links;
  return `<header class="site-header">
    <div class="site-header__inner">
      <a class="site-header__brand" href="${links.home}">${siteConfig.site.brand}</a>
      <nav class="site-header__nav" aria-label="${language === 'en' ? 'Primary navigation' : '主要导航'}">
        <a href="${links.home}">${labels.home}</a>
        <a href="${links.shop}"${externalAttributes(links.shop)}>${labels.shop}</a>
        <a href="${links.nav}">${labels.nav}</a>
        <a href="${links.news}">${labels.news}</a>
        <a href="${links.business}">${labels.business}</a>
      </nav>
    </div>
  </header>`;
}

function footerMarkup(language) {
  const labels = text[language];
  const links = siteConfig.links;
  const values = language === 'en'
    ? 'Prosperity, democracy, civility, harmony, freedom, equality, justice, rule of law, patriotism, dedication, integrity and friendship'
    : '富强、民主、文明、和谐，自由、平等、公正、法治，爱国、敬业、诚信、友善';
  const sslAlt = language === 'en' ? 'MySSL security verification' : 'MySSL 安全认证';
  return `<footer class="site-footer">
    <div class="site-footer__inner">
      <nav class="site-footer__nav" aria-label="${language === 'en' ? 'Footer navigation' : '页脚导航'}">
        <a href="${links.home}">${labels.home}</a>
        <a href="${links.shop}"${externalAttributes(links.shop)}>${labels.shop}</a>
        <a href="mailto:${siteConfig.site.email}">${labels.feedback}</a>
        <a href="${links.nav}">${labels.nav}</a>
        <a href="${links.news}">${labels.news}</a>
        <a href="${links.business}">${labels.business}</a>
        <a href="${links.privacy}">${labels.privacy}</a>
        <a href="${links.pacman}">${labels.pacman}</a>
      </nav>
      <p class="site-footer__values">${values}</p>
      <p class="site-footer__record">© 2026 ${siteConfig.site.brand} · <a href="${links.record}" target="_blank" rel="noopener noreferrer">${siteConfig.site.icp}</a></p>
      <a class="site-footer__ssl" href="${links.ssl}" target="_blank" rel="noopener noreferrer">
        <img src="https://static.myssl.com/res/images/myssl-id1.png" alt="${sslAlt}" loading="lazy" decoding="async" referrerpolicy="no-referrer">
      </a>
    </div>
  </footer>`;
}

function renderLayout() {
  const language = currentLanguage();
  document.querySelectorAll('[data-site-header]').forEach((container) => {
    container.innerHTML = headerMarkup(language);
  });

  const footerTargets = document.querySelectorAll('[data-site-footer], .footer-placeholder, #global-footer-placeholder');
  if (footerTargets.length > 0) {
    footerTargets.forEach((container) => {
      container.innerHTML = footerMarkup(language);
    });
  } else if (!document.querySelector('.site-footer, body > footer')) {
    document.body.insertAdjacentHTML('beforeend', footerMarkup(language));
  }
}

export function initLayout() {
  renderLayout();
  document.addEventListener('navDataUpdated', renderLayout);
  document.addEventListener('navLanguageChanged', renderLayout);
}
