// Keep the weekly-card navigation list aligned with the current product catalog.
(function patchWeeklyCardSection() {
    const replacementItems = [
        {
            title: 'YIN',
            description: '密码：123',
            avatar: 'YIN',
            url: 'https://wwbku.lanzoub.com/b0pns4quh',
            tooltip: 'YIN'
        },
        {
            title: 'DDS',
            description: '密码：123',
            avatar: 'DDS',
            url: 'https://wwbku.lanzoub.com/b0pndjqmj',
            tooltip: 'DDS'
        },
        {
            title: '巅峰',
            description: '下载地址',
            avatar: '峰',
            url: 'http://23.140.4.77',
            tooltip: '巅峰'
        },
        {
            title: 'SOL',
            description: '下载地址',
            avatar: 'SOL',
            url: 'https://share.feijipan.com/s/CN55YlBQ',
            tooltip: 'SOL'
        }
    ];

    const replacedTitles = new Set([
        'LO',
        '万艾可',
        ...replacementItems.map(item => item.title)
    ]);

    function patchSections(sections) {
        if (!Array.isArray(sections)) return;

        const weeklySection = sections.find(section =>
            section && (
                section.id === '周卡专区' ||
                section.title === '周卡专区' ||
                section.title === 'Weekly Card Zone'
            )
        );

        if (!weeklySection) return;

        const items = Array.isArray(weeklySection.items)
            ? weeklySection.items.filter(item => item && !replacedTitles.has(item.title))
            : [];

        const ltyIndex = items.findIndex(item => item.title === 'LTY');
        const insertIndex = ltyIndex >= 0 ? ltyIndex + 1 : items.length;
        items.splice(insertIndex, 0, ...replacementItems.map(item => ({ ...item })));
        weeklySection.items = items;
    }

    const translations = window.navDataTranslations;
    if (translations && translations.zh) {
        patchSections(translations.zh.sections);
    }

    if (window.navData) {
        patchSections(window.navData.sections);
    }
})();
