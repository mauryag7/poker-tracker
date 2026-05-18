# Poker Tracker

Poker Tracker is a highly polished, lightweight, mobile-first web application designed to track buy-ins, calculate final chip values, and simplify debt settlement for home poker games. 

The application is built as a pure frontend solution using standard HTML, CSS, and JavaScript. It operates entirely on your device, making it lightning fast and entirely free to host.

## Features

*   **Progressive Web App (PWA):** Install the app directly to your phone's home screen. The built-in service worker caches all files, allowing the app to open instantly and function flawlessly even with zero cell service or offline.
*   **Configurable Buy-ins:** Set your own conversion rate for chips to dollars at the start of each game.
*   **Active Game Dashboard:** Track active players, monitor the live total pot, and add or remove re-buys with large, easily tappable `+` and `-` controls.
*   **Dark Mode Support:** A sleek dark theme option is available via a toggle icon in the header, making it easy on the eyes in low-light environments.
*   **Cash-out Calculator:** At the end of the night, input each player's final chip count. A live counter tracks the remaining chips in play to ensure the math perfectly balances before calculating results.
*   **Debt Simplification:** A built-in algorithm calculates exactly who owes who money. It automatically pairs the largest debtors with the largest creditors to minimize the number of physical transactions needed to settle the game.
*   **Quick Share Summary:** A single click copies the formatted "Who owes who" summary to your clipboard, ready to paste into your group chat.
*   **Data Persistence:** All game state is automatically saved to the browser's local storage. If you accidentally refresh the page or close your browser, your game data will immediately reload when you return.

## Technology Stack

*   HTML5
*   CSS3 (Vanilla, custom styling)
*   JavaScript (ES6+, Vanilla)

No external libraries, frameworks, or bundlers are used. 

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
