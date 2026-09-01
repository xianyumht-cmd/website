import { test, expect } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const canonical = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/assets/data/lol-version.json'), 'utf8'),
)

const englishMonths = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function expectedInfo(language: 'zh' | 'en') {
  const [year, month, day] = canonical.update.split('-').map(Number)
  const [nextYear, nextMonth, nextDay] = canonical.next.split('-').map(Number)

  return {
    version: canonical.version,
    updateDate: language === 'en'
      ? `${englishMonths[month - 1]} ${day}, ${year}`
      : `${year}年${month}月${day}日`,
    nextUpdateDate: language === 'en'
      ? `${englishMonths[nextMonth - 1]} ${nextDay}, ${nextYear}`
      : `${nextYear}年${nextMonth}月${nextDay}日`,
  }
}

async function readVersionState(page) {
  return page.evaluate(() => {
    const appWindow = window as any
    return {
      language: appWindow.currentNavLanguage,
      gameInfo: {
        version: appWindow.navData?.gameInfo?.version,
        updateDate: appWindow.navData?.gameInfo?.updateDate,
        nextUpdateDate: appWindow.navData?.gameInfo?.nextUpdateDate,
      },
      bulletin: document.getElementById('bulletin-content')?.textContent || '',
      visual: {
        version: document.getElementById('nav-visual-version')?.textContent || '',
        updateDate: document.getElementById('nav-visual-update')?.textContent || '',
        nextUpdateDate: document.getElementById('nav-visual-next')?.textContent || '',
      },
    }
  })
}

async function expectCanonicalVersion(page, language: 'zh' | 'en') {
  const expected = expectedInfo(language)

  await expect.poll(async () => (await readVersionState(page)).gameInfo).toEqual(expected)

  const state = await readVersionState(page)
  expect(state.language).toBe(language)
  expect(state.bulletin).toContain(expected.version)
  expect(state.bulletin).toContain(expected.updateDate)
  expect(state.bulletin).toContain(expected.nextUpdateDate)
  expect(state.visual).toEqual(expected)
}

test('NAV version data remains canonical through loading, language changes, and navDataUpdated', async ({ page, baseURL }) => {
  const versionRequests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('lol-version')) versionRequests.push(request.url())
  })

  await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#nav-visual-status-grid')
  await expectCanonicalVersion(page, 'zh')

  await page.locator('.fk_service_bx').click()
  await expectCanonicalVersion(page, 'en')

  await page.locator('.fk_service_bx').click()
  await expectCanonicalVersion(page, 'zh')

  for (let i = 0; i < 3; i += 1) {
    await page.locator('.fk_service_bx').click()
    await expectCanonicalVersion(page, i % 2 === 0 ? 'en' : 'zh')
  }

  await page.evaluate(() => {
    const appWindow = window as any
    const gameInfo = appWindow.navData?.gameInfo || {}
    const navData = {
      ...appWindow.navData,
      gameInfo: {
        ...gameInfo,
        version: '',
        updateDate: '',
        nextUpdateDate: '',
      },
    }

    for (let i = 0; i < 3; i += 1) {
      document.dispatchEvent(new CustomEvent('navDataUpdated', {
        detail: { language: 'en', navData },
      }))
    }
  })

  await expectCanonicalVersion(page, 'en')
  expect(versionRequests).toEqual([])
})
