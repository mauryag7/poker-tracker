import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../setup/global-setup';

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test('Full host game flow from creation to cashout and results', async ({ page }) => {
  // 1. Login as Alice
  await login(page, TEST_USERS.alice.email, TEST_USERS.alice.password);
  await expect(page.locator('main')).toContainText('Alice');

  // 2. Create game
  await page.fill('input[type="number"]:near(:text("Chips per Buy-in"))', '100');
  await page.fill('input[type="number"]:near(:text("Dollars per Buy-in"))', '10');
  await page.click('button:has-text("Create Room")');

  await page.waitForURL(/\/game\//);
  const codeEl = page.locator('h2').filter({ hasText: /^\d{4}$/ });
  await expect(codeEl).toBeVisible();
  const roomCode = (await codeEl.textContent())!.trim();
  expect(roomCode).toMatch(/^\d{4}$/);

  // Alice is listed as Host
  await expect(page.locator('text=Alice')).toBeVisible();
  await expect(page.locator('text=(Host)')).toBeVisible();

  // 3. See and interact with buy-in controls
  await expect(page.locator('.buyin-btn').first()).toBeVisible();

  // 4. End the game
  await page.click('button:has-text("End Game")');
  await page.click('button:has-text("Confirm End Game")');

  // 5. Cashout screen
  await expect(page.locator('h1:has-text("Cash Out")')).toBeVisible({ timeout: 8000 });

  // 6. Enter chips and calculate final results
  const chipInputs = page.locator('input[placeholder="Chips"]');
  await chipInputs.first().fill('100');

  // Remaining to account for is 0
  await expect(page.locator('text=0').nth(0)).toBeVisible();
  const submitBtn = page.locator('button:has-text("Calculate Final Results")');
  await expect(submitBtn).toBeEnabled({ timeout: 3000 });
  await submitBtn.click();

  // Results screen
  await expect(page.locator('h1:has-text("Game Results")')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('text=broke exactly even')).toBeVisible();

  // 7. Back to lobby
  await page.click('button:has-text("Back to Lobby")');
  await expect(page).toHaveURL('/');
});
