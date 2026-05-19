import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../setup/global-setup';

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Authentication', () => {
  test('registered player can log in and sees their name on the lobby', async ({ page }) => {
    await login(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
    await expect(page.locator('main')).toContainText('Alice');
  });

  test('wrong password shows error', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', TEST_USERS.alice.email);
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/login/);
    await expect(page.locator('p[style*="color"]')).toBeVisible();
  });

  test('sign out redirects to /login', async ({ page }) => {
    await login(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
    await page.click('button:has-text("Sign Out")');
    await page.waitForURL('/login', { timeout: 10000 });
    await expect(page).toHaveURL('/login');
  });

  test('admin login redirects straight to /admin', async ({ page }) => {
    await login(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await expect(page).toHaveURL('/admin');
  });
});
