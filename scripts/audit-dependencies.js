const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const UNPATCHED_DEV_ADVISORY = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm';
const EXCEPTION_END = '2026-11-30';

function isHigh(item) {
    return item && (item.severity === 'high' || item.severity === 'critical');
}

function evaluateAudit(report, lock, date = new Date()) {
    if (!report || report.error || !report.vulnerabilities || !lock || !lock.packages) {
        return { ok: false, blocked: ['Invalid npm audit or lockfile data'], exempted: [] };
    }

    const vulnerabilities = report.vulnerabilities;
    const highNames = Object.keys(vulnerabilities).filter(name => isHigh(vulnerabilities[name]));
    if (highNames.length === 0) return { ok: true, blocked: [], exempted: [] };

    if (date.toISOString().slice(0, 10) > EXCEPTION_END) {
        return { ok: false, blocked: ['The development-only braces exception has expired'], exempted: [] };
    }

    const recognized = new Set();
    function isKnownDevChain(name, ancestors = new Set()) {
        const vulnerability = vulnerabilities[name];
        if (!isHigh(vulnerability) || ancestors.has(name)) return false;

        const nodes = vulnerability.nodes;
        if (!Array.isArray(nodes) || nodes.length === 0) return false;
        if (nodes.some(node => !lock.packages[node] || lock.packages[node].dev !== true)) return false;

        const nextAncestors = new Set(ancestors);
        nextAncestors.add(name);
        let hasKnownRoot = false;

        for (const via of vulnerability.via || []) {
            if (typeof via === 'string') {
                if (!vulnerabilities[via]) return false;
                if (isHigh(vulnerabilities[via])) {
                    if (!isKnownDevChain(via, nextAncestors)) return false;
                    hasKnownRoot = true;
                }
            } else if (via && typeof via === 'object') {
                if (isHigh(via)) {
                    if (name !== 'braces' || via.name !== 'braces' || via.url !== UNPATCHED_DEV_ADVISORY) return false;
                    hasKnownRoot = true;
                }
            } else {
                return false;
            }
        }
        if (hasKnownRoot) recognized.add(name);
        return hasKnownRoot;
    }

    const blocked = highNames.filter(name => !isKnownDevChain(name));
    return { ok: blocked.length === 0, blocked, exempted: [...recognized].sort() };
}

function main() {
    const root = path.resolve(__dirname, '..');
    const command = process.platform === 'win32' ? 'cmd.exe' : 'npm';
    const args = process.platform === 'win32'
        ? ['/d', '/s', '/c', 'npm', 'audit', '--json', '--audit-level=high']
        : ['audit', '--json', '--audit-level=high'];
    const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
    if (result.error || (result.status !== 0 && result.status !== 1)) {
        console.error('npm audit could not complete:', result.error || result.stderr || result.status);
        process.exitCode = 1;
        return;
    }

    let report;
    try {
        report = JSON.parse(result.stdout);
    } catch (error) {
        console.error('npm audit did not return valid JSON:', error.message);
        process.exitCode = 1;
        return;
    }

    let lock;
    try {
        lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    } catch (error) {
        console.error('Unable to read the dependency lockfile:', error.message);
        process.exitCode = 1;
        return;
    }

    const outcome = evaluateAudit(report, lock);
    console.log('npm audit severity summary:', JSON.stringify(report.metadata && report.metadata.vulnerabilities || {}));
    if (!outcome.ok) {
        console.error('Blocking high/critical dependency findings:', outcome.blocked.join(', '));
        process.exitCode = 1;
        return;
    }

    if (outcome.exempted.length > 0) {
        console.warn('Time-limited development-only advisory exception:', UNPATCHED_DEV_ADVISORY);
        console.warn('Affected dev dependency chain:', outcome.exempted.join(', '));
        console.warn('Exception expires:', EXCEPTION_END, '- unrelated high/critical advisories still fail.');
    } else {
        console.log('No high/critical dependency advisories found.');
    }
}

if (require.main === module) main();

module.exports = { evaluateAudit, UNPATCHED_DEV_ADVISORY, EXCEPTION_END };
