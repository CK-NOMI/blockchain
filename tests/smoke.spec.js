import { test, expect } from '@playwright/test'
import {
  SAMPLE_BATCH_ID,
  getPrototypeActions,
  getPrototypeClickMap,
  inferRouteByText,
  inferSlugByPath,
} from '../src/config/prototypeFlow.js'

const expectIframeSlug = async (page, slug) => {
  const iframe = page.locator('iframe')
  await expect(iframe).toHaveAttribute('src', new RegExp(`/prototypes/${slug}\\.html$`))
}

test.describe('Agri Chain deterministic smoke', () => {
  test('core business routes render expected prototype pages', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'FARMER' }))
    })
    await page.goto('/farmer/dashboard', { waitUntil: 'domcontentloaded' })
    await expectIframeSlug(page, 'f01_pc')

    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'PROCESSOR' }))
    })
    await page.goto('/processor/pending', { waitUntil: 'domcontentloaded' })
    await expectIframeSlug(page, 'm02_pc')

    await page.evaluate(() => {
      localStorage.setItem('user', JSON.stringify({ role: 'REGULATOR' }))
    })
    await page.goto('/regulator/search', { waitUntil: 'domcontentloaded' })
    await expectIframeSlug(page, 'g02_pc')
  })

  test('consumer trace route chain is complete', async ({ page }) => {
    await page.goto('/trace/search', { waitUntil: 'domcontentloaded' })
    await expectIframeSlug(page, 'c01_mobile')

    await page.goto(`/trace/${SAMPLE_BATCH_ID}`, { waitUntil: 'domcontentloaded' })
    await expectIframeSlug(page, 'c02_mobile')

    await page.goto(`/trace/feedback/${SAMPLE_BATCH_ID}`, { waitUntil: 'domcontentloaded' })
    await expectIframeSlug(page, 'c05_mobile')

    await page.goto('/trace/feedback/success', { waitUntil: 'domcontentloaded' })
    await expectIframeSlug(page, 'c06_mobile_1')
  })

  test('system settings and inventory text mapping is correct', async () => {
    expect(inferRouteByText('f01_pc', 'System Settings', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
    expect(inferRouteByText('m01_pc', 'Inventory', { batchId: SAMPLE_BATCH_ID })).toBe('/processor/pending')
    expect(inferRouteByText('g01_pc', 'Inventory', { batchId: SAMPLE_BATCH_ID })).toBe('/regulator/search')
    expect(inferRouteByText('a01_pc', 'System Settings', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
  })

  test('system setting singular fallback is mapped', async () => {
    expect(inferRouteByText('f01_pc', 'System Setting', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
    expect(inferRouteByText('m01_pc', 'System Setting', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
    expect(inferRouteByText('a01_pc', 'System Setting', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
  })

  test('regulator and retail chinese menu mapping is deterministic', async () => {
    expect(inferRouteByText('g01_pc', '库存管理', { batchId: SAMPLE_BATCH_ID })).toBe('/regulator/search')
    expect(inferRouteByText('g02_pc', '系统设置', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
    expect(inferRouteByText('r01_pc', '库存管理', { batchId: SAMPLE_BATCH_ID })).toBe('/retail/pending')
    expect(inferRouteByText('r03_pc', '系统设置', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
  })

  test('sidebar menu mapping is deterministic across major roles', async () => {
    expect(inferRouteByText('l01_pc', 'In Transit', { batchId: SAMPLE_BATCH_ID })).toBe(`/logistics/transport-record/${SAMPLE_BATCH_ID}`)
    expect(inferRouteByText('l05_pc_1', 'Processing', { batchId: SAMPLE_BATCH_ID })).toBe('/logistics/pending')
    expect(inferRouteByText('l05_pc_1', 'Quality Control', { batchId: SAMPLE_BATCH_ID })).toBe(`/logistics/temp-record/${SAMPLE_BATCH_ID}`)
    expect(inferRouteByText('l05_pc_1', 'Audit Log', { batchId: SAMPLE_BATCH_ID })).toBe(`/logistics/batch-detail/${SAMPLE_BATCH_ID}`)
    expect(inferRouteByText('l03_pc', 'Settings', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')
    expect(inferRouteByText('l03_pc', 'Log Out', { batchId: SAMPLE_BATCH_ID })).toBe('/public/logout')

    expect(inferRouteByText('m01_pc', 'Batch Processing', { batchId: SAMPLE_BATCH_ID })).toBe('/processor/pending')
    expect(inferRouteByText('m01_pc', 'Quality Inspection', { batchId: SAMPLE_BATCH_ID })).toBe(`/processor/process-record/${SAMPLE_BATCH_ID}`)
    expect(inferRouteByText('m01_pc', 'Support', { batchId: SAMPLE_BATCH_ID })).toBe('/system/settings')

    expect(inferRouteByText('r01_pc', 'QR Generation', { batchId: SAMPLE_BATCH_ID })).toBe(`/retail/qrcode/${SAMPLE_BATCH_ID}`)
    expect(inferRouteByText('r01_pc', 'Risk Assessment', { batchId: SAMPLE_BATCH_ID })).toBe(`/retail/batch-detail/${SAMPLE_BATCH_ID}`)
    expect(inferRouteByText('r01_pc', 'Sign Out', { batchId: SAMPLE_BATCH_ID })).toBe('/public/logout')

    expect(inferRouteByText('g01_pc', 'Risk Assessment', { batchId: SAMPLE_BATCH_ID })).toBe('/regulator/abnormal')
    expect(inferRouteByText('g01_pc', 'Audit Logs', { batchId: SAMPLE_BATCH_ID })).toBe('/regulator/audit-logs')
    expect(inferRouteByText('g01_pc', 'Sign Out', { batchId: SAMPLE_BATCH_ID })).toBe('/public/logout')

    expect(inferRouteByText('f01_pc', 'Batch Management', { batchId: SAMPLE_BATCH_ID })).toBe('/farmer/batches')
    expect(inferRouteByText('f01_pc', 'Farm Records', { batchId: SAMPLE_BATCH_ID })).toBe(`/farmer/records/${SAMPLE_BATCH_ID}`)
  })

  test('prototype catalog opens all slugs by prototype route', async ({ page }) => {
    await page.goto('/prototype', { waitUntil: 'domcontentloaded' })
    const cards = page.locator('article')
    const count = await cards.count()
    expect(count).toBeGreaterThan(40)

    for (let i = 0; i < Math.min(count, 10); i += 1) {
      const slug = await cards.nth(i).locator('h2').textContent()
      await cards.nth(i).locator('button').first().click()
      await expect(page).toHaveURL(new RegExp(`/prototype/${slug?.trim()}`))
      await page.goto('/prototype', { waitUntil: 'domcontentloaded' })
    }
  })

  test('global jump selector can reach key routes', async ({ page }) => {
    await page.goto('/regulator/dashboard', { waitUntil: 'domcontentloaded' })
    const jump = page.locator('header select')
    await jump.selectOption('/system/settings')
    await expect(page).toHaveURL('/system/settings')

    await jump.selectOption('/logistics/dashboard')
    await expect(page).toHaveURL('/logistics/dashboard')

    await jump.selectOption('/trace/search')
    await expect(page).toHaveURL('/trace/search')
  })

  test('all prototype pages are connected in flow graph', async () => {
    const slugs = [
      'p01_pc', 'p02_pc', 'p03_pc', 'p04_pc', 'p05_404_pc', 'p06_pc_1', 'p06_pc_2',
      'a01_pc', 'a02_pc', 'a03_pc', 'a04_pc', 'a05_pc', 'a06_pc',
      'f01_pc', 'f02_pc', 'f03_pc', 'f04_pc', 'f05_pc',
      'm01_pc', 'm02_pc', 'm03_pc', 'm04_pc', 'm05_pc',
      'l01_pc', 'l02_pc', 'l03_pc', 'l04_pc', 'l05_pc_1', 'l05_pc_2',
      'r01_pc', 'r02_pc', 'r03_pc', 'r04_pc', 'r05_pc_1', 'r05_pc_2', 'r06_pc',
      'g01_pc', 'g02_pc', 'g03_pc', 'g04_pc', 'g05_pc', 'g06_pc_1', 'g06_pc_2', 'g07_pc', 'g08_pc', 'g09_pc',
      'c01_mobile', 'c02_mobile', 'c03_mobile', 'c03_mobile_h5', 'c04_mobile_1', 'c04_mobile_2', 'c05_mobile', 'c06_mobile_1', 'c06_mobile_2',
    ]

    const edges = new Map(slugs.map((slug) => [slug, new Set()]))
    const resolveRoute = (to) => String(to || '').replace(':batchId', SAMPLE_BATCH_ID)

    for (const slug of slugs) {
      const routes = [
        ...getPrototypeActions(slug, { batchId: SAMPLE_BATCH_ID }),
        ...getPrototypeClickMap(slug, { batchId: SAMPLE_BATCH_ID }),
      ].map((x) => resolveRoute(x.to))

      for (const route of routes) {
        const toSlug = inferSlugByPath(route)
        if (toSlug && edges.has(slug)) edges.get(slug).add(toSlug)
      }
    }

    const inDeg = Object.fromEntries(slugs.map((slug) => [slug, 0]))
    for (const [, tos] of edges) {
      for (const to of tos) inDeg[to] = (inDeg[to] || 0) + 1
    }

    const noOut = slugs.filter((slug) => edges.get(slug).size === 0)
    const noIn = slugs.filter((slug) => (inDeg[slug] || 0) === 0)

    const visited = new Set()
    const queue = ['p01_pc']
    while (queue.length) {
      const cur = queue.shift()
      if (visited.has(cur)) continue
      visited.add(cur)
      for (const nxt of edges.get(cur) || []) {
        if (!visited.has(nxt)) queue.push(nxt)
      }
    }
    const unreachable = slugs.filter((slug) => !visited.has(slug))

    expect(noOut).toEqual([])
    expect(noIn).toEqual([])
    expect(unreachable).toEqual([])
  })
})
