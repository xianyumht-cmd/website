const fs = require('fs');
const os = require('os');
const path = require('path');

const {
    extractCandidate,
    fetchProviderData,
    main,
    runUpdate,
    sanitizeErrorMessage,
    validateCandidate
} = require('../../scripts/update-lol-version');

const CURRENT = {
    version: '26.15',
    update: '2026-07-30',
    next: '2026-08-13'
};

function createFixtureFile() {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'website-lol-version-'));
    const filePath = path.join(directory, 'lol-version.json');
    fs.writeFileSync(filePath, `${JSON.stringify(CURRENT, null, 2)}\n`, 'utf8');
    return { directory, filePath };
}

function newerProvider() {
    return {
        data: [{
            title: '26.16版本更新公告 8月13日',
            time: '2026-08-13 00:00:00'
        }]
    };
}

function collectLogger() {
    const lines = [];
    return {
        logger: {
            log: message => lines.push(String(message)),
            error: message => lines.push(String(message))
        },
        lines
    };
}

describe('LOL version updater', () => {
    let fixture;

    beforeEach(() => {
        fixture = createFixtureFile();
    });

    afterEach(() => {
        fs.rmSync(fixture.directory, { recursive: true, force: true });
    });

    test('accepts a valid newer provider candidate and updates the fixture', async () => {
        const result = await runUpdate({
            filePath: fixture.filePath,
            provider: async () => newerProvider()
        });

        expect(result.result).toBe('updated');
        expect(result.nextDateSource).toBe('fallback:+14 days');
        expect(JSON.parse(fs.readFileSync(fixture.filePath, 'utf8'))).toEqual({
            version: '26.16',
            update: '2026-08-13',
            next: '2026-08-27'
        });
    });

    test('leaves an equal version with equal dates unchanged', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        const result = await runUpdate({
            filePath: fixture.filePath,
            provider: async () => ({
                data: [{ title: '26.15版本更新公告 7月30日', time: '2026-07-30 00:00:00' }]
            })
        });

        expect(result.result).toBe('unchanged');
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('rejects a candidate older than the canonical version', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        await expect(runUpdate({
            filePath: fixture.filePath,
            provider: async () => ({
                data: [{ title: '26.14版本更新公告 7月16日', time: '2026-07-16 00:00:00' }]
            })
        })).rejects.toMatchObject({ code: 'VERSION_DOWNGRADE' });
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test.each([
        ['invalid version', { version: 'not-a-version', update: '2026-08-13', next: '2026-08-27' }],
        ['invalid update date', { version: '26.16', update: '2026-02-30', next: '2026-08-27' }],
        ['invalid next date', { version: '26.16', update: '2026-08-13', next: '2026-02-30' }],
        ['next date before update date', { version: '26.16', update: '2026-08-13', next: '2026-08-12' }]
    ])('rejects %s', (_label, candidate) => {
        expect(() => validateCandidate(candidate)).toThrow();
    });

    test('rejects missing provider fields', async () => {
        await expect(runUpdate({
            filePath: fixture.filePath,
            provider: async () => ({ data: [{ title: '26.16版本更新公告' }] })
        })).rejects.toMatchObject({ code: 'MISSING_FIELD' });
    });

    test('rejects malformed and empty provider responses', async () => {
        await expect(runUpdate({
            filePath: fixture.filePath,
            provider: async () => ({ data: {} })
        })).rejects.toMatchObject({ code: 'INVALID_PROVIDER_RESPONSE' });
        await expect(runUpdate({
            filePath: fixture.filePath,
            provider: async () => ({ data: [] })
        })).rejects.toMatchObject({ code: 'EMPTY_PROVIDER_RESPONSE' });
    });

    test('rejects an equal version with conflicting dates', () => {
        expect(() => validateCandidate({
            version: '26.15',
            update: '2026-08-01',
            next: '2026-08-15'
        }, CURRENT)).toThrow(/conflicts with current dates/);
    });

    test('dry-run uses the same validation but does not write', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        const result = await runUpdate({
            filePath: fixture.filePath,
            dryRun: true,
            provider: async () => newerProvider()
        });

        expect(result.result).toBe('would update');
        expect(result.changed).toBe(false);
        expect(result.nextDateSource).toBe('fallback:+14 days');
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('failed update does not modify the canonical file', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        await expect(runUpdate({
            filePath: fixture.filePath,
            provider: async () => ({
                data: [{ title: '26.14版本更新公告 7月16日', time: '2026-07-16 00:00:00' }]
            })
        })).rejects.toBeDefined();
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('manual dry-run prints current, candidate, source, and result without writing', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        const { logger, lines } = collectLogger();
        const code = await main(['--dry-run'], { LOL_API_KEY: 'fixture-key' }, {
            filePath: fixture.filePath,
            provider: async () => newerProvider(),
            logger
        });

        expect(code).toBe(0);
        expect(lines).toEqual(expect.arrayContaining([
            expect.stringContaining('Current:'),
            expect.stringContaining('Candidate:'),
            expect.stringContaining('Next date source: fallback:+14 days'),
            'Result: would update'
        ]));
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('extracts a version from a detail page when the title has no version', async () => {
        const candidate = await extractCandidate({
            data: [{
                title: '版本更新公告 8月27日',
                time: '2026-08-27 00:00:00',
                url: 'https://example.invalid/detail'
            }]
        }, {
            fetchDetail: async () => '<html><head><title>英雄联盟 26.17 版本更新</title></head></html>'
        });

        expect(candidate).toMatchObject({
            version: '26.17',
            update: '2026-08-27',
            next: '2026-09-10'
        });
    });

    test('classifies provider HTTP failures and timeouts without exposing request details', async () => {
        await expect(fetchProviderData({
            apiKey: 'fixture-key',
            axiosGet: async () => ({ status: 503, data: {} })
        })).rejects.toMatchObject({ code: 'PROVIDER_HTTP_ERROR' });

        await expect(fetchProviderData({
            apiKey: 'fixture-key',
            axiosGet: async () => {
                const error = new Error('request timed out');
                error.code = 'ETIMEDOUT';
                throw error;
            }
        })).rejects.toMatchObject({ code: 'PROVIDER_TIMEOUT' });
    });

    test('manual CLI rejects missing credentials without changing the file', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        const { logger, lines } = collectLogger();
        const code = await main([], {}, { filePath: fixture.filePath, logger });

        expect(code).toBe(1);
        expect(lines.join('\n')).toMatch(/LOL_API_KEY/);
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('CLI errors never print the credential', async () => {
        const secret = 'fixture-secret-must-not-print';
        const { logger, lines } = collectLogger();
        const code = await main([], { LOL_API_KEY: secret }, {
            filePath: fixture.filePath,
            provider: async () => { throw new Error(`request failed apiKey=${secret}`); },
            logger
        });

        expect(code).toBe(1);
        expect(lines.join('\n')).not.toContain(secret);
        expect(sanitizeErrorMessage(new Error(`apiKey=${secret}`), [secret])).not.toContain(secret);
    });
});
