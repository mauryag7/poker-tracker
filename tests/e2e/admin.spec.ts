import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../setup/global-setup';

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Admin Dashboard', () => {
  test('admin is redirected to /admin from lobby and sees dashboard stats', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('text=Total Players')).toBeVisible();
    await expect(page.locator('text=Total Games')).toBeVisible();
    await expect(page.locator('text=Active Games')).toBeVisible();
  });

  test('non-admin is blocked from /admin and redirected to lobby', async ({ page }) => {
    await login(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
    await page.goto('/admin');
    await page.waitForURL('/', { timeout: 8000 });
    await expect(page).toHaveURL('/');
  });

  test('admin cannot join or create a game via API', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    
    // Attempt join
    const responseJoin = await page.request.post('/api/games/join', {
      headers: { 'Content-Type': 'application/json' },
      data: { code: '0000' },
    });
    expect(responseJoin.status()).toBe(403);
    const bodyJoin = await responseJoin.json();
    expect(bodyJoin.message).toMatch(/Admins cannot join/);

    // Attempt create
    const responseCreate = await page.request.post('/api/games/create', {
      headers: { 'Content-Type': 'application/json' },
      data: { chipValue: '10', chipsQty: '100' },
    });
    expect(responseCreate.status()).toBe(403);
  });
});
