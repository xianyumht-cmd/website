import { chromium } from 'playwright'
import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'

const repoRoot = path.resolve('.')
const logsDir = path.join(repoRoot, 'logs', 'layout')
fs.mkdirSync(logsDir, { recursive: true })

const label = process.argv.includes('--label')
  ? process.argv[process.argv.indexOf('--label') + 1]
  : 'capture'

function waitForHttp(url, timeoutMs) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode < 500) return resolve()
        if (Date.now() - start > timeoutMs) return reject(new Error('server timeout'))
        setTimeout(tick, 250)
      })
      req.on('error', () => {
        if (Date.now() - start > timeoutMs) return reject(new Error('server timeout'))
        setTimeout(tick, 250)
      })
    }
    tick()
  })
}

async function runCase(name, viewport) {
  const browser = await chromium.launch()
  const context = await browser.newContext({ viewport })
  const page = await context.newPage()

  const issues = []
  page.on('pageerror', (err) => issues.push(`pageerror: ${String(err?.message || err)}`))
  page.on('console', (msg) => {
    if (msg.type() === 'error') issues.push(`console.error: ${msg.text()}`)
  })
  page.on('requestfailed', (req) => {
    const f = req.failure()
    issues.push(`requestfailed: ${req.method()} ${req.url()} ${f ? f.errorText : ''}`.trim())
  })
  page.on('response', (res) => {
    try {
      const s = res.status()
      if (s >= 400) issues.push(`http${s}: ${res.url()}`)
    } catch {}
  })

  const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4173'
  await page.goto(`${baseUrl}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForTimeout(1800)

  await page.evaluate(() => {
    const el = document.getElementById('常用工具')
    if (el) el.scrollIntoView({ block: 'start' })
  })
  await page.waitForTimeout(300)

  const screenshotPath = path.join(logsDir, `nav-${label}-${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })

  const clickTarget = page.locator('.xe-widget:has-text("问题反馈")').first()
  const popupPromise = page.waitForEvent('popup', { timeout: 5000 }).catch(() => null)
  await clickTarget.scrollIntoViewIfNeeded()
  await clickTarget.click({ timeout: 5000 })
  const popup = await popupPromise
  if (popup) await popup.close().catch(() => {})

  await browser.close()

  if (issues.length) {
    const issuePath = path.join(logsDir, `nav-${label}-${name}.issues.txt`)
    fs.writeFileSync(issuePath, issues.join('\n') + '\n', 'utf8')
  }

  return { screenshotPath, issuesCount: issues.length }
}

const nodeExe = process.execPath
const server = spawn(nodeExe, ['node_modules/http-server/bin/http-server', '-p', '4173', '-c-1', '.'], {
  cwd: repoRoot,
  stdio: 'ignore',
})

try {
  await waitForHttp('http://127.0.0.1:4173/down/nav/index.html', 60_000)
  const desktop = await runCase('desktop', { width: 1280, height: 720 })
  const mobile = await runCase('mobile', { width: 390, height: 844 })
  process.stdout.write(`${desktop.screenshotPath}\n${mobile.screenshotPath}\n`)
} finally {
  try {
    server.kill('SIGTERM')
  } catch {}
}

