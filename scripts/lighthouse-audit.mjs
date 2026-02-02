import fs from 'node:fs'
import path from 'node:path'
import lighthouse from 'lighthouse'
import chromeLauncher from 'chrome-launcher'

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'
const urls = [
  { id: 'nav', url: `${baseUrl}/down/nav/index.html` },
  { id: 'tdr', url: `${baseUrl}/down/tdr/index.html` },
]

const only = (process.env.ONLY || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

const targets = only.length ? urls.filter((u) => only.includes(u.id)) : urls

const chromePath =
  process.env.CHROME_PATH ||
  [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ].find((p) => {
    try {
      return fs.existsSync(p)
    } catch {
      return false
    }
  })

if (!chromePath) {
  throw new Error('No Chromium-based browser found. Set CHROME_PATH.')
}

const outDir = path.resolve('logs')
fs.mkdirSync(outDir, { recursive: true })
const outPath = path.join(outDir, `lighthouse-${Date.now()}.json`)
const debugPath = path.join(outDir, 'lighthouse-debug.log')

fs.appendFileSync(debugPath, `start ${new Date().toISOString()}\n`, 'utf8')

function pickList(audit) {
  const items = audit?.details?.items
  if (!Array.isArray(items)) return []
  return items.slice(0, 20)
}

function metric(audits, id) {
  return audits?.[id]?.numericValue ?? null
}

const results = []

for (const entry of targets) {
  fs.appendFileSync(debugPath, `launch ${chromePath}\n`, 'utf8')
  const chrome = await chromeLauncher.launch({
    chromePath,
    chromeFlags: ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check'],
  })

  try {
    fs.appendFileSync(debugPath, `run ${entry.id} ${entry.url}\n`, 'utf8')
    const runnerResult = await Promise.race([
      lighthouse(entry.url, {
        port: chrome.port,
        output: 'json',
        onlyCategories: ['performance'],
        logLevel: 'error',
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Lighthouse timeout')), 180000)),
    ])
    fs.appendFileSync(debugPath, `done ${entry.id}\n`, 'utf8')

    const audits = runnerResult?.lhr?.audits || {}
    const perf = runnerResult?.lhr?.categories?.performance?.score ?? null

    results.push({
      id: entry.id,
      url: entry.url,
      performanceScore: perf,
      metrics: {
        fcp: metric(audits, 'first-contentful-paint'),
        lcp: metric(audits, 'largest-contentful-paint'),
        tbt: metric(audits, 'total-blocking-time'),
        cls: metric(audits, 'cumulative-layout-shift'),
        si: metric(audits, 'speed-index'),
      },
      renderBlockingResources: pickList(audits['render-blocking-resources']).map((i) => ({
        url: i.url,
        totalBlockingTime: i.totalBlockingTime,
      })),
      unusedCss: pickList(audits['unused-css-rules']).map((i) => ({
        url: i.url,
        wastedBytes: i.wastedBytes,
      })),
      unusedJs: pickList(audits['unused-javascript']).map((i) => ({
        url: i.url,
        wastedBytes: i.wastedBytes,
      })),
    })
  } finally {
    try {
      await chrome.kill()
    } catch {}
    fs.appendFileSync(debugPath, `killed ${entry.id}\n`, 'utf8')
  }
}

const payload = {
  createdAt: new Date().toISOString(),
  chromePath,
  results,
}

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8')
process.stdout.write(`${outPath}\n`)
