// Keep the weekly-card navigation list aligned with the current product catalog.
(function patchWeeklyCardSection() {
    const weeklyItems = [
        {
            title: 'Gulf',
            description: '不三年，强烈推荐',
            avatar: 'G',
            url: 'https://wwme.lanzoui.com/b00od4rd1e',
            tooltip: 'Gulf'
        },
        {
            title: 'LTY',
            description: '密码：f4sv',
            avatar: 'L',
            url: 'https://wwauv.lanzout.com/b00yb1z1od',
            tooltip: 'LTY'
        },
        {
            title: 'TSL',
            description: '密码：d5y7',
            avatar: 'TSL',
            url: 'https://wwauv.lanzn.com/b00ybc9xsj',
            tooltip: 'TSL'
        },
        {
            title: '时光',
            description: '密码：btqo',
            avatar: '时',
            url: 'https://wwarw.lanzn.com/b00l2sy5gd',
            tooltip: '时光'
        },
        {
            title: '海豹',
            description: '海豹',
            avatar: '海',
            url: 'https://wwbuq.lanzouu.com/b00jezzfoj',
            tooltip: '海豹'
        },
        {
            title: 'TAB',
            description: '密码：tab11',
            avatar: 'TAB',
            url: 'https://wwus.lanzouu.com/s/TAB1',
            tooltip: 'TAB'
        },
        {
            title: 'B5',
            description: '飞鸡盘下载',
            avatar: 'B5',
            url: 'https://share.feijipan.com/s/xScahwCk',
            tooltip: 'B5'
        },
        {
            title: 'VK',
            description: '提取码：1234',
            avatar: 'VK',
            url: 'https://share.feijipan.com/s/TU6XC6Li?code=1234',
            tooltip: 'VK'
        },
        {
            title: 'ADS',
            description: '飞鸡盘下载',
            avatar: 'ADS',
            url: 'https://share.feijipan.com/s/jBdy32yE',
            tooltip: 'ADS'
        },
        {
            title: 'SOL',
            description: '下载地址',
            avatar: 'SOL',
            url: 'https://share.feijipan.com/s/CN55YlBQ',
            tooltip: 'SOL'
        },
        {
            title: 'TEST',
            description: '密码：123',
            avatar: 'TEST',
            url: 'https://wwavz.lanzout.com/b00v08n3ah',
            tooltip: 'TEST'
        }
    ];

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

        weeklySection.items = weeklyItems.map(item => ({ ...item }));
    }

    const translations = window.navDataTranslations;
    if (translations && translations.zh) {
        patchSections(translations.zh.sections);
    }

    if (window.navData) {
        patchSections(window.navData.sections);
    }
})();
