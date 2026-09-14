import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const headersPath = path.resolve(__dirname, '../dist/_headers')

const requiredHeaders = [
  'X-Content-Type-Options: nosniff',
  'Referrer-Policy: strict-origin-when-cross-origin',
  'X-Frame-Options: SAMEORIGIN',
  'Permissions-Policy: camera=(), microphone=(), geolocation=()',
  "Content-Security-Policy: base-uri 'self'; object-src 'none'; frame-ancestors 'self'",
]

if (!fs.existsSync(headersPath)) {
  throw new Error(`Cloudflare Pages headers missing from build output: ${headersPath}`)
}

const headers = fs.readFileSync(headersPath, 'utf8')
const missing = requiredHeaders.filter((header) => !headers.includes(header))

if (missing.length > 0) {
  throw new Error(`Build output is missing required security headers: ${missing.join(', ')}`)
}

console.log('Verified Cloudflare Pages security headers in dist/_headers')
