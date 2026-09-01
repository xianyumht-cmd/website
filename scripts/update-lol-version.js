const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '../src/assets/data/lol-version.json');
const API_BASE_URL = 'http://api.cc1990.cc/api/hotlist/game';
const RIOT_GAME_UPDATES_URL = 'https://www.leagueoflegends.com/en-us/news/game-updates/';
const RIOT_PATCH_SCHEDULE_API_URL = 'https://skye-production.sgp.riotgames.com/api/v1/articles/league-of-legends/gameplay/patch-schedule-league-of-legends?locale=en-us';
const REQUEST_TIMEOUT_MS = 15000;
const VERSION_TITLE_KEYWORDS = ['版本更新公告', '版本更新', '版本公告'];
const VERSION_PATTERN = /\b(\d{1,3}\.\d{1,3})\b/;
const TITLE_DATE_PATTERN = /(\d{1,2})月(\d{1,2})日/;
const ISO_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/;
const RIOT_PATCH_HREF_PATTERN = /\/en-us\/news\/game-updates\/league-of-legends-patch-(\d{1,3})-(\d{1,3})-notes\/?$/i;

class UpdaterError extends Error {
    constructor(message, code = 'UPDATER_ERROR') {
        super(message);
        this.name = 'UpdaterError';
        this.code = code;
    }
}

function getField(object, names) {
    if (!object || typeof object !== 'object') return undefined;
    for (const name of names) {
        if (object[name] !== undefined && object[name] !== null && String(object[name]).trim() !== '') {
            return object[name];
        }
    }
    return undefined;
}

function parseIsoDate(value, fieldName) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        throw new UpdaterError(`${fieldName} must be an ISO date (YYYY-MM-DD)`, 'INVALID_DATE');
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
        year < 2000 ||
        year > 2100 ||
        date.getUTCFullYear() !== year ||
        date.getUTCMonth() !== month - 1 ||
        date.getUTCDate() !== day
    ) {
        throw new UpdaterError(`${fieldName} is not a possible calendar date`, 'INVALID_DATE');
    }
    return date;
}

function normalizeProviderDate(value, fieldName) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }

    const text = typeof value === 'string' ? value.trim() : '';
    const match = text.match(ISO_DATE_PATTERN);
    if (!match) {
        throw new UpdaterError(`${fieldName} is missing or malformed`, 'INVALID_DATE');
    }
    const normalized = match[1];
    parseIsoDate(normalized, fieldName);
    return normalized;
}

function parseVersionParts(version) {
    if (typeof version !== 'string' || !/^\d{1,3}\.\d{1,3}$/.test(version.trim())) {
        throw new UpdaterError('version must contain two numeric patch segments', 'INVALID_VERSION');
    }

    const parts = version.trim().split('.').map(Number);
    if (parts[0] < 1 || parts[0] > 99 || parts[1] < 0 || parts[1] > 99) {
        throw new UpdaterError('version is outside the expected patch range', 'INVALID_VERSION');
    }
    return parts;
}

function compareVersions(left, right) {
    const leftParts = parseVersionParts(left);
    const rightParts = parseVersionParts(right);
    if (leftParts[0] !== rightParts[0]) return leftParts[0] > rightParts[0] ? 1 : -1;
    if (leftParts[1] !== rightParts[1]) return leftParts[1] > rightParts[1] ? 1 : -1;
    return 0;
}

function extractVersion(value) {
    if (typeof value !== 'string') return null;
    const match = value.match(VERSION_PATTERN);
    if (!match) return null;

    try {
        parseVersionParts(match[1]);
        return match[1];
    } catch (error) {
        if (error instanceof UpdaterError && error.code === 'INVALID_VERSION') return null;
        throw error;
    }
}

function extractVersionFromHtml(html) {
    if (typeof html !== 'string' || html.trim() === '') return null;
    const $ = cheerio.load(html);
    return extractVersion($('title').text()) ||
        extractVersion($('h1').text()) ||
        extractVersion($('body').text().slice(0, 1000));
}

function normalizeRiotUrl(value) {
    try {
        const parsed = new URL(value, RIOT_GAME_UPDATES_URL);
        if (parsed.protocol !== 'https:' || parsed.hostname !== 'www.leagueoflegends.com') return null;
        return parsed.toString();
    } catch (error) {
        return null;
    }
}

function getRiotDateFromElement($, element) {
    return $(element).find('time[datetime]').first().attr('datetime') ||
        $(element).closest('article').find('time[datetime]').first().attr('datetime') ||
        $(element).find('meta[property="article:published_time"]').first().attr('content') ||
        '';
}

function extractRiotPatchListing(html) {
    if (typeof html !== 'string' || html.trim() === '') {
        throw new UpdaterError('Riot game updates page is empty', 'RIOT_INVALID_HTML');
    }

    const $ = cheerio.load(html);
    const candidates = [];
    $('a[href]').each((_, element) => {
        const url = normalizeRiotUrl($(element).attr('href'));
        if (!url) return;

        const pathMatch = new URL(url).pathname.match(RIOT_PATCH_HREF_PATTERN);
        if (!pathMatch) return;

        const version = `${pathMatch[1]}.${pathMatch[2]}`;
        const title = $(element).find('[data-testid="card-title"], h1, h2, h3').first().text().replace(/\s+/g, ' ').trim() ||
            ($(element).attr('aria-label') || '').replace(/\s+/g, ' ').trim() ||
            $(element).text().replace(/\s+/g, ' ').trim();
        const titlePattern = new RegExp(`^League of Legends Patch ${version.replace('.', '\\.')} Notes$`, 'i');
        if (!titlePattern.test(title)) return;

        const publishedAt = getRiotDateFromElement($, element);
        if (!publishedAt) return;

        let update;
        try {
            update = normalizeProviderDate(publishedAt, 'Riot publication date');
        } catch (error) {
            return;
        }

        candidates.push({ version, update, url });
    });

    if (candidates.length === 0) {
        throw new UpdaterError('Riot game updates page contains no usable patch article', 'RIOT_NO_PATCH');
    }

    candidates.sort((left, right) => {
        const versionOrder = compareVersions(right.version, left.version);
        return versionOrder || right.update.localeCompare(left.update);
    });
    return candidates[0];
}

function extractRiotPatchArticle(html, expectedVersion) {
    if (typeof html !== 'string' || html.trim() === '') {
        throw new UpdaterError('Riot patch article is empty', 'RIOT_INVALID_HTML');
    }

    const $ = cheerio.load(html);
    const title = $('h1').first().text().replace(/\s+/g, ' ').trim() ||
        $('title').first().text().replace(/\s+/g, ' ').trim();
    const titleMatch = title.match(/^League of Legends Patch (\d{1,3}\.\d{1,3}) Notes$/i);
    if (!titleMatch) {
        throw new UpdaterError('Riot page is not a League patch article', 'RIOT_IRRELEVANT_ARTICLE');
    }

    const version = titleMatch[1];
    parseVersionParts(version);
    if (expectedVersion && compareVersions(version, expectedVersion) !== 0) {
        throw new UpdaterError('Riot patch listing and article versions differ', 'RIOT_VERSION_MISMATCH');
    }

    const publishedAt = $('time[datetime]').first().attr('datetime') ||
        $('meta[property="article:published_time"]').first().attr('content') ||
        $('meta[name="date"]').first().attr('content');
    if (!publishedAt) {
        throw new UpdaterError('Riot patch article publication date is missing', 'RIOT_MISSING_DATE');
    }

    return {
        version,
        update: normalizeProviderDate(publishedAt, 'Riot publication date')
    };
}

function parseRiotSchedule(html) {
    if (typeof html !== 'string' || html.trim() === '') {
        throw new UpdaterError('Riot patch schedule is empty', 'RIOT_SCHEDULE_INVALID');
    }

    const $ = cheerio.load(html);
    const entries = [];
    $('table tr').each((_, row) => {
        const cells = $(row).find('td');
        if (cells.length < 2) return;

        const version = cells.eq(0).text().replace(/\s+/g, ' ').trim();
        if (!/^\d{1,3}\.\d{1,3}$/.test(version)) return;

        const dateText = cells.eq(1).text().replace(/\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
        const date = new Date(`${dateText} UTC`);
        if (Number.isNaN(date.getTime())) return;

        entries.push({ version, date: date.toISOString().slice(0, 10) });
    });

    if (entries.length === 0) {
        throw new UpdaterError('Riot patch schedule contains no usable rows', 'RIOT_SCHEDULE_INVALID');
    }
    return entries;
}

function selectRiotNextDate(schedule, currentVersion, updateDate) {
    const candidates = schedule
        .filter(entry => compareVersions(entry.version, currentVersion) > 0 && entry.date > updateDate)
        .sort((left, right) => left.date.localeCompare(right.date));
    return candidates.length > 0 ? candidates[0].date : null;
}

async function requestRiotResponse(url, { axiosGet = axios.get } = {}) {
    let response;
    try {
        response = await axiosGet(url, {
            timeout: REQUEST_TIMEOUT_MS,
            validateStatus: () => true
        });
    } catch (error) {
        if (error && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || /timeout/i.test(error.message || ''))) {
            throw new UpdaterError('Riot request timed out', 'RIOT_TIMEOUT');
        }
        throw new UpdaterError('Riot request failed', 'RIOT_REQUEST_ERROR');
    }

    if (!response || typeof response.status !== 'number' || response.status < 200 || response.status >= 300) {
        const status = response && response.status ? `HTTP ${response.status}` : 'invalid HTTP response';
        throw new UpdaterError(`Riot request failed: ${status}`, 'RIOT_HTTP_ERROR');
    }
    return response;
}

async function fetchRiotHtml(url, { axiosGet = axios.get } = {}) {
    const response = await requestRiotResponse(url, { axiosGet });
    if (typeof response.data !== 'string') {
        throw new UpdaterError('Riot response is not HTML', 'RIOT_INVALID_RESPONSE');
    }
    return response.data;
}

async function fetchRiotScheduleHtml({ axiosGet = axios.get } = {}) {
    const response = await requestRiotResponse(RIOT_PATCH_SCHEDULE_API_URL, { axiosGet });
    if (!response.data || typeof response.data.content !== 'string') {
        throw new UpdaterError('Riot schedule response format is invalid', 'RIOT_SCHEDULE_INVALID');
    }
    return response.data.content;
}

async function fetchRiotCandidate({ axiosGet = axios.get } = {}) {
    const listingHtml = await fetchRiotHtml(RIOT_GAME_UPDATES_URL, { axiosGet });
    const listing = extractRiotPatchListing(listingHtml);
    const articleHtml = await fetchRiotHtml(listing.url, { axiosGet });
    const article = extractRiotPatchArticle(articleHtml, listing.version);

    let next = getNextUpdate(article.update);
    let nextSource = 'fallback:+14 days';
    try {
        const scheduleHtml = await fetchRiotScheduleHtml({ axiosGet });
        const scheduledNext = selectRiotNextDate(parseRiotSchedule(scheduleHtml), article.version, article.update);
        if (scheduledNext) {
            next = scheduledNext;
            nextSource = 'Riot official schedule';
        }
    } catch (error) {
        // The current patch remains trustworthy when the optional schedule is unavailable.
    }

    return {
        version: article.version,
        update: article.update,
        next,
        nextSource,
        versionSource: 'Riot official patch notes'
    };
}

function getProviderYear(item, now) {
    const providerDate = getField(item, ['update', 'updateDate', 'date', 'publishedAt', 'time']);
    if (providerDate !== undefined) {
        const match = String(providerDate).match(/^(\d{4})-\d{2}-\d{2}/);
        if (match) return Number(match[1]);
    }
    return now.getUTCFullYear();
}

function extractUpdateDate(item, title, now = new Date()) {
    const titleDate = typeof title === 'string' ? title.match(TITLE_DATE_PATTERN) : null;
    if (titleDate) {
        const year = getProviderYear(item, now);
        return `${year}-${titleDate[1].padStart(2, '0')}-${titleDate[2].padStart(2, '0')}`;
    }

    const providerDate = getField(item, ['update', 'updateDate', 'date', 'publishedAt', 'time']);
    if (providerDate === undefined) {
        throw new UpdaterError('provider candidate is missing update date', 'MISSING_FIELD');
    }
    return normalizeProviderDate(providerDate, 'update date');
}

function getNextUpdate(dateStr) {
    const date = parseIsoDate(dateStr, 'update date');
    date.setUTCDate(date.getUTCDate() + 14);
    return date.toISOString().slice(0, 10);
}

function determineNextDate(updateDate, explicitNextDate) {
    if (explicitNextDate !== undefined) {
        return normalizeProviderDate(explicitNextDate, 'next update date');
    }
    return getNextUpdate(updateDate);
}

function assertProviderPayload(payload) {
    if (!payload || typeof payload !== 'object' || !Array.isArray(payload.data)) {
        throw new UpdaterError('provider response format is invalid', 'INVALID_PROVIDER_RESPONSE');
    }
    if (payload.data.length === 0) {
        throw new UpdaterError('provider response contains no candidates', 'EMPTY_PROVIDER_RESPONSE');
    }
}

async function extractCandidate(payload, { fetchDetail, now = new Date() } = {}) {
    assertProviderPayload(payload);
    const candidates = [];

    for (const item of payload.data) {
        if (!item || typeof item !== 'object') continue;
        const title = typeof item.title === 'string' ? item.title : '';
        if (!VERSION_TITLE_KEYWORDS.some(keyword => title.includes(keyword))) continue;

        let version = extractVersion(title);
        if (!version && item.url && fetchDetail) {
            try {
                const detailResponse = await fetchDetail(item.url);
                const detailHtml = detailResponse && Object.prototype.hasOwnProperty.call(detailResponse, 'data')
                    ? detailResponse.data
                    : detailResponse;
                version = extractVersionFromHtml(detailHtml);
            } catch (error) {
                // A detail-page failure is reported as no usable candidate; the key is never included.
                version = null;
            }
        }
        if (!version) continue;

        const update = extractUpdateDate(item, title, now);
        const explicitNext = getField(item, [
            'next',
            'nextUpdate',
            'nextUpdateDate',
            'nextDate',
            'expectedNextUpdate'
        ]);
        const next = determineNextDate(update, explicitNext);
        candidates.push({
            version,
            update,
            next,
            nextSource: explicitNext === undefined ? 'fallback:+14 days' : 'provider'
        });
    }

    if (candidates.length === 0) {
        throw new UpdaterError('provider response contains no usable version candidate', 'NO_CANDIDATE');
    }

    candidates.sort((left, right) => {
        const versionOrder = compareVersions(right.version, left.version);
        if (versionOrder !== 0) return versionOrder;
        return right.update.localeCompare(left.update);
    });
    return candidates[0];
}

function validateCandidate(candidate, current) {
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
        throw new UpdaterError('candidate is missing or malformed', 'INVALID_CANDIDATE');
    }

    const version = typeof candidate.version === 'string' ? candidate.version.trim() : '';
    const update = typeof candidate.update === 'string' ? candidate.update.trim() : '';
    const next = typeof candidate.next === 'string' ? candidate.next.trim() : '';
    const updateDate = parseIsoDate(update, 'update date');
    const nextDate = parseIsoDate(next, 'next update date');
    parseVersionParts(version);
    if (nextDate.getTime() < updateDate.getTime()) {
        throw new UpdaterError('next update date cannot precede update date', 'INVALID_DATE_ORDER');
    }

    const normalized = { version, update, next };
    if (!current) return normalized;

    const currentNormalized = validateCandidate(current);
    const versionOrder = compareVersions(version, currentNormalized.version);
    if (versionOrder < 0) {
        throw new UpdaterError(
            `candidate version ${version} is older than current version ${currentNormalized.version}`,
            'VERSION_DOWNGRADE'
        );
    }
    if (
        versionOrder === 0 &&
        (update !== currentNormalized.update || next !== currentNormalized.next)
    ) {
        throw new UpdaterError(
            `candidate version ${version} conflicts with current dates`,
            'VERSION_DATE_CONFLICT'
        );
    }
    return normalized;
}

function readCurrentVersion(filePath = DATA_FILE) {
    let parsed;
    try {
        parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        throw new UpdaterError('current canonical version file cannot be read', 'CURRENT_FILE_ERROR');
    }
    return validateCandidate(parsed);
}

function writeVersionAtomically(filePath, value) {
    const serialized = `${JSON.stringify(validateCandidate(value), null, 2)}\n`;
    const directory = path.dirname(filePath);
    const temporaryPath = path.join(
        directory,
        `.${path.basename(filePath)}.${process.pid}.${Date.now()}.${crypto.randomBytes(6).toString('hex')}.tmp`
    );
    let descriptor;

    try {
        descriptor = fs.openSync(temporaryPath, 'wx');
        fs.writeFileSync(descriptor, serialized, 'utf8');
        fs.fsyncSync(descriptor);
        fs.closeSync(descriptor);
        descriptor = undefined;

        // The temporary file is in the same directory, so the final rename is a single replacement step.
        fs.renameSync(temporaryPath, filePath);
    } catch (error) {
        if (descriptor !== undefined) {
            try { fs.closeSync(descriptor); } catch (closeError) { /* best effort */ }
        }
        throw new UpdaterError(`canonical version file was not replaced: ${error.message}`, 'WRITE_ERROR');
    } finally {
        if (fs.existsSync(temporaryPath)) {
            try { fs.unlinkSync(temporaryPath); } catch (cleanupError) { /* best effort */ }
        }
    }
}

function buildProviderUrl(apiKey) {
    return `${API_BASE_URL}?apiKey=${encodeURIComponent(apiKey)}&type=lol`;
}

function requireApiKey(environment = process.env) {
    if (!environment || typeof environment.LOL_API_KEY !== 'string' || environment.LOL_API_KEY.trim() === '') {
        throw new UpdaterError('LOL_API_KEY environment variable is required; no file was changed', 'MISSING_CREDENTIAL');
    }
    return environment.LOL_API_KEY.trim();
}

async function fetchProviderData({ apiKey, axiosGet = axios.get } = {}) {
    const resolvedKey = apiKey || requireApiKey();
    let response;
    try {
        response = await axiosGet(buildProviderUrl(resolvedKey), {
            timeout: REQUEST_TIMEOUT_MS,
            validateStatus: () => true
        });
    } catch (error) {
        if (error && (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT')) {
            throw new UpdaterError('provider request timed out', 'PROVIDER_TIMEOUT');
        }
        throw new UpdaterError('provider request failed', 'PROVIDER_REQUEST_ERROR');
    }

    if (!response || typeof response.status !== 'number' || response.status < 200 || response.status >= 300) {
        const status = response && response.status ? `HTTP ${response.status}` : 'invalid HTTP response';
        throw new UpdaterError(`provider request failed: ${status}`, 'PROVIDER_HTTP_ERROR');
    }
    assertProviderPayload(response.data);
    return response.data;
}

async function fetchDetailPage(url, { axiosGet = axios.get } = {}) {
    try {
        const response = await axiosGet(url, {
            timeout: REQUEST_TIMEOUT_MS,
            validateStatus: () => true
        });
        if (!response || typeof response.status !== 'number' || response.status < 200 || response.status >= 300) {
            throw new Error('detail page HTTP failure');
        }
        return response.data;
    } catch (error) {
        throw new UpdaterError('provider detail page request failed', 'DETAIL_REQUEST_ERROR');
    }
}

async function fetchLegacyCandidate({
    environment = process.env,
    axiosGet = axios.get,
    detailFetcher = fetchDetailPage,
    now = new Date()
} = {}) {
    const apiKey = requireApiKey(environment);
    const payload = await fetchProviderData({ apiKey, axiosGet });
    const candidate = await extractCandidate(payload, { fetchDetail: detailFetcher, now });
    return { ...candidate, versionSource: 'legacy third-party' };
}

async function resolveCandidate({
    riotProvider = () => fetchRiotCandidate(),
    legacyProvider = null
} = {}) {
    let riotError;
    try {
        const candidate = await riotProvider();
        return {
            candidate,
            versionSource: candidate.versionSource || 'Riot official'
        };
    } catch (error) {
        riotError = error;
    }

    if (typeof legacyProvider !== 'function') {
        throw new UpdaterError(
            `Riot provider failed: ${riotError instanceof Error ? riotError.message : 'request failed'}`,
            'RIOT_PROVIDER_FAILED'
        );
    }

    try {
        const candidate = await legacyProvider();
        return {
            candidate,
            versionSource: candidate.versionSource || 'legacy third-party'
        };
    } catch (legacyError) {
        const riotCode = riotError && riotError.code ? riotError.code : 'RIOT_ERROR';
        const legacyCode = legacyError && legacyError.code ? legacyError.code : 'LEGACY_ERROR';
        throw new UpdaterError(
            `Riot provider failed (${riotCode}); legacy fallback failed (${legacyCode})`,
            'ALL_PROVIDERS_FAILED'
        );
    }
}

async function runUpdate({
    filePath = DATA_FILE,
    dryRun = false,
    provider,
    riotProvider,
    legacyProvider,
    detailFetcher = fetchDetailPage,
    now = new Date(),
    environment = process.env
} = {}) {
    const current = readCurrentVersion(filePath);
    let candidate;
    let versionSource;
    if (typeof provider === 'function') {
        const payload = await provider();
        candidate = await extractCandidate(payload, { fetchDetail: detailFetcher, now });
        versionSource = 'legacy third-party';
    } else {
        const resolved = await resolveCandidate({
            riotProvider: riotProvider || (() => fetchRiotCandidate()),
            legacyProvider: legacyProvider === undefined
                ? (() => fetchLegacyCandidate({ environment, detailFetcher, now }))
                : legacyProvider
        });
        candidate = resolved.candidate;
        versionSource = resolved.versionSource;
    }
    const validated = validateCandidate(candidate, current);
    const versionOrder = compareVersions(validated.version, current.version);
    const nextDateSource = candidate.nextSource || 'unknown';

    if (versionOrder === 0) {
        return { current, candidate: validated, nextDateSource, versionSource, result: 'unchanged', changed: false };
    }
    if (dryRun) {
        return { current, candidate: validated, nextDateSource, versionSource, result: 'would update', changed: false };
    }

    writeVersionAtomically(filePath, validated);
    return { current, candidate: validated, nextDateSource, versionSource, result: 'updated', changed: true };
}

function sanitizeErrorMessage(error, secrets = []) {
    let message = error instanceof Error ? error.message : String(error);
    for (const secret of secrets) {
        if (secret) message = message.split(secret).join('[redacted]');
    }
    return message.replace(/([?&]apiKey=)[^&\s]+/gi, '$1[redacted]');
}

function logResult(logger, result) {
    logger.log(`Current: ${JSON.stringify(result.current)}`);
    logger.log(`Candidate: ${JSON.stringify(result.candidate)}`);
    logger.log(`Version source: ${result.versionSource}`);
    logger.log(`Next date source: ${result.nextDateSource}`);
    logger.log(`Result: ${result.result}`);
}

async function main(args = process.argv.slice(2), environment = process.env, options = {}) {
    const logger = options.logger || console;
    const unknownArgs = args.filter(argument => argument !== '--dry-run' && argument !== '--help');
    if (unknownArgs.length > 0) {
        logger.error(`Result: rejected\nError: unsupported argument ${unknownArgs[0]}`);
        return 1;
    }
    if (args.includes('--help')) {
        logger.log('Usage: npm run update:lol-version [-- --dry-run]');
        return 0;
    }

    let apiKey = environment && typeof environment.LOL_API_KEY === 'string'
        ? environment.LOL_API_KEY
        : undefined;
    try {
        const provider = options.provider;
        const detailFetcher = options.detailFetcher || fetchDetailPage;
        const riotProvider = options.riotProvider || (() => fetchRiotCandidate());
        const legacyProvider = options.legacyProvider === undefined ? (async () => {
            apiKey = requireApiKey(environment);
            return fetchLegacyCandidate({ environment, apiKey, detailFetcher });
        }) : options.legacyProvider;
        const result = await runUpdate({
            filePath: options.filePath || DATA_FILE,
            dryRun: args.includes('--dry-run'),
            provider,
            riotProvider,
            legacyProvider,
            detailFetcher,
            now: options.now || new Date(),
            environment
        });
        logResult(logger, result);
        return 0;
    } catch (error) {
        const errorCode = error && error.code ? `${error.code}: ` : '';
        logger.error(`Result: rejected\nError: ${errorCode}${sanitizeErrorMessage(error, [apiKey])}`);
        return 1;
    }
}

module.exports = {
    DATA_FILE,
    RIOT_GAME_UPDATES_URL,
    RIOT_PATCH_SCHEDULE_API_URL,
    UpdaterError,
    compareVersions,
    determineNextDate,
    extractCandidate,
    extractRiotPatchArticle,
    extractRiotPatchListing,
    extractVersion,
    fetchDetailPage,
    fetchLegacyCandidate,
    fetchProviderData,
    fetchRiotCandidate,
    fetchRiotHtml,
    fetchRiotScheduleHtml,
    getNextUpdate,
    main,
    parseRiotSchedule,
    readCurrentVersion,
    requireApiKey,
    resolveCandidate,
    runUpdate,
    sanitizeErrorMessage,
    selectRiotNextDate,
    validateCandidate,
    writeVersionAtomically
};

if (require.main === module) {
    main().then(code => {
        process.exitCode = code;
    }).catch(() => {
        process.exitCode = 1;
    });
}
