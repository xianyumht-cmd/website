import { test, expect } from '@playwright/test'

test('daily and weekly NAV cards reflect approved resources after language switching', async ({ page, baseURL }) => {
  await page.goto(`${baseURL}/down/nav/index.html`, { waitUntil: 'load' })
  await page.waitForSelector('#content-sections .box2')

  const expectCards = async () => {
    for (const name of ['HE B', 'EX', 'OFF', '乡里别', 'jinX', 'LX', 'LK', 'app']) {
      await expect(page.locator(`#content-sections .box2[aria-label^="${name}："]`)).toHaveCount(1)
    }

    await expect(page.locator('[id="周卡专区"] .box2[aria-label^="LEI："]')).toHaveCount(1)
    await expect(page.locator('[id="月卡专区"] .box2[aria-label^="LEI："]')).toHaveCount(1)

    for (const name of ['LSC', 'VK', 'DC', '龙珠', 'TSL', '时光', 'Time', 'TAB', 'TEST', 'FJ', 'viperlite']) {
      await expect(page.locator(`#content-sections .box2[aria-label^="${name}："]`)).toHaveCount(0)
    }
  }

  await expectCards()
  await page.locator('.fk_service_bx').click()
  await expect(page.locator('.nav-directory-head h1')).toHaveText('Resource directory')
  await expectCards()
})
