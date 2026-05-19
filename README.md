# Poker Tracker

Poker Tracker is a highly polished, mobile-first, full-stack Next.js web application designed to track buy-ins, synchronize real-time player actions, calculate final cash-out values, and simplify debt settlement for home poker games. 

## Features

*   **Multiplayer Live Synchronization:** Powered by Pusher, player screens update in real-time as the host or players make actions.
*   **Authentication & Role Management:** Secure sign-in using NextAuth.js credentials provider, supporting Player and Admin roles.
*   **Configurable Buy-ins:** Set conversion rates (dollars/chips) during game setup. Optionally allow players to manage their own buy-ins or keep permissions restricted to the host.
*   **Active Game Dashboard:** Monitor the live pot size, total active chips, and easily add or remove buy-ins with confirmation dialogs.
*   **Theme Support:** Sleek light and dark mode toggles.
*   **Cash-out Calculator:** At the end of the game, input final chip counts. A live validator ensures the total chips match the buy-ins before final calculations.
*   **Debt Simplification Algorithm:** Automatically pairs debtors and creditors to minimize the number of physical transactions needed to settle.
*   **History & Stats:** View previous games and historical stats on your dashboard.
*   **Admin Dashboard:** Dedicated admin page to view global statistics (games hosted, players active, average pot sizes).

## Technology Stack

*   **Framework:** Next.js (App Router, React 19)
*   **Database:** Prisma ORM connected to PostgreSQL
*   **Authentication:** NextAuth.js
*   **Real-time Updates:** Pusher Channels
*   **Styling:** Custom Vanilla CSS (Dark & Light modes)
*   **Testing:** Jest (Unit & API Integration) & Playwright (E2E)

## Setup & Running Locally

### Prerequisites

*   Node.js (v18+)
*   A running PostgreSQL database instance (or a Neon database URL)
*   A Pusher Channels account

### Installation

1. Clone this repository or download the source code:
   ```bash
   git clone <repo-url>
   cd poker-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables. Create a `.env` file in the root folder using this template:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/database"
   NEXTAUTH_SECRET="your-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"

   NEXT_PUBLIC_PUSHER_KEY="your-pusher-key"
   PUSHER_APP_ID="your-pusher-app-id"
   PUSHER_SECRET="your-pusher-secret"
   NEXT_PUBLIC_PUSHER_CLUSTER="your-pusher-cluster"
   ```

4. Push the Prisma database schema:
   ```bash
   npx prisma db push
   ```

5. Seed the local database:
   ```bash
   npx dotenv -e .env -- npx tsx tests/setup/global-setup.ts
   ```

6. Start the local Next.js dev server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

## Testing

### Unit & API Integration Tests (Jest)
Run unit and route handlers verification:
```bash
npm run test
```

### End-to-End Tests (Playwright)
Run Playwright browser E2E flow testing:
```bash
npm run test:e2e
```

## Deployment

This app can be deployed easily on **Vercel**:
1. Push your repository to GitHub.
2. Link the repository to your Vercel project.
3. Add the exact environment variables (from your `.env` file) to Vercel's settings.
4. The deployment build automatically runs `prisma generate` via the `postinstall` script and builds the Next.js production build.
