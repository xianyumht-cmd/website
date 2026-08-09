import { test, expect } from '@playwright/test'

test('homepage business entries keep native anchor navigation', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/`, { waitUntil: 'load' })

  for (const id of ['qunliao1', 'qunliao3']) {
    const link = page.locator(`#${id}`)
    await expect(link).toHaveAttribute('href', /^https?:\/\//)
    await expect(link).toHaveAttribute('target', '_blank')

    const wasPreventedBeforeWindow = await page.evaluate((linkId) => new Promise<boolean>((resolve) => {
      const originalOpen = window.open
      window.open = () => null

      window.addEventListener('click', (event) => {
        const alreadyPrevented = event.defaultPrevented
        event.preventDefault()
        window.open = originalOpen
        resolve(alreadyPrevented)
      }, { once: true })

      document.getElementById(linkId)?.click()
    }), id)

    expect(wasPreventedBeforeWindow).toBe(false)
  }
})
