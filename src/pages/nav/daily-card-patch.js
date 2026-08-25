// Keep the daily-card navigation list aligned with the current product catalog.
(function patchDailyCardSection() {
    const zhItems = [
        {
            title: 'Space',
            description: 'Space',
            avatar: 'S',
            url: 'https://wwayq.lanzouq.com/b00odtjzsf',
            tooltip: 'Space'
        },
        {
            title: 'FY',
            description: 'FY',
            avatar: 'FY',
            url: 'https://wwbls.lanzouq.com/b0rb4uivc',
            tooltip: 'FY'
        },
        {
            title: 'HP',
            description: 'HP',
            avatar: 'HP',
            url: 'https://wwauv.lanzn.com/b00ybcb4hg',
            tooltip: 'HP'
        },
        {
            title: 'acme',
            description: '密码：8888',
            avatar: 'A',
            url: 'https://wwer.ysupan.com',
            tooltip: 'acme'
        },
        {
            title: '如意',
            description: '如意',
            avatar: '如',
            url: 'https://wwbpx.lanzoum.com/b00mqcagdg',
            tooltip: '如意'
        },
        {
            title: '骑士',
            description: '下载地址',
            avatar: '骑',
            url: 'http://b-bu.cn/b019vxf7mf',
            tooltip: '骑士'
        },
        {
            title: '蓝鲸',
            description: '蓝鲸',
            avatar: '蓝',
            url: 'https://wwbpx.lanzoum.com/b00mqcafbi',
            tooltip: '蓝鲸'
        },
        {
            title: 'yun',
            description: '密码：yun',
            avatar: '云',
            url: 'https://wwus.lanzouu.com/s/yunnb',
            tooltip: 'yun'
        },
        {
            title: 'DC',
            description: '提取码：DC66',
            avatar: 'DC',
            url: 'https://share.feijipan.com/s/xiark1VW?code=DC66',
            tooltip: 'DC'
        },
        {
            title: 'SPOT',
            description: '密码：123',
            avatar: 'SP',
            url: 'https://wwavz.lanzout.com/s/Spotyyds',
            tooltip: 'SPOT'
        },
        {
            title: 'FE',
            description: '密码：bp03',
            avatar: 'FE',
            url: 'https://wwarw.lanzn.com/b00l2sy5re',
            tooltip: 'FE'
        }
    ];

    const enItems = [
        { ...zhItems[0] },
        { ...zhItems[1] },
        { ...zhItems[2] },
        { ...zhItems[3], description: 'Password: 8888' },
        { ...zhItems[4], title: 'Ruyi', avatar: 'R', tooltip: 'Ruyi' },
        { ...zhItems[5], title: 'Knight', description: 'Download', avatar: 'K', tooltip: 'Knight' },
        { ...zhItems[6], title: 'Blue Whale', avatar: 'B', tooltip: 'Blue Whale' },
        { ...zhItems[7], description: 'Password: yun' },
        { ...zhItems[8], description: 'Code: DC66' },
        { ...zhItems[9], description: 'Password: 123' },
        { ...zhItems[10], description: 'Password: bp03' }
    ];

    function patchSections(sections, items) {
        if (!Array.isArray(sections)) return;

        const dailySection = sections.find(section =>
            section && (
                section.id === '天卡专区' ||
                section.title === '天卡专区' ||
                section.title === 'Daily Card Zone'
            )
        );

        if (!dailySection) return;
        dailySection.items = items.map(item => ({ ...item }));
    }

    const translations = window.navDataTranslations;
    if (translations && translations.zh) {
        patchSections(translations.zh.sections, zhItems);
    }
    if (translations && translations.en) {
        patchSections(translations.en.sections, enItems);
    }

    if (window.navData) {
        const currentLanguage = window.currentNavLanguage || 'zh';
        patchSections(window.navData.sections, currentLanguage === 'en' ? enItems : zhItems);
    }
})();
