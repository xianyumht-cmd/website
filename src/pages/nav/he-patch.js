// Replace the retired EZS navigation entry with HE in every language dataset.
(function patchHeNavigationEntry() {
    const replacementUrl = 'https://wwayq.lanzouq.com/s/he1';

    function patchSections(sections) {
        if (!Array.isArray(sections)) return;

        sections.forEach(section => {
            if (!Array.isArray(section && section.items)) return;

            section.items.forEach(item => {
                if (!item) return;

                const title = String(item.title || '').toLowerCase();
                const tooltip = String(item.tooltip || '').toLowerCase();
                const isLegacyEzs =
                    title === 'ezs' ||
                    tooltip === 'ezs' ||
                    item.url === 'https://wwme.lanzouq.com/s/ezs6';

                if (!isLegacyEzs) return;

                item.title = 'HE';
                item.avatar = 'HE';
                item.url = replacementUrl;
                item.tooltip = 'HE';
            });
        });
    }

    const translations = window.navDataTranslations;
    if (translations && typeof translations === 'object') {
        Object.values(translations).forEach(data => patchSections(data && data.sections));
    }

    if (window.navData) {
        patchSections(window.navData.sections);
    }
})();
