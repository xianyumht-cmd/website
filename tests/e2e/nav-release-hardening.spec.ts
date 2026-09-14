import { test, expect } from '@playwright/test'

test('NAV exposes useful metadata and keyboard-accessible utility controls', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 1256, height: 920 })
  await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#content-sections .xe-widget')

  await expect(page).toHaveTitle('脚本.top 资源导航 - 工具与实用资源')
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /资源导航/)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow,max-image-preview:large')
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', '脚本.top 资源导航 - 工具与实用资源')

  const skipLink = page.locator('.nav-skip-link')
  await page.keyboard.press('Tab')
  await expect(skipLink).toBeFocused()
  await expect(skipLink).toBeVisible()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#main-content$/)

  await expect(page.locator('#search-text')).toHaveAttribute('aria-label', '搜索资源')
  await expect(page.locator('.fk_service button.fk_service_box')).toHaveCount(3)

  const languageButton = page.locator('.fk_service_bx')
  await languageButton.focus()
  await page.keyboard.press('Enter')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.locator('.nav-directory-head h1')).toHaveText('Resource directory')
  await expect(page.locator('#search-text')).toHaveAttribute('aria-label', 'Search resources')
  await expect(page).toHaveTitle('Script.top Resource Directory - Tools and Useful Resources')
  await expect(page.locator('meta[property="og:locale"]')).toHaveAttribute('content', 'en_US')
})

test('NAV search behaves like a real filter and can be cleared without losing focus', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#content-sections .xe-widget')

  const firstTitle = (await page.locator('#content-sections .xe-user-name strong').first().textContent())?.trim()
  expect(firstTitle).toBeTruthy()

  const input = page.locator('#search-text')
  await input.fill(firstTitle || '')

  const status = page.locator('#search-result-status')
  await expect(status).toHaveClass(/is-active/)
  await expect(status).toContainText(/找到 \d+ 个/)

  const clearButton = page.locator('#search-clear')
  await expect(clearButton).toBeVisible()
  await clearButton.click()
  await expect(input).toHaveValue('')
  await expect(input).toBeFocused()
  await expect(status).toContainText(/已收录 \d+ 个资源/)
})

test('NAV mobile controls meet touch sizing and keyboard drawer behavior without horizontal overflow', async ({ page, baseURL }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#main-menu li', { state: 'attached' })

  const themeButton = page.locator('.nav-mobile-theme-toggle')
  const menuToggle = page.locator('[data-toggle="mobile-menu"]')
  await expect(themeButton).toBeVisible()
  await expect(menuToggle).toBeVisible()

  const touchTargets = await page.evaluate(() => {
    const sizeOf = (selector: string) => {
      const element = document.querySelector(selector)
      if (!element) throw new Error(`Missing ${selector}`)
      const rect = element.getBoundingClientRect()
      return { width: rect.width, height: rect.height }
    }

    const overflowElements = Array.from(document.querySelectorAll('body *'))
      .map((element) => {
        const rect = element.getBoundingClientRect()
        return {
          selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''}`,
          left: Math.round(rect.left * 100) / 100,
          right: Math.round(rect.right * 100) / 100,
          width: Math.round(rect.width * 100) / 100,
        }
      })
      .filter((item) => item.left < -1 || item.right > window.innerWidth + 1)
      .sort((a, b) => b.right - a.right)
      .slice(0, 12)

    return {
      theme: sizeOf('.nav-mobile-theme-toggle'),
      menu: sizeOf('[data-toggle="mobile-menu"]'),
      scrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      overflowElements,
    }
  })

  expect(touchTargets.theme.width).toBeGreaterThanOrEqual(40)
  expect(touchTargets.theme.height).toBeGreaterThanOrEqual(40)
  expect(touchTargets.menu.width).toBeGreaterThanOrEqual(40)
  expect(touchTargets.menu.height).toBeGreaterThanOrEqual(40)
  expect(
    touchTargets.scrollWidth,
    `Horizontal overflow: ${JSON.stringify(touchTargets.overflowElements)}`,
  ).toBeLessThanOrEqual(touchTargets.viewportWidth + 1)

  const pageContainer = page.locator('.page-container')
  await expect(pageContainer).toHaveClass(/resource-sidebar-closed/)

  await menuToggle.focus()
  await page.keyboard.press('Enter')
  await expect(pageContainer).not.toHaveClass(/resource-sidebar-closed/)
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'true')

  await page.keyboard.press('Escape')
  await expect(pageContainer).toHaveClass(/resource-sidebar-closed/)
  await expect(menuToggle).toHaveAttribute('aria-expanded', 'false')
  await expect(menuToggle).toBeFocused()
})
