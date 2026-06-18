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
    loading.style.cssText = [
        'margin: 24px 0',
        'padding: 18px 20px',
        'border: 1px solid rgba(255,255,255,0.12)',
        'border-radius: 8px',
        'background: rgba(255,255,255,0.04)',
        'color: #cfd8dc',
        'font-size: 14px',
        'text-align: center'
    ].join(';');

    loading.innerHTML = '<strong style="color:#fff;">资源内容加载中...</strong><div style="margin-top:6px;color:#9aa4aa;font-size:12px;">数据较多，请稍候</div>';
    container.appendChild(loading);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showNavLoadingPlaceholder, { once: true });
} else {
    showNavLoadingPlaceholder();
}
