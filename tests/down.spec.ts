import { test, expect } from '@playwright/test'

async function assertNoIssues(page, url: string) {
  const issues: string[] = []

  page.on('pageerror', (err) => {
    issues.push(`pageerror: ${String(err?.message || err)}`)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      issues.push(`console.error: ${msg.text()}`)
    }
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

  await page.goto(url, { waitUntil: 'load' })
  await page.waitForTimeout(1500)

  expect(issues, `Issues found on ${url}`).toEqual([])
}

test('down/nav 控制台零报错且无 4xx/5xx', async ({ page, baseURL }) => {
  await assertNoIssues(page, `${baseURL}/down/nav/index.html`)
})

test('down/tdr 控制台零报错且无 4xx/5xx', async ({ page, baseURL }) => {
  await assertNoIssues(page, `${baseURL}/down/tdr/index.html`)
})

test('Nav category drawer is open by default, scrollable, and collapsible', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1256, height: 920 })
  await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#main-menu li')

  const desktopToggle = page.locator('.resource-sidebar-toggle')
  const menu = page.locator('#main-menu')

  await expect(desktopToggle).toBeVisible()
  await expect(desktopToggle).toHaveAttribute('aria-expanded', 'true')

  const desktopMenu = await menu.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }))
  expect(desktopMenu.scrollHeight).toBeGreaterThan(desktopMenu.clientHeight)
  expect(desktopMenu.overflowY).toBe('auto')

  await desktopToggle.click()
  await expect(page.locator('.page-container')).toHaveClass(/resource-sidebar-closed/)
  await expect(desktopToggle).toHaveAttribute('aria-expanded', 'false')

  await desktopToggle.click()
  await expect(page.locator('.page-container')).not.toHaveClass(/resource-sidebar-closed/)

  await page.setViewportSize({ width: 375, height: 667 })
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('#main-menu li')

  const mobileToggle = page.locator('[data-toggle="mobile-menu"]')
  await expect(mobileToggle).toBeVisible()
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true')

  const mobileMenu = await menu.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }))
  expect(mobileMenu.scrollHeight).toBeGreaterThan(mobileMenu.clientHeight)
  expect(mobileMenu.overflowY).toBe('auto')

  await mobileToggle.click()
  await expect(menu).toBeHidden()
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')
})

test('Nav and Games use the mobile resource shell at 810px', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 810, height: 900 })

  for (const path of ['/down/nav/index.html', '/down/games/index.html']) {
    await page.goto(`${baseURL}${path}`, { waitUntil: 'load' })
    await page.waitForSelector('#main-menu li')

    const shell = await page.locator('.page-container').evaluate((element) => ({
      display: getComputedStyle(element).display,
    }))
    const sidebar = await page.locator('.sidebar-menu').evaluate((element) => ({
      position: getComputedStyle(element).position,
      width: getComputedStyle(element).width,
    }))
    const mainContent = await page.locator('.main-content').evaluate((element) => ({
      marginLeft: getComputedStyle(element).marginLeft,
      width: getComputedStyle(element).width,
    }))

    expect(shell.display).toBe('block')
    expect(sidebar.position).toBe('relative')
    expect(parseFloat(sidebar.width)).toBeGreaterThan(780)
    expect(mainContent.marginLeft).toBe('0px')
    expect(parseFloat(mainContent.width)).toBeGreaterThan(760)

    const desktopToggle = page.locator('.resource-sidebar-toggle')
    const mobileToggle = page.locator('[data-toggle="mobile-menu"]')
    const menu = page.locator('#main-menu')

    await expect(desktopToggle).toBeHidden()
    await expect(mobileToggle).toBeVisible()
    await mobileToggle.click()
    await expect(menu).toBeHidden()
  }
})

