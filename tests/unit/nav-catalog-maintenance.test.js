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
        test(language + ' daily cards use approved replacements and remove retired resources', () => {
            const daily = items(language, '天卡专区');
            expect(daily.find(item => item.title === 'HE B').url).toBe('https://wwauv.lanzn.com/b00ybhuead');
            const ex = daily.find(item => item.title === 'EX');
            expect(ex.url).toBe('https://wwus.lanzoum.com/b0zl8q8rg');
            expect(ex.description).toContain('123');
            for (const name of ['LSC', 'DC', '龙珠']) {
                expect(daily.some(item => item.title === name)).toBe(false);
            }
            expect(daily.some(item => item.title === 'MAX')).toBe(true);
            expect(daily.some(item => item.title === 'KK')).toBe(true);
        });

        test(language + ' weekly cards keep approved links, password case, and removals', () => {
            const weekly = items(language, '周卡专区');
            const expected = [
                ['LEI', 'http://211.154.22.179:88/3', null],
                ['OFF', 'https://wwash.lanzouw.com/b019vvm2ve', '123'],
                ['乡里别', 'https://wwus.lanzoum.com/s/xianglibie', 'xiang'],
                ['jinX', 'https://wwavz.lanzout.com/s/baobaoniubi', 'JinXNB'],
                ['LX', 'https://wwus.lanzoum.com/b0zl9rp0d', 'lx'],
                ['LK', 'https://zkgame.lanzoul.com/b00v0ctduh', null],
                ['app', 'https://wwbuq.lanzouu.com/b00jfkosle', null]
            ];

            for (const [name, url, password] of expected) {
                const matches = weekly.filter(item => item.title === name);
                expect(matches).toHaveLength(1);
                expect(matches[0].url).toBe(url);
                if (password) expect(matches[0].description).toContain(password);
            }

            for (const name of ['VK', 'TSL', '时光', 'Time', 'TAB', 'TEST', 'FJ', 'viperlite', 'KL', 'KML']) {
                expect(weekly.some(item => item.title === name)).toBe(false);
            }
            expect(weekly.some(item => item.title === 'SOL')).toBe(true);
            expect(weekly.some(item => item.title === 'LTY')).toBe(true);
            expect(items(language, '月卡专区').some(item => item.title === 'LEI')).toBe(true);
        });
    }
});

describe('NAV dance resource link', () => {
    test('Chinese catalog points to the current Feishu guide', () => {
        const dance = items('zh', '过炫舞专区');
        expect(dance).toHaveLength(1);
        expect(dance[0].title).toBe('过炫舞');
        expect(dance[0].url).toBe('https://tcnnh75d6cqg.feishu.cn/wiki/In0kwB2rliSIm2kTXxyc95Ssnwf');
    });
});

describe('NAV QQ Speed resource link', () => {
    for (const language of ['zh', 'en']) {
        test(language + ' catalog exposes the approved QQ Speed guide', () => {
            const speed = items(language, 'QQ飞车专区');
            expect(speed).toHaveLength(1);
            expect(speed[0].url).toBe('https://tcnnh75d6cqg.feishu.cn/docx/EHV9dO3I0oEGmKx9McBcrD76ngc');
        });
    }
});
