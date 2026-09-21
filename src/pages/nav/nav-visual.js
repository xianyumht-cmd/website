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

let sectionObserver = null;

function sectionIdFromHash(hash) {
    if (!hash.startsWith('#') || hash.length === 1) return '';

    try {
        return decodeURIComponent(hash.slice(1));
    } catch {
        return hash.slice(1);
    }
}

function sectionIdFromLink(link) {
    return sectionIdFromHash(link?.getAttribute('href') || '');
}

function setCurrentSection(sectionId) {
    document.querySelectorAll('#main-menu a.smooth[href^="#"]').forEach((link) => {
        const active = sectionIdFromLink(link) === sectionId;
        link.closest('li')?.classList.toggle('active', active);

        if (active) {
            link.setAttribute('aria-current', 'location');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function observeSections() {
    sectionObserver?.disconnect();

    const sections = Array.from(document.querySelectorAll('#content-sections .resource-section[id]'));
    if (!sections.length) return;

    const hashId = sectionIdFromHash(window.location.hash);
    const hashTarget = hashId ? document.getElementById(hashId) : null;
    setCurrentSection(hashTarget?.classList.contains('resource-section') ? hashId : sections[0].id);

    if (!('IntersectionObserver' in window)) return;

    sectionObserver = new IntersectionObserver((entries) => {
        const visible = entries
            .filter((entry) => entry.isIntersecting)
            .sort((a, b) => {
                const guide = window.innerHeight * 0.22;
                return Math.abs(a.boundingClientRect.top - guide) - Math.abs(b.boundingClientRect.top - guide);
            });

        if (visible[0]) setCurrentSection(visible[0].target.id);
    }, {
        rootMargin: '-18% 0px -68% 0px',
        threshold: 0,
    });

    sections.forEach((section) => sectionObserver.observe(section));
}

function bindSidebarCurrentState() {
    const menu = document.getElementById('main-menu');
    if (!menu || menu.dataset.currentSectionBound === '1') return;

    menu.dataset.currentSectionBound = '1';
    menu.addEventListener('click', (event) => {
        const link = event.target instanceof Element
            ? event.target.closest('a.smooth[href^="#"]')
            : null;
        if (!link || !menu.contains(link)) return;

        const sectionId = sectionIdFromLink(link);
        const section = sectionId ? document.getElementById(sectionId) : null;
        if (section?.classList.contains('resource-section')) setCurrentSection(sectionId);
    });

    window.addEventListener('hashchange', () => {
        const hashId = sectionIdFromHash(window.location.hash);
        const section = hashId ? document.getElementById(hashId) : null;
        if (section?.classList.contains('resource-section')) setCurrentSection(hashId);
    });
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

    observeSections();
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
    bindSidebarCurrentState();
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
