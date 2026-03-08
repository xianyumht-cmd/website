import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync, brotliCompressSync, constants as zlibConstants } from 'node:zlib'
import { minify as minifyHtml } from 'html-minifier-terser'
import CleanCSS from 'clean-css'
import { minify as minifyJs } from 'terser'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.resolve(__dirname, '../dist')
const textExtensions = new Set(['.js', '.css', '.html'])
const imageExtensions = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp', '.avif'])

function walk(dir) {
  const result = []
  if (!fs.existsSync(dir)) return result
  for (const name of fs.readdirSync(dir)) {
    const filePath = path.join(dir, name)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      result.push(...walk(filePath))
    } else {
      result.push(filePath)
    }
  }
  return result
}

async function minifyByType(filePath, content) {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.js') {
    const output = await minifyJs(content, {
      compress: { drop_console: true, drop_debugger: true },
      mangle: true,
      format: { comments: false }
    })
    return output.code || content
  }
  if (ext === '.css') {
    const output = new CleanCSS({ level: 2 }).minify(content)
    return output.styles || content
  }
  if (ext === '.html') {
    return minifyHtml(content, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
      removeRedundantAttributes: true,
      removeEmptyAttributes: true,
      useShortDoctype: true
    })
  }
  return content
}

function writeCompressedVariants(filePath, contentBuffer) {
  const gz = gzipSync(contentBuffer, { level: 9 })
  const br = brotliCompressSync(contentBuffer, {
    params: {
      [zlibConstants.BROTLI_PARAM_QUALITY]: 11
    }
  })
  fs.writeFileSync(`${filePath}.gz`, gz)
  fs.writeFileSync(`${filePath}.br`, br)
  return { gzSize: gz.byteLength, brSize: br.byteLength }
}

async function run() {
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found: ${distDir}`)
  }

  const files = walk(distDir)
  const report = {
    generatedAt: new Date().toISOString(),
    totals: {
      js: { raw: 0, gzip: 0, brotli: 0, count: 0 },
      css: { raw: 0, gzip: 0, brotli: 0, count: 0 },
      html: { raw: 0, gzip: 0, brotli: 0, count: 0 },
      images: { raw: 0, count: 0 }
    },
    largestFiles: [],
    warnings: []
  }

  for (const filePath of files) {
    if (filePath.endsWith('.gz') || filePath.endsWith('.br')) continue
    const ext = path.extname(filePath).toLowerCase()
    if (imageExtensions.has(ext)) {
      const size = fs.statSync(filePath).size
      report.totals.images.raw += size
      report.totals.images.count += 1
      continue
    }
    if (!textExtensions.has(ext)) continue

    const original = fs.readFileSync(filePath, 'utf8')
    const minified = await minifyByType(filePath, original)
    const finalContent = minified.length <= original.length ? minified : original
    fs.writeFileSync(filePath, finalContent, 'utf8')
    const rawBuffer = Buffer.from(finalContent, 'utf8')
    const { gzSize, brSize } = writeCompressedVariants(filePath, rawBuffer)

    const typeKey = ext.slice(1)
    report.totals[typeKey].raw += rawBuffer.byteLength
    report.totals[typeKey].gzip += gzSize
    report.totals[typeKey].brotli += brSize
    report.totals[typeKey].count += 1

    report.largestFiles.push({
      file: path.relative(distDir, filePath).replace(/\\/g, '/'),
      raw: rawBuffer.byteLength,
      gzip: gzSize,
      brotli: brSize
    })
  }

  report.largestFiles.sort((a, b) => b.raw - a.raw)
  report.largestFiles = report.largestFiles.slice(0, 20)
  report.warnings = report.largestFiles
    .filter((item) => item.raw > 150 * 1024)
    .map((item) => `Large asset: ${item.file} (${(item.raw / 1024).toFixed(1)} KB)`)

  const reportPath = path.join(distDir, 'build-size-report.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8')

  console.log('Post-build optimization complete')
  console.log(`Report: ${reportPath}`)
  if (report.warnings.length > 0) {
    for (const warning of report.warnings) {
      console.warn(warning)
    }
  }
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})
