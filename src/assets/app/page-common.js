import faviconUrl from '../home/favicon.ico';
import './analytics.js';
import './footer.js';

export function applyFavicon() {
  let link = document.querySelector('link[rel="shortcut icon"], link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = faviconUrl;
}

export function initCommonPage() {
  applyFavicon();
}
