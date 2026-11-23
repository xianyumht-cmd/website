// Lightweight loading placeholder for the nav resource area.
// It runs before nav-core.js renders cards, so users do not see a blank content area while data is being prepared.

function showNavLoadingPlaceholder() {
    const container = document.getElementById('content-sections');
    if (!container || document.getElementById('nav-loading-placeholder')) return;
    if (container.children.length > 0) return;

    const loading = document.createElement('div');
    loading.id = 'nav-loading-placeholder';
    loading.setAttribute('role', 'status');
    loading.setAttribute('aria-live', 'polite');
    loading.innerHTML = '<strong>资源内容加载中...</strong><div class="nav-loading-subtitle">数据较多，请稍候</div>';
    container.appendChild(loading);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showNavLoadingPlaceholder, { once: true });
} else {
    showNavLoadingPlaceholder();
}
