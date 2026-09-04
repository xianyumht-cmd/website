'use strict';

import siteConfig from '../data/site-config.json';

window.locationApp = window.locationApp || {};

const linkConfig = {
    qunliao1: siteConfig.links.shop,
    qunliao2: siteConfig.links.blog,
    qunliao3: siteConfig.links.rent,
    qunliao4: siteConfig.links.nav,
    qunliao5: siteConfig.links.backupShop,
    qunliao6: siteConfig.links.backupRent
};

function openLink(url, target = '_blank') {
    const link = document.createElement('a');
    link.href = url;
    link.target = target;
    if (target === '_blank') link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function getUrl(id) {
    return linkConfig[id];
}

function initializeLinks() {
    Object.entries(linkConfig).forEach(([id, url]) => {
        const element = document.getElementById(id);
        if (!(element instanceof HTMLAnchorElement)) return;

        // Keep site-config as the source of truth, but let the browser perform
        // normal anchor navigation instead of intercepting clicks with JS.
        element.href = url;
        if (/^https?:/i.test(url)) {
            element.target = '_blank';
            element.rel = 'noopener noreferrer';
        } else {
            element.removeAttribute('target');
            element.removeAttribute('rel');
        }
    });
}

function init() {
    initializeLinks();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}

window.locationApp.init = init;
window.locationApp.openLink = openLink;
window.locationApp.getUrl = getUrl;
