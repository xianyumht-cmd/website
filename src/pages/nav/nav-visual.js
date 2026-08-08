import '../../assets/css/nav-visual-enhance.css';

function currentLang() {
    return window.currentNavLanguage || (window.languageSwitcher && window.languageSwitcher.currentLanguage) || 'zh';
}

function text(key) {
    const dict = {
        zh: {
            status: '状态',
            version: '当前游戏版本',
            updated: '更新时间',
            next: '预计下版本',
            feedback: '失效反馈邮箱',
            resource: '资源',
            resourceCount: '个资源',
            resourceEntry: '资源入口',
            codeIncluded: '含提取码'
        },
        en: {
            status: 'Status',
            version: 'Current Version',
            updated: 'Updated',
            next: 'Next Version',
            feedback: 'Feedback Email',
            resource: 'Resources',
            resourceCount: 'resources',
            resourceEntry: 'Resource Entry',
            codeIncluded: 'Code Included'
        }
    };
    const lang = currentLang();
    return (dict[lang] && dict[lang][key]) || dict.zh[key] || key;
}

function safeText(value, fallback = '-') {
    const result = String(value || '').trim();
    return result || fallback;
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
    grid.setAttribute('aria-label', text('status'));

    grid.appendChild(makeStat(text('version'), 'nav-visual-version', 'is-blue'));
    grid.appendChild(makeStat(text('updated'), 'nav-visual-update', 'is-green'));
    grid.appendChild(makeStat(text('next'), 'nav-visual-next', 'is-yellow'));
    grid.appendChild(makeStat(text('feedback'), 'nav-visual-feedback', 'is-red'));

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
    const grid = ensureStatusGrid();
    if (!grid) return;

    grid.setAttribute('aria-label', text('status'));
    const labels = grid.querySelectorAll('.nav-visual-stat-label');
    [text('version'), text('updated'), text('next'), text('feedback')].forEach((label, index) => {
        if (labels[index]) labels[index].textContent = label;
    });

    const info = (window.navData && window.navData.gameInfo) ? window.navData.gameInfo : {};
    setText('nav-visual-version', safeText(info.version));
    setText('nav-visual-update', safeText(info.updateDate));
    setText('nav-visual-next', safeText(info.nextUpdateDate));
    setText('nav-visual-feedback', safeText(info.feedbackEmail, 'xianyumht@gmail.com'));
}

function cleanSectionName(title) {
    return safeText(title, text('resource')).replace(/专区|Zone|区/g, '').trim() || text('resource');
}

function sectionTitle(header) {
    if (!header) return '';
    const count = header.querySelector('.nav-section-count');
    const raw = header.textContent || '';
    return count ? raw.replace(count.textContent || '', '').trim() : raw.trim();
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

    let count = header.querySelector('.nav-section-count');
    if (!count) {
        count = document.createElement('span');
        count.className = 'nav-section-count';
        header.appendChild(count);
    }
    count.textContent = `${cards.length} ${text('resourceCount')}`;

    const groupName = cleanSectionName(sectionTitle(header));
    cards.forEach(card => {
        const cardText = card.textContent || '';
        const secondTag = /密码|Password|提取码|访问码|解压码|code/i.test(cardText)
            ? text('codeIncluded')
            : text('resourceEntry');
        const signature = `${currentLang()}|${groupName}|${secondTag}`;
        const existingTags = card.querySelector('.nav-card-tags');

        if (card.dataset.navVisualSignature === signature && existingTags) return;
        if (existingTags) existingTags.remove();

        card.dataset.navVisualSignature = signature;
        const tags = document.createElement('div');
        tags.className = 'nav-card-tags';
        addTag(tags, groupName);
        addTag(tags, secondTag);
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

let runScheduled = false;
function scheduleRun() {
    if (runScheduled) return;
    runScheduled = true;
    requestAnimationFrame(() => {
        runScheduled = false;
        run();
    });
}

function init() {
    run();
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
