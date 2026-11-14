import { expect, test } from '@playwright/test';
test('Community example edits and restores host snapshots without installing paid plugins', async ({ page }) => {
  const errors: string[] = [];
  const paidRequests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (
      /\/packages\/kanban\/dist\/|\/deps\/@revolist_kanban\./.test(request.url()) ||
      /\/assets\/(?:kanban|revogrid-pro)-[^/]+\.(?:js|css)(?:\?|$)/.test(request.url())
    ) {
      paidRequests.push(request.url());
    }
  });
  await page.goto('/?example=community', { timeout: 120_000 });
  await expect(page.getByRole('heading', { name: 'Kanban Community', exact: true })).toBeVisible();
  const card = page.locator('[data-kanban-community-card="research"]');
  await expect(card).toBeVisible();
  await page.getByRole('button', { name: 'Save snapshot', exact: true }).click();
  await expect(page.locator('.community-demo__status')).toHaveText('Snapshot saved.');
  await card.dblclick();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Title', { exact: true }).fill('Edited locally');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(card).toContainText('Edited locally');
  await page.getByRole('button', { name: 'Reload snapshot', exact: true }).click();
  await expect(card).toContainText('Research the workflow');
  const state = await page.locator('revo-grid').evaluate(async (element) => {
    const plugins = await (element as HTMLRevoGridElement).getPlugins();
    const board = plugins.find((plugin) => typeof (plugin as any).getCards === 'function') as any;
    return { names: plugins.map((plugin) => plugin.constructor.name), cards: board.getCards() };
  });
  expect(state.cards[0].metadata).toEqual({ owner: 'application' });
  expect(state.names.join(' ')).not.toMatch(/HistoryPlugin|ContextMenuPlugin|Trial/);
  await expect(page.locator('.kanban-toolbar__history,.rv-history-controls')).toHaveCount(0);
  expect(paidRequests).toEqual([]);
  expect(errors).toEqual([]);
  await page.screenshot({ path: test.info().outputPath('community-light.png'), fullPage: true });
});

test('Community example uses translated controls in a narrow dark layout', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 850 });
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?example=community&lang=pt', { timeout: 120_000 });
  await expect(page.getByRole('button', { name: 'Guardar cópia', exact: true })).toBeVisible();
  const add = page.getByRole('button', { name: 'Adicionar cartão', exact: true }).first();
  const bounds = await add.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await expect(page.locator('.kanban-toolbar-host')).toHaveAttribute('data-theme', 'dark');
  const color = await page
    .locator('revo-grid')
    .evaluate((grid) => getComputedStyle(grid).getPropertyValue('--rv-ui-color-scheme').trim());
  expect(color).toBe('dark');
  await add.click();
  const dialog = page.getByRole('dialog');
  await expect(page.locator('.kanban-card-editor-host')).toHaveAttribute('data-theme', 'dark');
  await dialog.getByLabel('Título', { exact: true }).fill('Cartão da comunidade');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Cartão da comunidade', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  expect(await page.locator('html').getAttribute('lang')).toBe('pt');
  await page.mouse.move(1, 1);
  await page.screenshot({ path: test.info().outputPath('community-dark-narrow.png'), fullPage: true });
});
