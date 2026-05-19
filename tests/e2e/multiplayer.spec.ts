import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../setup/global-setup';

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test('Multiplayer flow with real-time Pusher updates', async ({ browser }) => {
  const aliceCtx = await browser.newContext();
  const bobCtx = await browser.newContext();

  const alice = await aliceCtx.newPage();
  const bob = await bobCtx.newPage();

  // Capture browser console logs to diagnose Pusher/WebSocket errors
  alice.on('console', msg => console.log('ALICE BROWSER CONSOLE:', msg.text()));
  bob.on('console', msg => console.log('BOB BROWSER CONSOLE:', msg.text()));

  // 1. Log in both players
  await login(alice, TEST_USERS.alice.email, TEST_USERS.alice.password);
  await login(bob, TEST_USERS.bob.email, TEST_USERS.bob.password);

  // 2. Alice creates the game
  await alice.goto('/');
  await alice.click('button:has-text("Create Room")');
  await alice.waitForURL(/\/game\//);

  const codeEl = alice.locator('h2').filter({ hasText: /^\d{4}$/ });
  await expect(codeEl).toBeVisible();
  const roomCode = (await codeEl.textContent())!.trim();
  expect(roomCode).toMatch(/^\d{4}$/);

  // Wait 2.5s to ensure Alice's Pusher subscription is fully established before Bob joins
  await alice.waitForTimeout(2500);

  // 3. Bob joins using the code
  await bob.goto('/');
  await bob.fill('input[placeholder="4-digit Code"]', roomCode);
  await bob.click('button:has-text("Join")');
  await bob.waitForURL(`/game/${roomCode}`);

  // 4. Verification: Bob appears on Alice's page (real-time Pusher updates)
  await expect(alice.locator('.player-card').filter({ hasText: 'Bob' })).toBeVisible({ timeout: 15000 });
  await expect(bob.locator('.player-card').filter({ hasText: 'Alice' })).toBeVisible({ timeout: 15000 });

  // 5. Verification: Host controls vs Player controls
  // Alice sees + and - buttons
  await expect(alice.locator('.buyin-btn').first()).toBeVisible();
  // Bob sees NO controls
  await expect(bob.locator('.buyin-btn')).toHaveCount(0);
  await expect(bob.locator('button:has-text("Kick")')).toHaveCount(0);
  await expect(bob.locator('button:has-text("End Game")')).toHaveCount(0);

  // 6. Alice adds buy-in for Bob → Bob sees it update in real-time
  const bobCardOnAlice = alice.locator('.player-card').filter({ hasText: 'Bob' });
  await bobCardOnAlice.locator('.buyin-btn.buyin-add').click();

  // Bob's card on Bob's page updates to 2 buy-ins
  const bobCardOnBob = bob.locator('.player-card').filter({ hasText: 'Bob' });
  await expect(bobCardOnBob).toContainText('Buy-ins: 2', { timeout: 15000 });

  // 7. Alice kicks Bob → Bob is removed from both views
  await bobCardOnAlice.locator('button:has-text("Kick")').click();
  await bobCardOnAlice.locator('button:has-text("Confirm Kick")').click();

  // Bob vanishes from both screens
  await expect(alice.locator('.player-card').filter({ hasText: 'Bob' })).toHaveCount(0, { timeout: 15000 });
  await expect(bob.locator('.player-card').filter({ hasText: 'Bob' })).toHaveCount(0, { timeout: 15000 });

  await aliceCtx.close();
  await bobCtx.close();
});
