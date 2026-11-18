const { evaluateAudit, UNPATCHED_DEV_ADVISORY, PICOMATCH_DEV_ADVISORY } = require('../../scripts/audit-dependencies');

function scenario({ root = 'braces', advisory = UNPATCHED_DEV_ADVISORY, dev = true } = {}) {
    return {
        report: {
            vulnerabilities: {
                [root]: {
                    severity: 'high',
                    nodes: ['node_modules/' + root],
                    via: [{ name: root, severity: 'high', url: advisory }]
                },
                micromatch: {
                    severity: 'high',
                    nodes: ['node_modules/micromatch'],
                    via: [root]
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
                ['node_modules/' + root]: { dev },
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

    test('accepts the approved picomatch advisory only through the development chain and deadline', () => {
        const { report, lock } = scenario({ root: 'picomatch', advisory: PICOMATCH_DEV_ADVISORY });
        const active = new Date('2026-11-30T15:59:59Z');
        const result = evaluateAudit(report, lock, active);
        expect(result.ok).toBe(true);
        expect(result.exempted).toEqual(['micromatch', 'picomatch', 'stylelint']);
        expect(evaluateAudit(report, lock, new Date('2026-11-30T16:00:00Z')).ok).toBe(false);

        lock.packages['node_modules/micromatch'].dev = false;
        expect(evaluateAudit(report, lock, active).blocked).toContain('micromatch');
    });

    test('blocks picomatch exposure in production or a severity increase', () => {
        const { report, lock } = scenario({ root: 'picomatch', advisory: PICOMATCH_DEV_ADVISORY, dev: false });
        const active = new Date('2026-11-18T00:00:00Z');
        expect(evaluateAudit(report, lock, active).blocked).toContain('picomatch');

        lock.packages['node_modules/picomatch'].dev = true;
        report.vulnerabilities.picomatch.severity = 'critical';
        report.vulnerabilities.picomatch.via[0].severity = 'critical';
        expect(evaluateAudit(report, lock, active).blocked).toContain('picomatch');
    });

    test('fails on malformed audit data and allows a clean audit', () => {
        const { lock } = scenario();
        expect(evaluateAudit({ error: { code: 'ENOTFOUND' } }, lock).ok).toBe(false);
        expect(evaluateAudit({ vulnerabilities: {} }, lock).ok).toBe(true);
    });
});
