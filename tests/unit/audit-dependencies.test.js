const { evaluateAudit, UNPATCHED_DEV_ADVISORY } = require('../../scripts/audit-dependencies');

function scenario({ advisory = UNPATCHED_DEV_ADVISORY, dev = true } = {}) {
    return {
        report: {
            vulnerabilities: {
                braces: {
                    severity: 'high',
                    nodes: ['node_modules/braces'],
                    via: [{ name: 'braces', severity: 'high', url: advisory }]
                },
                micromatch: {
                    severity: 'high',
                    nodes: ['node_modules/micromatch'],
                    via: ['braces']
                },
                stylelint: {
                    severity: 'high',
                    nodes: ['node_modules/stylelint'],
                    via: ['micromatch']
                }
            }
        },
        lock: {
            packages: {
                'node_modules/braces': { dev },
                'node_modules/micromatch': { dev },
                'node_modules/stylelint': { dev }
            }
        }
    };
}

describe('dependency audit exception boundary', () => {
    test('accepts only the documented unpatched development-only advisory', () => {
        const { report, lock } = scenario();
        const result = evaluateAudit(report, lock, new Date('2026-10-09T00:00:00Z'));
        expect(result.ok).toBe(true);
        expect(result.exempted).toEqual(['braces', 'micromatch', 'stylelint']);
    });

    test('blocks any production dependency exposure', () => {
        const { report, lock } = scenario({ dev: false });
        expect(evaluateAudit(report, lock, new Date('2026-10-09T00:00:00Z')).ok).toBe(false);
    });

    test('blocks a high-severity advisory not explicitly allowed', () => {
        const { report, lock } = scenario({ advisory: 'https://github.com/advisories/GHSA-other' });
        expect(evaluateAudit(report, lock, new Date('2026-10-09T00:00:00Z')).blocked).toContain('braces');
    });

    test('blocks any additional unrelated high-severity finding', () => {
        const { report, lock } = scenario();
        report.vulnerabilities.other = {
            severity: 'high',
            nodes: ['node_modules/other'],
            via: [{ name: 'other', severity: 'high', url: 'https://github.com/advisories/GHSA-other' }]
        };
        lock.packages['node_modules/other'] = { dev: true };
        expect(evaluateAudit(report, lock, new Date('2026-10-09T00:00:00Z')).blocked).toContain('other');
    });

    test('fails after the security exception expires', () => {
        const { report, lock } = scenario();
        expect(evaluateAudit(report, lock, new Date('2026-12-01T00:00:00Z')).ok).toBe(false);
    });

    test('fails on malformed audit data and allows a clean audit', () => {
        const { lock } = scenario();
        expect(evaluateAudit({ error: { code: 'ENOTFOUND' } }, lock).ok).toBe(false);
        expect(evaluateAudit({ vulnerabilities: {} }, lock).ok).toBe(true);
    });
});
