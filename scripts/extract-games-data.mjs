import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sourcePath = path.resolve(__dirname, '../src/pages/games/games-data.js')
const outputPath = path.resolve(__dirname, '../public/data/games-data.json')

function extractObjectLiteral(content) {
  const startToken = 'const gamesDataTranslations ='
  const endToken = 'const navData ='
  const startIndex = content.indexOf(startToken)
  const endIndex = content.indexOf(endToken)
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error('Unable to locate gamesDataTranslations block')
  }
  const objectLiteral = content
    .slice(startIndex + startToken.length, endIndex)
    .trim()
    .replace(/;$/, '')
  return objectLiteral
}

function main() {
  const source = fs.readFileSync(sourcePath, 'utf8')
  const objectLiteral = extractObjectLiteral(source)
  const gamesDataTranslations = new Function(`return (${objectLiteral})`)()
  fs.mkdirSync(path.dirname(outputPath), { recursive: true })
  fs.writeFileSync(outputPath, JSON.stringify(gamesDataTranslations, null, 2))
  console.log(`Generated ${outputPath}`)
}

main()
