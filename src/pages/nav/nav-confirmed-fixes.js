// Confirmed navigation fixes that must run after nav-patches.js and nav-core.js.

function markSpiritAsDisplayOnly() {
  const patchSections = (sections) => {
    if (!Array.isArray(sections)) return;
    sections.forEach((section) => {
      if (!Array.isArray(section && section.items)) return;
      section.items.forEach((item) => {
        if (String(item && item.title || '').trim().toLowerCase() !== 'spirit') return;
        item.url = '';
        item.displayOnly = true;
      });
    });
  };

  const translations = window.navDataTranslations;
  if (translations && typeof translations === 'object') {
    Object.values(translations).forEach((data) => patchSections(data && data.sections));
  }
  if (window.navData) patchSections(window.navData.sections);
}

function ensureVersionBulletin() {
  if (document.getElementById('bulletin-content')) return;
  const search = document.getElementById('search');
  if (!search) return;

  const bulletin = document.createElement('div');
  bulletin.id = 'bulletin_box';
  bulletin.className = 'alert alert-primary';
  bulletin.setAttribute('aria-label', '版本信息');

  const list = document.createElement('ul');
  list.id = 'bulletin-content';
  list.className = 'bulletin-ul';
  bulletin.appendChild(list);
  search.insertAdjacentElement('afterend', bulletin);
}

function formatClock() {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, '0');
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const language = window.currentNavLanguage || window.languageSwitcher?.currentLanguage || 'zh';

  if (language === 'en') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()} ${time} ${weekdays[now.getDay()]}`;
  }

  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${time} 星期${weekdays[now.getDay()]}`;
}

function renderClockImmediately() {
  const box = document.querySelector('.box');
  if (box && !box.textContent.trim()) box.textContent = formatClock();
}

function enhanceKeyboardControls() {
  document.querySelectorAll('.fk_service_top, .fk_service_ax, .fk_service_bx').forEach((control) => {
    if (control.dataset.keyboardReady === '1') return;
    control.dataset.keyboardReady = '1';
    control.tabIndex = 0;
    control.setAttribute('role', 'button');
    control.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      control.click();
    });
  });
}

function isSpiritCard(card) {
  const label = String(card?.getAttribute('aria-label') || card?.textContent || '').trim().toLowerCase();
  return label.startsWith('spirit');
}

function disableSpiritCards() {
  document.querySelectorAll('#content-sections .box2').forEach((card) => {
    if (!isSpiritCard(card)) return;

    card.onclick = null;
    card.classList.add('is-display-only');
    card.removeAttribute('tabindex');
    card.setAttribute('role', 'group');
    card.setAttribute('aria-disabled', 'true');
    card.setAttribute('title', '仅作展示，无下载地址');
  });
}

function installSpiritClickGuard() {
  if (document.documentElement.dataset.spiritClickGuard === '1') return;
  document.documentElement.dataset.spiritClickGuard = '1';

  document.addEventListener('click', (event) => {
    const card = event.target instanceof Element ? event.target.closest('#content-sections .box2') : null;
    if (!isSpiritCard(card)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);

  document.addEventListener('keydown', (event) => {
    const card = event.target instanceof Element ? event.target.closest('#content-sections .box2') : null;
    if (!isSpiritCard(card)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }, true);
}

function installStyles() {
  if (document.getElementById('nav-confirmed-fixes-style')) return;
  const style = document.createElement('style');
  style.id = 'nav-confirmed-fixes-style';
  style.textContent = `
    #bulletin_box { margin: 0 0 18px; }
    #bulletin-content { margin: 0; padding: 0; list-style: none; }
    #bulletin-content li { display: flex; flex-wrap: wrap; gap: 6px 12px; align-items: center; }
    #bulletin-content a { pointer-events: none; text-decoration: none; }
    #bulletin-content a[href^="mailto:"] { pointer-events: auto; }
    .box2.is-display-only { cursor: default !important; opacity: .82; }
    .box2.is-display-only:hover { transform: none !important; box-shadow: none !important; }
    .box2.is-display-only::after { background: #94a3b8 !important; box-shadow: none !important; }
  `;
  document.head.appendChild(style);
}

markSpiritAsDisplayOnly();
ensureVersionBulletin();
installStyles();
installSpiritClickGuard();

let spiritRefreshScheduled = false;
function scheduleSpiritRefresh() {
  if (spiritRefreshScheduled) return;
  spiritRefreshScheduled = true;
  requestAnimationFrame(() => {
    spiritRefreshScheduled = false;
    disableSpiritCards();
  });
}

const initializeUiFixes = () => {
  markSpiritAsDisplayOnly();
  renderClockImmediately();
  enhanceKeyboardControls();
  disableSpiritCards();

  const content = document.getElementById('content-sections');
  if (content && !content.dataset.displayOnlyObserver) {
    content.dataset.displayOnlyObserver = '1';
    new MutationObserver(scheduleSpiritRefresh).observe(content, { childList: true });
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUiFixes);
} else {
  initializeUiFixes();
}

document.addEventListener('navDataUpdated', () => {
  markSpiritAsDisplayOnly();
  queueMicrotask(() => {
    renderClockImmediately();
    scheduleSpiritRefresh();
  });
});
