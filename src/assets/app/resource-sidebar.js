const DESKTOP_BREAKPOINT = 820;

function currentLanguage() {
  return window.currentNavLanguage === 'en' || window.languageSwitcher?.currentLanguage === 'en'
    ? 'en'
    : 'zh';
}

function sidebarText(isClosed) {
  const language = currentLanguage();
  if (language === 'en') {
    return isClosed ? 'Open categories' : 'Close categories';
  }
  return isClosed ? '展开分类' : '收起分类';
}

function initResourceSidebar() {
  const pageContainer = document.querySelector('.page-container');
  const sidebar = pageContainer?.querySelector('.sidebar-menu');
  const menu = sidebar?.querySelector('.main-menu');

  if (!pageContainer || !sidebar || !menu || pageContainer.dataset.sidebarReady === '1') return;
  pageContainer.dataset.sidebarReady = '1';

  sidebar.id ||= 'resource-sidebar';
  menu.id ||= 'main-menu';

  const toggle = document.createElement('button');
  toggle.className = 'resource-sidebar-toggle';
  toggle.type = 'button';
  toggle.setAttribute('aria-controls', sidebar.id);

  const icon = document.createElement('span');
  icon.className = 'resource-sidebar-toggle__icon';
  icon.setAttribute('aria-hidden', 'true');

  const label = document.createElement('span');
  label.className = 'resource-sidebar-toggle__label';

  toggle.append(icon, label);
  pageContainer.appendChild(toggle);

  const mobileToggle = sidebar.querySelector('[data-toggle="mobile-menu"]');
  if (mobileToggle) {
    mobileToggle.setAttribute('href', `#${menu.id}`);
    mobileToggle.setAttribute('role', 'button');
    mobileToggle.setAttribute('aria-controls', menu.id);

    const mobileIcon = mobileToggle.querySelector('i, span');
    if (mobileIcon) {
      mobileIcon.className = 'resource-mobile-menu-icon';
      mobileIcon.textContent = '☰';
      mobileIcon.setAttribute('aria-hidden', 'true');
    }
  }

  function isClosed() {
    return pageContainer.classList.contains('resource-sidebar-closed');
  }

  function updateControls() {
    const closed = isClosed();
    const text = sidebarText(closed);

    toggle.setAttribute('aria-expanded', String(!closed));
    toggle.setAttribute('aria-label', text);
    toggle.title = text;
    icon.textContent = closed ? '›' : '‹';
    label.textContent = closed ? (currentLanguage() === 'en' ? 'Categories' : '分类') : '';

    if (mobileToggle) {
      mobileToggle.setAttribute('aria-expanded', String(!closed));
      mobileToggle.setAttribute('aria-label', text);
      mobileToggle.title = text;
    }
  }

  function setClosed(closed) {
    pageContainer.classList.toggle('resource-sidebar-closed', closed);
    updateControls();
  }

  toggle.addEventListener('click', () => setClosed(!isClosed()));

  mobileToggle?.addEventListener('click', (event) => {
    event.preventDefault();
    setClosed(!isClosed());
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !isClosed()) {
      setClosed(true);
      const activeToggle = window.innerWidth <= DESKTOP_BREAKPOINT && mobileToggle
        ? mobileToggle
        : toggle;
      activeToggle.focus();
    }
  });

  document.addEventListener('navDataUpdated', updateControls);
  document.addEventListener('navLanguageChanged', updateControls);

  // The mobile category list is a drawer above the main content. Keeping it
  // expanded while nav-core populates its items pushes the entire page down and
  // creates a large layout shift. Desktop keeps the persistent sidebar open;
  // mobile starts collapsed and remains available through the existing toggle.
  setClosed(window.innerWidth <= DESKTOP_BREAKPOINT);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initResourceSidebar, { once: true });
} else {
  initResourceSidebar();
}
