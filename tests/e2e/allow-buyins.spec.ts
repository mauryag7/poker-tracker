import { test, expect } from '@playwright/test';
import { TEST_USERS } from '../setup/global-setup';

async function login(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15000 });
}

test.describe('Player Buy-in Updates Permission Option', () => {
  test('non-host player CANNOT update buy-ins when allowPlayerBuyins is disabled', async ({ context }) => {
    // 1. Create two pages for Host (Alice) and Player (Bob)
    const hostPage = await context.newPage();
    const playerPage = await context.newPage();

    // 2. Host creates a game with allowPlayerBuyins disabled (unchecked)
    await login(hostPage, TEST_USERS.alice.email, TEST_USERS.alice.password);
    await hostPage.fill('input[type="number"]:near(:text("Chips per Buy-in"))', '100');
    await hostPage.fill('input[type="number"]:near(:text("Dollars per Buy-in"))', '10');
    
    // Ensure it is unchecked (should be unchecked by default)
    const checkbox = hostPage.locator('#allowPlayerBuyins');
    await expect(checkbox).not.toBeChecked();

    await hostPage.click('button:has-text("Create Room")');
    await hostPage.waitForURL(/\/game\//);
    const roomCode = hostPage.url().split('/').pop()!;

    // 3. Player Bob joins the game
    await login(playerPage, TEST_USERS.bob.email, TEST_USERS.bob.password);
    await playerPage.fill('input[placeholder="4-digit Code"]', roomCode);
    await playerPage.click('button:has-text("Join")');
    await playerPage.waitForURL(new RegExp(`/game/${roomCode}`));

    // 4. Verify Player Bob does NOT see buy-in controls on his card
    // Host should see controls, player Bob should not see any buyin-controls
    await expect(playerPage.locator('.buyin-controls')).toHaveCount(0);
    
    // Alice (Host) should see controls
    await expect(hostPage.locator('.buyin-controls')).toHaveCount(2); // One for Alice, one for Bob
  });

  test('non-host player CAN update their own buy-in when allowPlayerBuyins is enabled', async ({ context }) => {
    const hostPage = await context.newPage();
    const playerPage = await context.newPage();

    // 1. Host creates a game with allowPlayerBuyins enabled
    await login(hostPage, TEST_USERS.alice.email, TEST_USERS.alice.password);
    await hostPage.fill('input[type="number"]:near(:text("Chips per Buy-in"))', '100');
    await hostPage.fill('input[type="number"]:near(:text("Dollars per Buy-in"))', '10');
    
    await hostPage.check('#allowPlayerBuyins');
    await expect(hostPage.locator('#allowPlayerBuyins')).toBeChecked();

    await hostPage.click('button:has-text("Create Room")');
    await hostPage.waitForURL(/\/game\//);
    const roomCode = hostPage.url().split('/').pop()!;

    // 2. Player Bob joins the game
    await login(playerPage, TEST_USERS.bob.email, TEST_USERS.bob.password);
    await playerPage.fill('input[placeholder="4-digit Code"]', roomCode);
    await playerPage.click('button:has-text("Join")');
    await playerPage.waitForURL(new RegExp(`/game/${roomCode}`));

    // 3. Player Bob should see buy-in controls ONLY for his own card
    // There are two player cards (Alice and Bob). Bob is not the host, so he sees controls only on his card.
    const bobCard = playerPage.locator('.player-card', { hasText: 'Bob' });
    const aliceCard = playerPage.locator('.player-card', { hasText: 'Alice' });

    await expect(bobCard.locator('.buyin-controls')).toBeVisible();
    await expect(aliceCard.locator('.buyin-controls')).not.toBeVisible();

    // 4. Bob increments his buy-in
    await bobCard.locator('.buyin-add').click();
    await expect(bobCard).toContainText('Buy-ins: 2');

    // 5. Bob attempts to decrement his buy-in
    await bobCard.locator('.buyin-sub').click();
    
    // Inline confirmation should appear
    await expect(bobCard.locator('text=Remove a buy-in for Bob?')).toBeVisible();
    
    // Confirm it
    await bobCard.locator('button:has-text("Confirm Remove")').click();
    await expect(bobCard).toContainText('Buy-ins: 1');
  });
});
