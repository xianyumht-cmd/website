const fs = require('fs');
const path = require('path');
const vm = require('vm');

const catalogFile = path.resolve(__dirname, '../../src/assets/data/nav-catalog.js');
const source = fs.readFileSync(catalogFile, 'utf8');
const context = {};
const executable = source.replace(/export default navDataTranslations;\s*$/, 'globalThis.catalog = navDataTranslations;');

if (executable === source) throw new Error('The NAV catalog export contract changed');
vm.runInNewContext(executable, context, { filename: catalogFile });

function items(language, category) {
    const sections = context.catalog[language].sections;
    const section = sections.find(item => item.id === category);
    if (!section) throw new Error('Missing NAV section: ' + category);
    return section.items;
}

describe('maintained daily and weekly NAV resources', () => {
    for (const language of ['zh', 'en']) {
        test(language + ' daily cards keep active links and exclude LSC', () => {
            const daily = items(language, '天卡专区');
            const entries = daily.filter(item => item.title === '龙珠');
            expect(entries).toHaveLength(1);
            expect(entries[0].url).toBe('https://share.feijipan.com/s/9pv2ylg9');
            expect(daily.some(item => item.title === 'LSC')).toBe(false);
            expect(daily.some(item => item.title === 'MAX')).toBe(true);
            expect(daily.some(item => item.title === 'KK')).toBe(true);
        });

        test(language + ' weekly cards keep exact links and passwords without VK', () => {
            const weekly = items(language, '周卡专区');
            const expected = [
                ['FJ', 'https://wwaym.lanzoub.com/s/JFYYDS', 'JF11'],
                ['viperlite', 'https://wwarw.lanzn.com/b00l34qjlg', '123'],
                ['app', 'https://wwbuq.lanzouu.com/b00jfkosle', null]
            ];

            for (const [name, url, password] of expected) {
                const matches = weekly.filter(item => item.title === name);
                expect(matches).toHaveLength(1);
                expect(matches[0].url).toBe(url);
                if (password) expect(matches[0].description).toContain(password);
            }

            expect(weekly.some(item => item.title === 'VK')).toBe(false);
            expect(weekly.some(item => item.title === 'TEST')).toBe(true);
            expect(weekly.some(item => item.title === 'SOL')).toBe(true);
        });
    }
});

describe('NAV dance resource link', () => {
    test('Chinese catalog points to the current Feishu guide', () => {
        const dance = items('zh', '过炫舞专区');
        expect(dance).toHaveLength(1);
        expect(dance[0].title).toBe('过炫舞');
        expect(dance[0].url).toBe('https://tcnnh75d6cqg.feishu.cn/docx/FFkrdkvHZoCoAKxiYyGcxNMvnig');
    });
});
