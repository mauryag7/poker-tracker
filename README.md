# Poker Tracker

Poker Tracker is a lightweight, mobile-first web application designed to track buy-ins, calculate final chip values, and simplify debt settlement for home poker games. 

The application is built as a pure frontend solution using standard HTML, CSS, and JavaScript. It does not require a backend, a database, or a build process, making it incredibly fast and easy to host.

## Features

*   **Configurable Buy-ins:** Set your own conversion rate for chips to dollars at the start of each game.
*   **Active Game Dashboard:** Track active players, log re-buys with a single tap, and monitor the live total pot.
*   **Cash-out Calculator:** At the end of the night, input each player's final chip count. The app tracks the total expected chips in play to ensure no chips are missing from the table before allowing calculations.
*   **Debt Simplification:** A built-in algorithm calculates exactly who owes who money. It automatically pairs the largest debtors with the largest creditors to minimize the number of physical transactions (such as Venmo or cash transfers) needed to settle the game.
*   **Data Persistence:** All game state is automatically saved to the browser's local storage. If you accidentally refresh the page or close your browser, your game data will immediately reload when you return.

## Technology Stack

*   HTML5
*   CSS3 (Vanilla, custom styling)
*   JavaScript (ES6+, Vanilla)

No external libraries, frameworks, or bundlers (like React, Vue, or Vite) are used.

## How to Run Locally

Because it is a pure frontend application without dependencies, you do not need to install Node.js or run a local server to use it.

1.  Clone this repository or download the source code.
2.  Navigate to the project folder.
3.  Double-click the `index.html` file to open it in your default web browser.

## Deployment

This application is designed to be easily hosted on static file hosting services like GitHub Pages.

To deploy via GitHub Pages:
1.  Push your code to a GitHub repository.
2.  Navigate to the repository Settings on GitHub.
3.  Click on "Pages" in the left sidebar.
4.  Under "Source", select the "main" branch and save.
5.  Your application will be live at `https://[username].github.io/[repository-name]`.

## License

This project is open-source and available for personal use.
