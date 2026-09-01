const fs = require('fs');
const os = require('os');
const path = require('path');

const {
    RIOT_GAME_UPDATES_URL,
    RIOT_PATCH_SCHEDULE_API_URL,
    UpdaterError,
    extractCandidate,
    extractRiotPatchArticle,
    extractRiotPatchListing,
    fetchRiotCandidate,
    fetchRiotHtml,
    fetchProviderData,
    main,
    parseRiotSchedule,
    resolveCandidate,
    runUpdate,
    sanitizeErrorMessage,
    selectRiotNextDate,
    validateCandidate
} = require('../../scripts/update-lol-version');

const CURRENT = {
    version: '26.15',
    update: '2026-07-30',
    next: '2026-08-13'
};

function createFixtureFile(value = CURRENT) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'website-lol-version-'));
    const filePath = path.join(directory, 'lol-version.json');
    fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    return { directory, filePath };
}

function riotListingFixture(entries = [
    { version: '26.17', publishedAt: '2026-08-25T18:00:00.000Z' },
    { version: '26.16', publishedAt: '2026-08-11T18:00:00.000Z' }
]) {
    return `<html><body>${entries.map(entry => {
        const slug = entry.version.replace('.', '-');
        return `<a href="/en-us/news/game-updates/league-of-legends-patch-${slug}-notes"><article><time datetime="${entry.publishedAt}"></time><h3>League of Legends Patch ${entry.version} Notes</h3></article></a>`;
    }).join('')}</body></html>`;
}

function riotArticleFixture({ version = '26.17', publishedAt = '2026-08-25T18:00:00.000Z', title } = {}) {
    return `<html><head><title>${title || `League of Legends Patch ${version} Notes`}</title></head><body><h1>${title || `League of Legends Patch ${version} Notes`}</h1>${publishedAt ? `<time datetime="${publishedAt}"></time>` : ''}</body></html>`;
}

function riotScheduleFixture(rows = [
    ['26.17', 'August 26, 2026 (Wednesday)'],
    ['26.18', 'September 10, 2026 (Thursday)'],
    ['26.19', 'September 23, 2026']
]) {
    return `<table><tbody>${rows.map(([version, date]) => `<tr><td>${version}</td><td>${date}</td></tr>`).join('')}</tbody></table>`;
}

function createRiotAxios({
    listingHtml = riotListingFixture(),
    articleHtml = riotArticleFixture(),
    scheduleHtml = riotScheduleFixture()
} = {}) {
    return async url => {
        if (url === RIOT_GAME_UPDATES_URL) return { status: 200, data: listingHtml };
        if (url.includes('/league-of-legends-patch-')) return { status: 200, data: articleHtml };
        if (url === RIOT_PATCH_SCHEDULE_API_URL) return { status: 200, data: { content: scheduleHtml } };
        throw new Error(`unexpected Riot URL ${url}`);
    };
}

function riotCandidate(version = '26.17', update = '2026-08-25', next = '2026-09-10') {
    return {
        version,
        update,
        next,
        nextSource: 'Riot official schedule',
        versionSource: 'Riot official patch notes'
    };
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

    test('parses a valid current Riot patch page and official schedule', async () => {
        const candidate = await fetchRiotCandidate({ axiosGet: createRiotAxios() });

        expect(candidate).toEqual({
            version: '26.17',
            update: '2026-08-25',
            next: '2026-09-10',
            nextSource: 'Riot official schedule',
            versionSource: 'Riot official patch notes'
        });
    });

    test('selects the highest structurally identified Riot patch listing', () => {
        const candidate = extractRiotPatchListing(riotListingFixture([
            { version: '26.16', publishedAt: '2026-08-11T18:00:00.000Z' },
            { version: '26.17', publishedAt: '2026-08-25T18:00:00.000Z' }
        ]));

        expect(candidate).toMatchObject({ version: '26.17', update: '2026-08-25' });
        expect(candidate.url).toContain('patch-26-17-notes');
    });

    test('parses Riot production card markup without relying on CSS class names', () => {
        const html = `<a aria-label="League of Legends Patch 26.17 Notes" href="/en-us/news/game-updates/league-of-legends-patch-26-17-notes"><span><div data-testid="card-title">League of Legends Patch 26.17 Notes</div><time datetime="2026-08-25T18:00:00.000Z"></time></span></a>`;
        expect(extractRiotPatchListing(html)).toMatchObject({
            version: '26.17',
            update: '2026-08-25'
        });
    });

    test('parses the Riot schedule and selects the first later patch date', () => {
        const schedule = parseRiotSchedule(riotScheduleFixture());

        expect(selectRiotNextDate(schedule, '26.17', '2026-08-25')).toBe('2026-09-10');
    });

    test('rejects a Riot listing with no version', () => {
        expect(() => extractRiotPatchListing('<a href="/en-us/news/game-updates/patch-notes"><h3>Patch Notes</h3><time datetime="2026-08-25T18:00:00.000Z"></time></a>')).toThrow(/no usable patch article/);
    });

    test('rejects a Riot listing with no publication date', () => {
        const html = riotListingFixture([{ version: '26.17', publishedAt: '' }]);
        expect(() => extractRiotPatchListing(html)).toThrow(/no usable patch article/);
    });

    test('rejects malformed Riot HTML', () => {
        expect(() => extractRiotPatchListing('<html><body><broken>')).toThrow(/no usable patch article/);
    });

    test('rejects an irrelevant Riot article', () => {
        expect(() => extractRiotPatchArticle(
            '<html><head><title>Champion Dev Update</title></head><body><h1>Champion Dev Update</h1><time datetime="2026-08-25T18:00:00.000Z"></time></body></html>'
        )).toThrow(/not a League patch article/);
    });

    test('classifies Riot HTTP 404 and HTTP 500 failures', async () => {
        await expect(fetchRiotHtml(RIOT_GAME_UPDATES_URL, {
            axiosGet: async () => ({ status: 404, data: 'not found' })
        })).rejects.toMatchObject({ code: 'RIOT_HTTP_ERROR' });
        await expect(fetchRiotHtml(RIOT_GAME_UPDATES_URL, {
            axiosGet: async () => ({ status: 500, data: 'server error' })
        })).rejects.toMatchObject({ code: 'RIOT_HTTP_ERROR' });
    });

    test('classifies a Riot timeout without exposing request details', async () => {
        await expect(fetchRiotHtml(RIOT_GAME_UPDATES_URL, {
            axiosGet: async () => {
                const error = new Error('request timed out');
                error.code = 'ETIMEDOUT';
                throw error;
            }
        })).rejects.toMatchObject({ code: 'RIOT_TIMEOUT' });
    });

    test('rejects an older Riot candidate', async () => {
        await expect(runUpdate({
            filePath: fixture.filePath,
            riotProvider: async () => riotCandidate('26.14', '2026-07-16', '2026-07-30'),
            legacyProvider: null
        })).rejects.toMatchObject({ code: 'VERSION_DOWNGRADE' });
    });

    test('accepts a newer Riot candidate and writes it', async () => {
        const result = await runUpdate({
            filePath: fixture.filePath,
            riotProvider: async () => riotCandidate(),
            legacyProvider: null
        });

        expect(result.result).toBe('updated');
        expect(result.versionSource).toBe('Riot official patch notes');
        expect(JSON.parse(fs.readFileSync(fixture.filePath, 'utf8'))).toEqual({
            version: '26.17',
            update: '2026-08-25',
            next: '2026-09-10'
        });
    });

    test('Riot dry-run succeeds without LOL_API_KEY', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        const { logger, lines } = collectLogger();
        const code = await main(['--dry-run'], {}, {
            filePath: fixture.filePath,
            riotProvider: async () => riotCandidate(),
            legacyProvider: null,
            logger
        });

        expect(code).toBe(0);
        expect(lines).toEqual(expect.arrayContaining([
            expect.stringContaining('Version source: Riot official patch notes'),
            expect.stringContaining('Next date source: Riot official schedule'),
            'Result: would update'
        ]));
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('rejects Riot failure when no fallback is configured', async () => {
        await expect(resolveCandidate({
            riotProvider: async () => { throw new UpdaterError('Riot fixture failed', 'RIOT_REQUEST_ERROR'); },
            legacyProvider: null
        })).rejects.toMatchObject({ code: 'RIOT_PROVIDER_FAILED' });
    });

    test('uses a mocked valid third-party candidate only after Riot failure', async () => {
        const resolved = await resolveCandidate({
            riotProvider: async () => { throw new UpdaterError('Riot fixture failed', 'RIOT_REQUEST_ERROR'); },
            legacyProvider: async () => ({
                version: '26.16',
                update: '2026-08-13',
                next: '2026-08-27'
            })
        });

        expect(resolved).toMatchObject({
            versionSource: 'legacy third-party',
            candidate: { version: '26.16' }
        });
    });

    test('prefers a valid Riot candidate over the third-party candidate', async () => {
        let legacyCalled = false;
        const resolved = await resolveCandidate({
            riotProvider: async () => riotCandidate(),
            legacyProvider: async () => {
                legacyCalled = true;
                return { version: '26.18', update: '2026-09-10', next: '2026-09-24' };
            }
        });

        expect(resolved.versionSource).toBe('Riot official patch notes');
        expect(resolved.candidate.version).toBe('26.17');
        expect(legacyCalled).toBe(false);
    });

    test('rejects an equal version with conflicting dates', () => {
        expect(() => validateCandidate({
            version: '26.15',
            update: '2026-08-01',
            next: '2026-08-15'
        }, CURRENT)).toThrow(/conflicts with current dates/);
    });

    test('Riot dry-run validates but does not write the canonical file', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        const result = await runUpdate({
            filePath: fixture.filePath,
            dryRun: true,
            riotProvider: async () => riotCandidate(),
            legacyProvider: null
        });

        expect(result.result).toBe('would update');
        expect(result.changed).toBe(false);
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('Riot parser failure preserves the canonical file', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        await expect(runUpdate({
            filePath: fixture.filePath,
            riotProvider: async () => { throw new UpdaterError('invalid Riot fixture', 'RIOT_INVALID_HTML'); },
            legacyProvider: null
        })).rejects.toMatchObject({ code: 'RIOT_PROVIDER_FAILED' });
        expect(fs.readFileSync(fixture.filePath, 'utf8')).toBe(before);
    });

    test('writes a valid Riot real-write fixture through the atomic updater', async () => {
        const result = await runUpdate({
            filePath: fixture.filePath,
            riotProvider: async () => riotCandidate(),
            legacyProvider: null
        });

        expect(result.changed).toBe(true);
        expect(fs.existsSync(path.join(fixture.directory, '.lol-version.json.tmp'))).toBe(false);
    });

    test('falls back to +14 days when the optional Riot schedule is unavailable', async () => {
        const candidate = await fetchRiotCandidate({
            axiosGet: createRiotAxios({ scheduleHtml: '<html><body>No schedule table</body></html>' })
        });

        expect(candidate).toMatchObject({
            version: '26.17',
            next: '2026-09-08',
            nextSource: 'fallback:+14 days'
        });
    });

    test('accepts a valid newer legacy provider candidate for compatibility', async () => {
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

    test('leaves an equal legacy version with equal dates unchanged', async () => {
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

    test('rejects invalid provider candidates and preserves the file', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        await expect(runUpdate({
            filePath: fixture.filePath,
            provider: async () => ({ data: [{ title: '26.16版本更新公告' }] })
        })).rejects.toMatchObject({ code: 'MISSING_FIELD' });
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

    test('extracts a version from a legacy detail page', async () => {
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

    test('classifies legacy provider HTTP failures and timeouts', async () => {
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

    test('CLI rejects missing credentials only after Riot failure and preserves the file', async () => {
        const before = fs.readFileSync(fixture.filePath, 'utf8');
        const { logger, lines } = collectLogger();
        const code = await main([], {}, {
            filePath: fixture.filePath,
            riotProvider: async () => { throw new UpdaterError('Riot unavailable', 'RIOT_REQUEST_ERROR'); },
            legacyProvider: async () => { throw new UpdaterError('LOL_API_KEY environment variable is required', 'MISSING_CREDENTIAL'); },
            logger
        });

        expect(code).toBe(1);
        expect(lines.join('\n')).toMatch(/ALL_PROVIDERS_FAILED/);
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
