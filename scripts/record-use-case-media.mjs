import { spawn } from 'node:child_process';
import { execFile } from 'node:child_process';
import { access, mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { promisify } from 'node:util';
import { chromium } from 'playwright';

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, '..');
const docsRoot = resolve(root, '../..');
const vite = resolve(root, '../node_modules/.bin/vite');
const host = '127.0.0.1';
const port = 4321;
const viewport = { width: 1440, height: 810 };
const screenshotDirectory = join(docsRoot, 'public/img/kanban-use-cases');
const videoDirectory = join(docsRoot, 'public/video/kanban-use-cases');
const temporaryRoot = await mkdtemp(join(tmpdir(), 'kanban-use-case-media-'));
const requested = process.argv.slice(2).filter((argument) => !argument.startsWith('-'));

const useCases = [
  { id: 'product-delivery', title: 'Product delivery' },
  { id: 'support-operations', title: 'Support operations' },
  { id: 'sales-onboarding', title: 'Sales and onboarding' },
  { id: 'content-approvals', title: 'Content and approvals' },
  { id: 'quality-manufacturing', title: 'Quality and manufacturing' },
  { id: 'internal-workflows', title: 'Internal workflows' },
].filter((useCase) => requested.length === 0 || requested.includes(useCase.id));

async function waitForPreview() {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(`http://${host}:${port}`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error('Timed out waiting for the Kanban preview server');
}

async function recordUseCase(browser, useCase) {
  const rawDirectory = join(temporaryRoot, useCase.id);
  await mkdir(rawDirectory, { recursive: true });
  const context = await browser.newContext({
    viewport,
    colorScheme: 'light',
    locale: 'en-US',
    timezoneId: 'UTC',
    recordVideo: { dir: rawDirectory, size: viewport },
  });
  const page = await context.newPage();
  const video = page.video();
  const browserErrors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  await page.goto(`http://${host}:${port}/?example=${useCase.id}&capture=board`, { waitUntil: 'networkidle' });
  const grid = page.locator('revo-grid').first();
  await grid.waitFor({ state: 'visible', timeout: 20_000 });
  await grid.locator('[data-kanban-card-id]').first().waitFor({ state: 'visible', timeout: 20_000 });
  await page.waitForTimeout(1_300);

  const png = join(rawDirectory, `${useCase.id}.png`);
  await grid.screenshot({ path: png, animations: 'disabled' });

  const collapse = page.getByLabel(/^Collapse swimlane:/).first();
  if (await collapse.count()) {
    await collapse.click();
    await page.waitForTimeout(1_050);
    const expand = page.getByLabel(/^Expand swimlane:/).first();
    if (await expand.count()) await expand.click();
  }
  await page.waitForTimeout(1_250);

  const card = grid.locator('[data-kanban-card-id]').nth(2);
  const cardBox = await card.boundingBox();
  if (cardBox) {
    await page.mouse.move(cardBox.x + cardBox.width * 0.65, cardBox.y + cardBox.height * 0.35, { steps: 18 });
    await page.mouse.down();
    await page.mouse.move(cardBox.x + cardBox.width * 0.65 + 38, cardBox.y + cardBox.height * 0.35, { steps: 18 });
    await page.mouse.up();
  }
  await page.waitForTimeout(1_350);

  if (browserErrors.length) throw new Error(`${useCase.title} browser errors:\n${browserErrors.join('\n')}`);
  await context.close();
  const rawVideo = await video.path();
  const screenshotTarget = join(screenshotDirectory, `${useCase.id}.webp`);
  const videoTarget = join(videoDirectory, `${useCase.id}.mp4`);

  await execFileAsync('ffmpeg', [
    '-loglevel', 'error', '-y', '-i', png,
    '-vf', 'scale=1200:675:flags=lanczos',
    '-c:v', 'libwebp', '-quality', '80', screenshotTarget,
  ]);
  await execFileAsync('ffmpeg', [
    '-loglevel', 'error', '-y', '-ss', '1.0', '-i', rawVideo,
    '-vf', 'fps=30,scale=1200:676:flags=lanczos,format=yuv420p',
    '-t', '5.5', '-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', '25',
    '-movflags', '+faststart', videoTarget,
  ]);

  console.log(`${useCase.id}: ${screenshotTarget} + ${videoTarget}`);
}

if (useCases.length === 0) {
  throw new Error('No matching use cases were requested');
}

await access(join(root, 'dist/index.html'));
await access(vite);
await mkdir(screenshotDirectory, { recursive: true });
await mkdir(videoDirectory, { recursive: true });
const preview = spawn(vite, ['preview', '--host', host, '--port', String(port)], { cwd: root, stdio: 'ignore' });
await waitForPreview();
const browser = await chromium.launch({ headless: true });

try {
  for (const useCase of useCases) await recordUseCase(browser, useCase);
} finally {
  await browser.close();
  preview.kill('SIGTERM');
  await rm(temporaryRoot, { recursive: true, force: true });
}
