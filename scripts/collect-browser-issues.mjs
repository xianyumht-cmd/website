import { chromium } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'
const pages = [
  { id: 'nav', url: `${baseUrl}/down/nav/index.html` },
  { id: 'tdr', url: `${baseUrl}/down/tdr/index.html` },
]

function nowIso() {
  return new Date().toISOString()
}

function normalizeUrl(u) {
  try {
    const url = new URL(u)
    url.hash = ''
    return url.toString()
  } catch {
    return u
  }
}

const outDir = path.resolve('logs')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `browser-issues-${Date.now()}.json`)

const issues = {
  createdAt: nowIso(),
  baseUrl,
  pages: [],
}

const browser = await chromium.launch()
try {
  const context = await browser.newContext()

  for (const p of pages) {
    const page = await context.newPage()

    const pageIssues = {
      id: p.id,
      url: p.url,
      startedAt: nowIso(),
      console: [],
      pageErrors: [],
      requestFailed: [],
      responses: [],
    }

    page.on('console', (msg) => {
      const entry = {
        ts: nowIso(),
        type: msg.type(),
        text: msg.text(),
        location: msg.location(),
      }
      pageIssues.console.push(entry)
    })

    page.on('pageerror', (err) => {
      pageIssues.pageErrors.push({
        ts: nowIso(),
        message: String(err?.message || err),
        stack: String(err?.stack || ''),
      })
    })

    page.on('requestfailed', (req) => {
      pageIssues.requestFailed.push({
        ts: nowIso(),
        url: normalizeUrl(req.url()),
        method: req.method(),
        resourceType: req.resourceType(),
        failure: req.failure(),
      })
    })

    page.on('response', async (res) => {
      try {
        const status = res.status()
        if (status >= 400) {
          pageIssues.responses.push({
            ts: nowIso(),
            url: normalizeUrl(res.url()),
            status,
          })
        }
      } catch {
      }
    })

    await page.goto(p.url, { waitUntil: 'load' })
    await page.waitForTimeout(1500)
    pageIssues.finishedAt = nowIso()

    await page.close()
    issues.pages.push(pageIssues)
  }

  fs.writeFileSync(outPath, JSON.stringify(issues, null, 2), 'utf8')
  process.stdout.write(`${outPath}\n`)
} finally {
  await browser.close()
}

