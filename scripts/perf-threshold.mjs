import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { chromium } from '@playwright/test'

const repoRoot = path.resolve('.')
const logsDir = path.join(repoRoot, 'logs')
const RUN_COUNT = 1
const SCORE_THRESHOLD = 0.9
const CLS_THRESHOLD = 0.1
fs.mkdirSync(logsDir, { recursive: true })

function findBrowser() {
  const env = process.env.CHROME_PATH
  if (env && fs.existsSync(env)) return env

  const candidates = [
    chromium.executablePath(),
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  ]

  return candidates.find((candidate) => candidate && fs.existsSync(candidate))
}

function waitForHttp(url, timeoutMs) {
  const start = Date.now()
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.get(url, (res) => {
        res.resume()
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 400) return resolve()
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

function newestLighthouseFile(beforeSet) {
  const files = fs
    .readdirSync(logsDir)
    .filter((n) => n.startsWith('lighthouse-') && n.endsWith('.json'))
    .map((n) => path.join(logsDir, n))
    .filter((p) => !beforeSet.has(p))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
  return files[0] || null
}

function runAudit(nodeExe, env, only) {
  const before = new Set(
    fs
      .readdirSync(logsDir)
      .filter((n) => n.startsWith('lighthouse-') && n.endsWith('.json'))
      .map((n) => path.join(logsDir, n))
  )

  const output = []
  const proc = spawn(nodeExe, ['scripts/lighthouse-audit.mjs'], {
    cwd: repoRoot,
    env: { ...process.env, ...env, ONLY: only },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  proc.stdout.on('data', (chunk) => output.push(chunk.toString()))
  proc.stderr.on('data', (chunk) => output.push(chunk.toString()))

  return new Promise((resolve, reject) => {
    proc.on('error', reject)
    proc.on('exit', (code) => {
      const detail = output.join('')
      if (code !== 0) {
        return reject(new Error(`lighthouse exit code ${code}${detail.trim() ? `\n${detail.trim()}` : ''}`))
      }
      const out = newestLighthouseFile(before)
      if (!out) return reject(new Error('no lighthouse output file found'))
      const json = JSON.parse(fs.readFileSync(out, 'utf8'))
      resolve({ out, json, detail })
    })
  })
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 1
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2
}

async function runTarget(nodeExe, env, target) {
  const runs = []

  for (let run = 1; run <= RUN_COUNT; run += 1) {
    const audit = await runAudit(nodeExe, env, target)
    const result = audit.json.results?.[0]
    const score = result?.performanceScore
    const cls = result?.metrics?.cls

    for (const line of audit.detail.split(/\r?\n/)) {
      if (line.startsWith('CLS_DIAG')) process.stdout.write(`${line}\n`)
    }

    if (typeof score !== 'number' || typeof cls !== 'number') {
      throw new Error(`${target} run ${run} returned invalid Lighthouse metrics (${audit.out})`)
    }

    runs.push({ run, score, cls, out: audit.out })
    process.stdout.write(`${target} run ${run}/${RUN_COUNT}: score=${score.toFixed(2)} cls=${cls.toFixed(4)}\n`)
  }

  const medianScore = median(runs.map((entry) => entry.score))
  const maxCls = Math.max(...runs.map((entry) => entry.cls))
  const scores = runs.map((entry) => entry.score.toFixed(2)).join(', ')
  const clsValues = runs.map((entry) => entry.cls.toFixed(4)).join(', ')

  process.stdout.write(
    `${target} summary: median=${medianScore.toFixed(2)} maxCls=${maxCls.toFixed(4)} scores=[${scores}] cls=[${clsValues}]\n`
  )

  if (medianScore < SCORE_THRESHOLD) {
    throw new Error(
      `${target} median performanceScore < ${SCORE_THRESHOLD}: ${medianScore} (${runs.map((entry) => entry.out).join(', ')})`
    )
  }

  if (maxCls > CLS_THRESHOLD) {
    throw new Error(
      `${target} CLS > ${CLS_THRESHOLD}: ${maxCls} (${runs.map((entry) => entry.out).join(', ')})`
    )
  }

  return { medianScore, maxCls }
}

const nodeExe = process.execPath
const browser = findBrowser()
if (!browser) throw new Error('No Chromium-based browser found. Install Playwright Chromium or set CHROME_PATH.')

const distDir = path.join(repoRoot, 'dist')
if (!fs.existsSync(path.join(distDir, 'down', 'nav', 'index.html'))) {
  throw new Error('dist/down/nav/index.html not found. Run npm run build before performance tests.')
}

const server = spawn(nodeExe, ['node_modules/http-server/bin/http-server', '-p', '4173', '-c-1', distDir], {
  cwd: repoRoot,
  env: { ...process.env, CHROME_PATH: browser },
  stdio: 'ignore',
})

try {
  await waitForHttp('http://127.0.0.1:4173/down/nav/index.html', 60_000)

  const env = { CHROME_PATH: browser }
  const nav = await runTarget(nodeExe, env, 'nav')
  const tdr = await runTarget(nodeExe, env, 'tdr')

  process.stdout.write(
    `OK nav median=${nav.medianScore.toFixed(2)} maxCls=${nav.maxCls.toFixed(4)} ` +
      `tdr median=${tdr.medianScore.toFixed(2)} maxCls=${tdr.maxCls.toFixed(4)}\n`
  )
} finally {
  try {
    server.kill('SIGTERM')
  } catch {}
}
