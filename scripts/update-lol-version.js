const axios = require('axios');
const cheerio = require('cheerio');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.resolve(__dirname, '../src/assets/data/lol-version.json');
const API_BASE_URL = 'http://api.cc1990.cc/api/hotlist/game';
const REQUEST_TIMEOUT_MS = 15000;
const VERSION_TITLE_KEYWORDS = ['版本更新公告', '版本更新', '版本公告'];
const VERSION_PATTERN = /\b(\d{1,3}\.\d{1,3})\b/;
const TITLE_DATE_PATTERN = /(\d{1,2})月(\d{1,2})日/;
const ISO_DATE_PATTERN = /^(\d{4}-\d{2}-\d{2})/;

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

async function runUpdate({
    filePath = DATA_FILE,
    dryRun = false,
    provider = () => fetchProviderData(),
    detailFetcher = fetchDetailPage,
    now = new Date()
} = {}) {
    const current = readCurrentVersion(filePath);
    const payload = await provider();
    const candidate = await extractCandidate(payload, { fetchDetail: detailFetcher, now });
    const validated = validateCandidate(candidate, current);
    const versionOrder = compareVersions(validated.version, current.version);
    const nextDateSource = candidate.nextSource || 'unknown';

    if (versionOrder === 0) {
        return { current, candidate: validated, nextDateSource, result: 'unchanged', changed: false };
    }
    if (dryRun) {
        return { current, candidate: validated, nextDateSource, result: 'would update', changed: false };
    }

    writeVersionAtomically(filePath, validated);
    return { current, candidate: validated, nextDateSource, result: 'updated', changed: true };
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

    let apiKey;
    try {
        apiKey = requireApiKey(environment);
        const provider = options.provider || (() => fetchProviderData({ apiKey }));
        const detailFetcher = options.detailFetcher || fetchDetailPage;
        const result = await runUpdate({
            filePath: options.filePath || DATA_FILE,
            dryRun: args.includes('--dry-run'),
            provider,
            detailFetcher,
            now: options.now || new Date()
        });
        logResult(logger, result);
        return 0;
    } catch (error) {
        logger.error(`Result: rejected\nError: ${sanitizeErrorMessage(error, [apiKey])}`);
        return 1;
    }
}

module.exports = {
    DATA_FILE,
    UpdaterError,
    compareVersions,
    determineNextDate,
    extractCandidate,
    extractVersion,
    fetchDetailPage,
    fetchProviderData,
    getNextUpdate,
    main,
    readCurrentVersion,
    requireApiKey,
    runUpdate,
    sanitizeErrorMessage,
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
