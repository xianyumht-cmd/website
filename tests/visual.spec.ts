import { test, expect } from '@playwright/test'

const viewports = [
  { name: 'mobile-375x667', width: 375, height: 667 },
  { name: 'tablet-768x1024', width: 768, height: 1024 },
  { name: 'desktop-1920x1080', width: 1920, height: 1080 },
]

async function stabilizeNav(page) {
  await page.waitForSelector('#content-sections .xe-widget', { timeout: 20_000 })
  await page.evaluate(() => {
    const root = document.documentElement
    root.style.scrollBehavior = 'auto'
    const ids = ['time', 'online_user', 'sitetime']
    ids.forEach((id) => {
      const el = document.getElementById(id)
      if (el) el.textContent = ''
    })
    const box = document.querySelector('.box')
    if (box) box.textContent = ''
    const intervals = (window as any).__intervals
    if (Array.isArray(intervals)) intervals.forEach((id) => clearInterval(id))
    ;(window as any).__intervals = []
  })
  await page.addStyleTag({
    content:
      '*{transition:none!important;animation:none!important} .box{display:none!important} #time{display:none!important} #online_user{display:none!important} #sitetime{display:none!important}',
  })
  await page.evaluate(() => {
    const el = document.getElementById('常用工具')
    if (el) el.scrollIntoView({ block: 'start' })
  })
  await page.waitForTimeout(200)
}

async function stabilizeTdr(page) {
  await page.waitForSelector('#canvas', { timeout: 20_000 })
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' })
}

for (const vp of viewports) {
  test(`视觉回归：nav ${vp.name}`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.addInitScript(() => {
      const _setInterval = window.setInterval
      ;(window as any).__intervals = []
      window.setInterval = function (fn, t) {
        const id = _setInterval(fn, t)
        ;(window as any).__intervals.push(id)
        return id
      }
    })

    await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
    await stabilizeNav(page)
    await expect(page).toHaveScreenshot(`nav-${vp.name}.png`, { fullPage: true, maxDiffPixelRatio: 0.002 })
  })

  test(`视觉回归：tdr ${vp.name}`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.goto(`${baseURL}/down/tdr/index.html`, { waitUntil: 'load' })
    await stabilizeTdr(page)
    await expect(page).toHaveScreenshot(`tdr-${vp.name}.png`, { fullPage: true, maxDiffPixelRatio: 0.002 })
  })
}
