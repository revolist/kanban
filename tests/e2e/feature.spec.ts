import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const feature = JSON.parse(
  readFileSync(new URL('../../feature.json', import.meta.url), 'utf8'),
) as { title: string };

test(`${feature.title} mounts without browser errors`, async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/');
  const grid = page.locator('revo-grid').first();
  await expect(grid).toBeVisible({ timeout: 15_000 });
  await expect(grid.locator('.kanban-column-header__title').first()).toBeVisible();
  await expect(page.getByText('Customer interview synthesis').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('mounts the 30K cards board from the multi-example host', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/?example=board-30k');
  const grid = page.locator('revo-grid');
  await expect(grid).toBeVisible({ timeout: 20_000 });
  const firstCard = grid.locator('[data-kanban-card-id]').first();
  await expect(firstCard).toBeVisible({ timeout: 20_000 });
  await expect(grid.locator('.kanban-column-header__count').first()).toHaveText('3000 cards');
  const renderedCardCount = await grid.locator('[data-kanban-card-id]').count();
  expect(renderedCardCount).toBeGreaterThan(0);
  expect(renderedCardCount).toBeLessThan(100);
  const firstCardBox = await firstCard.boundingBox();
  expect(firstCardBox?.height).toBeGreaterThan(150);
  expect(firstCardBox?.height).toBeLessThan(200);
  expect(errors).toEqual([]);
});
