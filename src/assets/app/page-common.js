import './analytics.js';
import { initLayout } from './layout.js';
import '../../../shared/page-guard.js';

const faviconUrl = '/favicon.ico';

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
  initLayout();
}
