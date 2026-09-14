const fs = require('fs')
const path = require('path')

const repoRoot = path.resolve(__dirname, '../..')

function readRepoFile(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8')
}

describe('static security policy', () => {
  test('Cloudflare Pages headers include the required baseline protections', () => {
    const headers = readRepoFile('public/_headers')

    expect(headers).toMatch(/\/\*\s*[\s\S]*X-Content-Type-Options:\s*nosniff/i)
    expect(headers).toMatch(/Referrer-Policy:\s*strict-origin-when-cross-origin/i)
    expect(headers).toMatch(/X-Frame-Options:\s*SAMEORIGIN/i)
    expect(headers).toMatch(/Permissions-Policy:\s*camera=\(\), microphone=\(\), geolocation=\(\)/i)
    expect(headers).toMatch(/Content-Security-Policy:\s*base-uri 'self'; object-src 'none'; frame-ancestors 'self'/i)
  })

  test('security documentation describes the current static-site model', () => {
    const securityDoc = readRepoFile('SECURITY.md')

    expect(securityDoc).toMatch(/static Vite site/i)
    expect(securityDoc).toMatch(/public\/_headers/)
    expect(securityDoc).toMatch(/must be treated as public/i)
    expect(securityDoc).not.toMatch(/AES-256-GCM/i)
    expect(securityDoc).not.toMatch(/encrypt-assets\.mjs/i)
    expect(securityDoc).not.toMatch(/security-loader\.js/i)
    expect(securityDoc).not.toMatch(/Debugger Trap/i)
  })
})
