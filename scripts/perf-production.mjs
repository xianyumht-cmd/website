import fs from 'node:fs'
import { chromium } from '@playwright/test'

const origin = (process.env.PRODUCTION_BASE_URL || 'https://xn--8pv109c.top').replace(/\/+$/, '')
process.env.BASE_URL = origin
process.env.ONLY = process.env.ONLY || 'home,nav,games'

if (!process.env.CHROME_PATH) {
  const playwrightChromium = chromium.executablePath()
  if (playwrightChromium && fs.existsSync(playwrightChromium)) {
    process.env.CHROME_PATH = playwrightChromium
  }
}

process.stdout.write(`Production performance audit: ${origin}\n`)
await import('./lighthouse-audit.mjs')
