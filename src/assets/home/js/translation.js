
import siteConfigUrl from '../../data/site-config.json?url';

(function() {
    'use strict';
    let currentLanguage = 'zh';
    let siteConfig = {};

    const staticTranslations = {
        zh: { 'translateButton': 'Switch to English' },
        en: { 'translateButton': '切换为中文' }
    };

    function loadSiteConfig() {
        return fetch(siteConfigUrl)
            .then(response => response.json())
            .then(data => {
                siteConfig = data;
                applyTranslations();
                return data;
            })
            .catch(error => console.error('Error loading site config:', error));
    }

    function getTranslation(key) {
        // 1. Check site config (dynamic content)
        if (siteConfig.site_title && key === 'title') return siteConfig.site_title[currentLanguage];
        if (siteConfig.footer_links && siteConfig.footer_links[key]) return siteConfig.footer_links[key][currentLanguage];
        if (siteConfig.slogan && siteConfig.slogan[key]) return siteConfig.slogan[key][currentLanguage];

        // 2. Check static translations
        if (staticTranslations[currentLanguage][key]) return staticTranslations[currentLanguage][key];

        return '';
    }

    function toggleLanguage() {
        currentLanguage = currentLanguage === 'zh' ? 'en' : 'zh';
        applyTranslations();
        const translateButton = document.getElementById('translateButton');
        if (translateButton) {
            translateButton.textContent = getTranslation('translateButton');
        }
        try {
            localStorage.setItem('preferredLanguage', currentLanguage);
        } catch (e) {
            console.error('Failed to save language preference:', e);
        }
    }

    function applyTranslations() {
        // Title
        const title = getTranslation('title');
        if (title) document.title = title;

        // Dynamic Elements
        const keys = [
            'fuqiang', 'minzhu', 'wenming', 'hexie', 'ziyou',
            'qunliao1', 'qunliao2', 'qunliao3', 'qunliao4', 'qunliao5'
        ];

        keys.forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                // If it's a link block with <p> inside (common in footer)
                const textElement = element.querySelector('p');
                if (textElement) {
                    textElement.textContent = getTranslation(key);
                } else {
                    // Direct text replacement if no <p>
                    // Be careful not to wipe out children if structure is complex
                    // For now, assuming simple text or specific structure
                    if (element.childNodes.length === 1 && element.childNodes[0].nodeType === 3) {
                         element.textContent = getTranslation(key);
                    }
                }
            }
        });
    }

    function initTranslateButton() {
        // Prevent duplicate button
        if (document.getElementById('translateButton')) return;

        const translateButton = document.createElement('button');
        translateButton.id = 'translateButton';
        translateButton.textContent = getTranslation('translateButton') || 'Switch Language';
        translateButton.className = 'translate-button';
        translateButton.addEventListener('click', toggleLanguage);
        document.body.appendChild(translateButton);
    }

    function loadLanguagePreference() {
        try {
            currentLanguage = 'zh';
            const savedLanguage = localStorage.getItem('preferredLanguage');
            if (savedLanguage && (savedLanguage === 'zh' || savedLanguage === 'en')) {
                currentLanguage = savedLanguage;
            }
        } catch (e) {
            console.error('Failed to load language preference:', e);
        }
    }

    function init() {
        loadLanguagePreference();
        loadSiteConfig().then(() => {
            initTranslateButton();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
