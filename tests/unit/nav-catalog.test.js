describe('NAV catalog', () => {
  let catalog;

  beforeAll(async () => {
    catalog = (await import('../../src/assets/data/nav-catalog.js')).default;
  });

  test('keeps zh/en section membership aligned', () => {
    const zh = catalog.zh.sections.map((section) => [section.id, section.items.map((item) => item.url)]);
    const en = catalog.en.sections.map((section) => [section.id, section.items.map((item) => item.url)]);
    expect(en).toEqual(zh);
  });

  test('uses the current daily-card catalog', () => {
    const daily = catalog.zh.sections.find((section) => section.id === '天卡专区');
    expect(daily.items.map((item) => item.title)).toEqual([
      'Space', 'MD', 'LSC', 'KDA', 'acme', '如意', 'yun', 'DC', 'FE', 'SPOT', 'SF'
    ]);
    expect(daily.items.find((item) => item.title === 'MD').url).toBe('https://wwbls.lanzouq.com/b0rbeyvra');
    expect(daily.items.find((item) => item.title === 'LSC').url).toBe('https://wwbnl.lanzouw.com/b0mcskk9c');
    expect(daily.items.find((item) => item.title === 'KDA').url).toBe('http://49.235.141.222:1000');
    expect(daily.items.find((item) => item.title === 'SF').url).toBe('https://wwbuq.lanzouu.com/b00jfjslcb');
  });

  test('does not reintroduce retired daily-card entries', () => {
    const daily = catalog.zh.sections.find((section) => section.id === '天卡专区');
    const titles = daily.items.map((item) => item.title);
    expect(titles).not.toEqual(expect.arrayContaining(['FY', 'HP', '骑士', '蓝鲸']));
  });
});
