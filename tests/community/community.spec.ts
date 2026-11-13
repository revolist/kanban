import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/fixture.html');
  await page.waitForFunction(() => (window as any).ready);
  await expect(page.locator('[data-kanban-community-card="a"]')).toBeVisible();
});

test('installed Community supports editor CRUD, local search and host save/reload', async ({ page }) => {
  await page.getByRole('toolbar').getByRole('button', { name: 'Add card' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Title', { exact: true }).fill('Created in Community');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText('Created in Community', { exact: true })).toBeVisible();
  await page.locator('[data-kanban-community-card="a"]').dblclick();
  await dialog.getByLabel('Title', { exact: true }).fill('Edited in Community');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  expect(await page.evaluate(() => (window as any).board.getCards()[0].metadata)).toEqual({ owner: 'host' });
  await page.getByRole('searchbox').fill('Edited');
  await expect(page.getByText('Edited in Community', { exact: true })).toBeVisible();
  await expect(page.getByText('Second task', { exact: true })).toHaveCount(0);
  await page.getByRole('searchbox').fill('');
  const saved = await page.evaluate(() => JSON.stringify((window as any).board.getCards()));
  await page.evaluate((json) => {
    (window as any).grid.source = JSON.parse(json);
  }, saved);
  await expect(page.getByText('Edited in Community', { exact: true })).toBeVisible();
  await page.locator('[data-kanban-community-card="a"]').click();
  await page.getByRole('toolbar').getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('[data-kanban-community-card="a"]')).toHaveCount(0);
});

test('keyboard movement and WIP preserve canonical records without paid controls', async ({ page }) => {
  const first = page.locator('[data-kanban-community-card="a"]');
  await first.focus();
  await first.press('ArrowRight');
  expect(await page.evaluate(() => (window as any).board.getCards().find((card: any) => card.id === 'a').status)).toBe(
    'done',
  );
  const second = page.locator('[data-kanban-community-card="b"]');
  await second.focus();
  await second.press('ArrowRight');
  expect(await page.evaluate(() => (window as any).board.getCards().find((card: any) => card.id === 'b').status)).toBe(
    'todo',
  );
  await expect(page.getByRole('button', { name: /undo|redo/i })).toHaveCount(0);
  await first.click({ button: 'right' });
  await expect(page.getByRole('menu')).toHaveCount(0);
  await expect(page.locator('[class*="swimlane"]')).toHaveCount(0);
});

test('pointer movement commits a card into the target column', async ({ page }) => {
  const source = page.locator('[data-kanban-community-card="a"]');
  const target = page.locator('[data-kanban-community-column="done"]').first();
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  await page.mouse.move(from!.x + 25, from!.y + 30);
  await page.mouse.down();
  await page.mouse.move(to!.x + 40, to!.y + 35, { steps: 10 });
  await page.mouse.up();
  expect(await page.evaluate(() => (window as any).board.getCards().find((card: any) => card.id === 'a').status)).toBe(
    'done',
  );
});

test('translated dark narrow board and editor remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    const grid = (window as any).grid;
    grid.setAttribute('theme', 'dark');
    grid.dataset.theme = 'dark';
    grid.kanban = { ...grid.kanban, labels: { add: 'Adicionar cartão', title: 'Título', save: 'Guardar' } };
  });
  await page.getByRole('toolbar').getByRole('button', { name: 'Adicionar cartão' }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título', { exact: true }).fill('Traduzido');
  await dialog.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText('Traduzido', { exact: true })).toBeVisible();
});

test('host cancellation prevents the packaged editor and mutations', async ({ page }) => {
  await page.evaluate(() => {
    const grid = (window as any).grid;
    grid.addEventListener('kanbancardcreaterequest', (event: Event) => event.preventDefault());
    grid.addEventListener('beforekanbancardmove', (event: Event) => event.preventDefault());
  });
  await page.getByRole('toolbar').getByRole('button', { name: 'Add card' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-kanban-community-card="a"]').press('ArrowRight');
  expect(await page.evaluate(() => (window as any).board.getCards()[0].status)).toBe('todo');
});

test('column collapse and deactivation restore the host grid and current source', async ({ page }) => {
  await page.getByRole('button', { name: 'Collapse column' }).first().click();
  await expect(page.locator('[data-kanban-community-card="a"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand column' }).click();
  await expect(page.locator('[data-kanban-community-card="a"]')).toBeVisible();
  await page.evaluate(() => {
    (window as any).board.updateCard('a', { title: 'Retained after teardown' });
    (window as any).grid.kanban = false;
  });
  await expect(page.getByRole('toolbar')).toHaveCount(0);
  await expect(page.locator('.kanban-community-live')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).grid.source[0].title)).toBe('Retained after teardown');
  expect(await page.evaluate(() => (window as any).grid.columns.map((column: any) => column.prop))).toEqual(['title']);
});

test('large local sources retain bounded virtual DOM and allow distant editing', async ({ page }) => {
  await page.evaluate(() => {
    (window as any).grid.source = Array.from({ length: 50000 }, (_, index) => ({
      id: `large-${index}`,
      title: `Task ${index}`,
      status: 'todo',
      order: (index + 1) * 1024,
    }));
  });
  await expect(page.locator('[data-kanban-community-card="large-0"]')).toBeVisible();
  expect(await page.locator('[data-kanban-community-card]').count()).toBeLessThan(100);
  await page.evaluate(() => (window as any).board.revealCard('large-49999'));
  await expect(page.locator('[data-kanban-community-card="large-49999"]')).toBeVisible();
  await page.locator('[data-kanban-community-card="large-49999"]').dblclick();
  await expect(page.getByRole('dialog').getByLabel('Title', { exact: true })).toHaveValue('Task 49999');
});

test.describe('native touch', () => {
  test.use({ hasTouch: true });
  test('moves a card with a touch sequence', async ({ page }) => {
    const source = await page.locator('[data-kanban-community-card="a"]').boundingBox();
    const target = await page.locator('[data-kanban-community-column="done"]').first().boundingBox();
    const cdp = await page.context().newCDPSession(page);
    const start = { x: source!.x + 30, y: source!.y + 30 };
    const end = { x: target!.x + 40, y: target!.y + 40 };
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [start] });
    for (let step = 1; step <= 6; step++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: start.x + ((end.x - start.x) * step) / 6, y: start.y + ((end.y - start.y) * step) / 6 }],
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    expect(await page.evaluate(() => (window as any).board.getCards()[0].status)).toBe('done');
    await cdp.detach();
  });
});

test('custom fields and asynchronous host validation preserve metadata', async ({ page }) => {
  await page.evaluate(() => {
    (window as any).grid.kanbanCardEditorDialog = {
      fields: [
        { prop: 'title', label: 'Título', required: true },
        { prop: 'points', label: 'Pontos', kind: 'number' },
      ],
      validate: async (draft: any) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return draft.title === 'Blocked' ? 'Título rejeitado' : undefined;
      },
    };
  });
  await page.locator('[data-kanban-community-card="a"]').dblclick();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Título', { exact: true }).fill('Blocked');
  await dialog.getByLabel('Pontos', { exact: true }).fill('42');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog.getByRole('alert')).toHaveText('Título rejeitado');
  expect(await page.evaluate(() => (window as any).board.getCards()[0].title)).toBe('First task');
  await dialog.getByLabel('Título', { exact: true }).fill('Validated');
  await dialog.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).board.getCards()[0])).toMatchObject({
    title: 'Validated',
    points: 42,
    metadata: { owner: 'host' },
  });
});

test('explicit editor installation reuses the automatically installed service', async ({ page }) => {
  await page.evaluate(async () => {
    const grid = (window as any).grid;
    grid.plugins = [...grid.plugins, (window as any).Editor];
  });
  await page.getByRole('toolbar').getByRole('button', { name: 'Add card' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('dialog').press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
