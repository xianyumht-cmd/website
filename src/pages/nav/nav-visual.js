import '../../assets/css/nav-visual-enhance.css';

function safeText(value, fallback = '-') {
    const text = String(value || '').trim();
    return text || fallback;
}

function makeStat(label, id, extraClass) {
    const card = document.createElement('div');
    card.className = 'nav-visual-stat';

    const labelEl = document.createElement('div');
    labelEl.className = 'nav-visual-stat-label';
    labelEl.textContent = label;

    const valueEl = document.createElement('span');
    valueEl.className = `nav-visual-stat-value ${extraClass || ''}`.trim();
    valueEl.id = id;
    valueEl.textContent = '-';

    card.appendChild(labelEl);
    card.appendChild(valueEl);
    return card;
}

function ensureStatusGrid() {
    let grid = document.getElementById('nav-visual-status-grid');
    if (grid) return grid;

    const search = document.getElementById('search');
    const parent = search && search.parentNode;
    if (!search || !parent) return null;

    grid = document.createElement('section');
    grid.id = 'nav-visual-status-grid';
    grid.className = 'nav-visual-status-grid';
    grid.setAttribute('aria-label', 'status');

    grid.appendChild(makeStat('当前游戏版本', 'nav-visual-version', 'is-blue'));
    grid.appendChild(makeStat('更新时间', 'nav-visual-update', 'is-green'));
    grid.appendChild(makeStat('预计下版本', 'nav-visual-next', 'is-yellow'));
    grid.appendChild(makeStat('失效反馈邮箱', 'nav-visual-feedback', 'is-red'));

    const bulletin = document.getElementById('bulletin_box');
    if (bulletin && bulletin.nextSibling) {
        parent.insertBefore(grid, bulletin.nextSibling);
    } else {
        parent.insertBefore(grid, search);
    }
    return grid;
}

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function updateStatusGrid() {
    if (!ensureStatusGrid()) return;
    const info = (window.navData && window.navData.gameInfo) ? window.navData.gameInfo : {};
    setText('nav-visual-version', safeText(info.version));
    setText('nav-visual-update', safeText(info.updateDate));
    setText('nav-visual-next', safeText(info.nextUpdateDate));
    setText('nav-visual-feedback', safeText(info.feedbackEmail, 'xianyumht@gmail.com'));
}

function shortSectionName(title) {
    return safeText(title, '资源').replace(/专区/g, '').replace(/区/g, '').trim() || '资源';
}

function sectionTitle(header) {
    if (!header) return '';
    const count = header.querySelector('.nav-section-count');
    const text = header.textContent || '';
    return count ? text.replace(count.textContent || '', '').trim() : text.trim();
}

function addTag(wrapper, label) {
    const tag = document.createElement('span');
    tag.className = 'nav-card-tag';
    tag.textContent = label;
    wrapper.appendChild(tag);
}

function enhanceRow(header, row) {
    if (!header || !row) return;
    const cards = Array.from(row.querySelectorAll('.xe-widget'));
    if (!cards.length) return;

    if (!header.querySelector('.nav-section-count')) {
        const count = document.createElement('span');
        count.className = 'nav-section-count';
        count.textContent = `${cards.length} 个资源`;
        header.appendChild(count);
    }

    const groupName = shortSectionName(sectionTitle(header));
    cards.forEach(card => {
        if (card.dataset.navVisualEnhanced === '1') return;
        card.dataset.navVisualEnhanced = '1';

        const text = card.textContent || '';
        const tags = document.createElement('div');
        tags.className = 'nav-card-tags';
        addTag(tags, groupName);
        addTag(tags, /密码|提取码|访问码|解压码/i.test(text) ? '含提取码' : '资源入口');
        card.appendChild(tags);
    });
}

function enhanceSections() {
    const container = document.getElementById('content-sections');
    if (!container) return;

    Array.from(container.querySelectorAll('h4.text-gray')).forEach(header => {
        let row = header.nextElementSibling;
        while (row && !row.classList.contains('row')) row = row.nextElementSibling;
        enhanceRow(header, row);
    });
}

function run() {
    updateStatusGrid();
    enhanceSections();
}

function init() {
    run();
    const container = document.getElementById('content-sections');
    if (container && container.dataset.navVisualObserver !== '1') {
        container.dataset.navVisualObserver = '1';
        const observer = new MutationObserver(() => requestAnimationFrame(run));
        observer.observe(container, { childList: true, subtree: true });
    }
    setTimeout(run, 300);
    setTimeout(run, 1000);
    setTimeout(run, 2200);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
