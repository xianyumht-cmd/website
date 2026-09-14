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

test('Nav category drawer is open on desktop, collapsed on mobile, and remains usable', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1256, height: 920 })
  await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#main-menu li')

  const pageContainer = page.locator('.page-container')
  const sidebar = page.locator('.sidebar-menu')
  const desktopToggle = page.locator('.resource-sidebar-toggle')
  const menu = page.locator('#main-menu')

  await expect(desktopToggle).toBeVisible()
  await expect(desktopToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)

  const desktopMenu = await menu.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    overflowY: getComputedStyle(element).overflowY,
  }))
  expect(desktopMenu.scrollHeight).toBeGreaterThan(desktopMenu.clientHeight)
  expect(desktopMenu.overflowY).toBe('auto')

  const desktopVisualOwnership = await page.evaluate(() => {
    const sidebarElement = document.querySelector('.sidebar-menu')
    const firstMenuLink = document.querySelector('#main-menu > li > a')
    const logo = document.querySelector('.logo-env')
    if (!sidebarElement || !firstMenuLink || !logo) throw new Error('Resource sidebar shell is incomplete')

    const sidebarStyle = getComputedStyle(sidebarElement)
    const linkStyle = getComputedStyle(firstMenuLink)
    const logoStyle = getComputedStyle(logo)

    return {
      sidebarBoxShadow: sidebarStyle.boxShadow,
      sidebarBackdropFilter: sidebarStyle.backdropFilter,
      linkBorderRadius: linkStyle.borderRadius,
      linkMarginLeft: linkStyle.marginLeft,
      linkFontSize: linkStyle.fontSize,
      logoMinHeight: logoStyle.minHeight,
    }
  })
  expect(desktopVisualOwnership.sidebarBoxShadow).toBe('none')
  expect(desktopVisualOwnership.sidebarBackdropFilter).toBe('none')
  expect(desktopVisualOwnership.linkBorderRadius).toBe('0px')
  expect(desktopVisualOwnership.linkMarginLeft).toBe('0px')
  expect(desktopVisualOwnership.linkFontSize).toBe('13px')
  expect(desktopVisualOwnership.logoMinHeight).toBe('96px')

  await desktopToggle.click()
  await expect(pageContainer).toHaveClass(/resource-sidebar-closed/)
  await expect(desktopToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)

  await desktopToggle.click()
  await expect(pageContainer).not.toHaveClass(/resource-sidebar-closed/)
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)

  await page.setViewportSize({ width: 375, height: 667 })
  await page.reload({ waitUntil: 'load' })
  await page.waitForSelector('#main-menu li', { state: 'attached' })

  const mobileToggle = page.locator('[data-toggle="mobile-menu"]')
  await expect(mobileToggle).toBeVisible()
  await expect(pageContainer).toHaveClass(/resource-sidebar-closed/)
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)
  await expect(menu).toBeHidden()

  await mobileToggle.click()
  await expect(pageContainer).not.toHaveClass(/resource-sidebar-closed/)
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)
  await expect(menu).toBeVisible()

  const mobileMenu = await menu.evaluate((element) => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
    display: getComputedStyle(element).display,
    overflowX: getComputedStyle(element).overflowX,
    overflowY: getComputedStyle(element).overflowY,
  }))
  expect(mobileMenu.scrollHeight).toBeGreaterThan(mobileMenu.clientHeight)
  expect(mobileMenu.display).toBe('block')
  expect(mobileMenu.overflowX).toBe('hidden')
  expect(mobileMenu.overflowY).toBe('auto')

  await mobileToggle.click()
  await expect(menu).toBeHidden()
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)
})

test('Games category drawer uses the shared vertical mobile layout', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto(`${baseURL}/down/games/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#main-menu li', { state: 'attached' })

  const pageContainer = page.locator('.page-container')
  const sidebar = page.locator('.sidebar-menu')
  const mobileToggle = page.locator('[data-toggle="mobile-menu"]')
  const menu = page.locator('#main-menu')

  await expect(mobileToggle).toBeVisible()
  await expect(pageContainer).toHaveClass(/resource-sidebar-closed/)
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)
  await expect(menu).toBeHidden()

  await mobileToggle.click()
  await expect(pageContainer).not.toHaveClass(/resource-sidebar-closed/)
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'true')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)
  await expect(menu).toBeVisible()

  const mobileMenu = await menu.evaluate((element) => ({
    display: getComputedStyle(element).display,
    overflowX: getComputedStyle(element).overflowX,
    overflowY: getComputedStyle(element).overflowY,
  }))
  expect(mobileMenu.display).toBe('block')
  expect(mobileMenu.overflowX).toBe('hidden')
  expect(mobileMenu.overflowY).toBe('auto')

  await mobileToggle.click()
  await expect(menu).toBeHidden()
  await expect(mobileToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(sidebar).not.toHaveClass(/(?:^|\s)collapsed(?:\s|$)/)
})
