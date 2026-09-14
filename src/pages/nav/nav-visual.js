import '../../assets/css/nav-visual-enhance.css';

function currentLang() {
    return window.currentNavLanguage || (window.languageSwitcher && window.languageSwitcher.currentLanguage) || 'zh';
}

function sectionCountText(count) {
    return currentLang() === 'en' ? `${count} items` : `${count} 项`;
}

function sectionTitle(header) {
    if (!header) return '';
    const count = header.querySelector('.nav-section-count');
    const raw = header.textContent || '';
    return count ? raw.replace(count.textContent || '', '').trim() : raw.trim();
}

function enhanceRow(header, row) {
    if (!header || !row) return;
    const cards = Array.from(row.querySelectorAll('.xe-widget'));
    if (!cards.length) return;

    let count = header.querySelector('.nav-section-count');
    if (!count) {
        count = document.createElement('span');
        count.className = 'nav-section-count';
        header.appendChild(count);
    }
    count.textContent = sectionCountText(cards.length);

    const title = sectionTitle(header);
    if (title) header.setAttribute('aria-label', `${title}，${sectionCountText(cards.length)}`);
}

function removeDashboardArtifacts() {
    document.getElementById('nav-visual-status-grid')?.remove();
    document.querySelectorAll('.nav-card-tags').forEach((element) => element.remove());
}

function enhanceSections() {
    removeDashboardArtifacts();
    const container = document.getElementById('content-sections');
    if (!container) return;

    Array.from(container.querySelectorAll('h4.text-gray')).forEach((header) => {
        let row = header.nextElementSibling;
        while (row && !row.classList.contains('row')) row = row.nextElementSibling;
        enhanceRow(header, row);
    });
}

let runScheduled = false;
function scheduleRun() {
    if (runScheduled) return;
    runScheduled = true;
    requestAnimationFrame(() => {
        runScheduled = false;
        enhanceSections();
    });
}

function releaseMobileDrawerGuard() {
    const pageContainer = document.querySelector('.page-container');
    if (pageContainer?.dataset.sidebarReady === '1') {
        document.body.classList.remove('nav-mobile-drawer-pending');
    }
}

function init() {
    enhanceSections();
    document.documentElement.dataset.navVisual = 'directory';
    releaseMobileDrawerGuard();

    const container = document.getElementById('content-sections');
    if (container && container.dataset.navVisualObserver !== '1') {
        container.dataset.navVisualObserver = '1';
        const observer = new MutationObserver(scheduleRun);
        observer.observe(container, { childList: true });
    }

    document.addEventListener('navDataUpdated', scheduleRun);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
