import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'

const repoRoot = path.resolve('.')
const logsDir = path.join(repoRoot, 'logs')
fs.mkdirSync(logsDir, { recursive: true })

function findBrowser() {
  const env = process.env.CHROME_PATH
  if (env && fs.existsSync(env)) return env
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ]
  return candidates.find((p) => fs.existsSync(p))
}

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

  const proc = spawn(nodeExe, ['scripts/lighthouse-audit.mjs'], {
    cwd: repoRoot,
    env: { ...process.env, ...env, ONLY: only },
    stdio: 'ignore',
  })

  return new Promise((resolve, reject) => {
    proc.on('error', reject)
    proc.on('exit', (code) => {
      if (code !== 0) return reject(new Error(`lighthouse exit code ${code}`))
      const out = newestLighthouseFile(before)
      if (!out) return reject(new Error('no lighthouse output file found'))
      const json = JSON.parse(fs.readFileSync(out, 'utf8'))
      resolve({ out, json })
    })
  })
}

const nodeExe = process.execPath
const browser = findBrowser()
if (!browser) throw new Error('No Chromium-based browser found. Set CHROME_PATH.')

const server = spawn(nodeExe, ['node_modules/http-server/bin/http-server', '-p', '4173', '-c-1', '.'], {
  cwd: repoRoot,
  env: { ...process.env, CHROME_PATH: browser },
  stdio: 'ignore',
})

try {
  await waitForHttp('http://127.0.0.1:4173/down/nav/index.html', 60_000)

  const env = { CHROME_PATH: browser }

  const nav = await runAudit(nodeExe, env, 'nav')
  const tdr = await runAudit(nodeExe, env, 'tdr')

  const navScore = nav.json.results?.[0]?.performanceScore
  const tdrScore = tdr.json.results?.[0]?.performanceScore

  if (typeof navScore !== 'number' || navScore < 0.9) {
    throw new Error(`nav performanceScore < 0.9: ${navScore} (${nav.out})`)
  }
  if (typeof tdrScore !== 'number' || tdrScore < 0.9) {
    throw new Error(`tdr performanceScore < 0.9: ${tdrScore} (${tdr.out})`)
  }

  process.stdout.write(`OK nav=${navScore} tdr=${tdrScore}\n`)
} finally {
  try {
    server.kill('SIGTERM')
  } catch {}
}
