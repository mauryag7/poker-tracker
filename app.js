// State management
let state = {
    screen: 'setup',
    config: {
        chips: null,
        dollars: null
    },
    players: []
};

// DOM Elements
const themeToggleBtn = document.getElementById('theme-toggle');
const screens = {
    setup: document.getElementById('setup-screen'),
    dashboard: document.getElementById('dashboard-screen'),
    cashOut: document.getElementById('cash-out-screen'),
    results: document.getElementById('results-screen')
};

// Setup Screen Elements
const chipsInput = document.getElementById('chips-per-buyin');
const dollarsInput = document.getElementById('dollars-per-buyin');
const startGameBtn = document.getElementById('start-game-btn');

// Dashboard Screen Elements
const infoChips = document.getElementById('info-chips');
const infoDollars = document.getElementById('info-dollars');
const infoTotalPot = document.getElementById('info-total-pot');
const newPlayerName = document.getElementById('new-player-name');
const addPlayerBtn = document.getElementById('add-player-btn');
const activePlayersList = document.getElementById('active-players-list');
const endGameBtn = document.getElementById('end-game-btn');

// Cash Out Screen Elements
const cashOutPlayersList = document.getElementById('cash-out-players-list');
const calculateResultsBtn = document.getElementById('calculate-results-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const remainingChipsCount = document.getElementById('remaining-chips-count');

// Results Screen Elements
const finalResultsList = document.getElementById('final-results-list');
const newGameBtn = document.getElementById('new-game-btn');
const simplifyDebtsBtn = document.getElementById('simplify-debts-btn');
const copySummaryBtn = document.getElementById('copy-summary-btn');
const simplifiedDebtsSection = document.getElementById('simplified-debts-section');
const debtsList = document.getElementById('debts-list');

// Initialization
function init() {
    loadState();
    loadTheme();
    bindEvents();
    render();
}

function loadTheme() {
    const savedTheme = localStorage.getItem('poker-tracker-theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('poker-tracker-theme', newTheme);
}

function loadState() {
    const saved = localStorage.getItem('poker-tracker-state');
    if (saved) {
        state = JSON.parse(saved);
    }
}

function saveState() {
    localStorage.setItem('poker-tracker-state', JSON.stringify(state));
}

// Event Listeners
function bindEvents() {
    themeToggleBtn.addEventListener('click', toggleTheme);
    startGameBtn.addEventListener('click', startGame);
    addPlayerBtn.addEventListener('click', addPlayer);
    
    // Allow pressing Enter to add a player
    newPlayerName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addPlayer();
    });

    endGameBtn.addEventListener('click', () => {
        state.screen = 'cash-out';
        saveState();
        render();
    });

    backToDashboardBtn.addEventListener('click', () => {
        state.screen = 'dashboard';
        saveState();
        render();
    });

    calculateResultsBtn.addEventListener('click', calculateResults);
    
    simplifyDebtsBtn.addEventListener('click', () => {
        simplifiedDebtsSection.classList.toggle('hidden');
        if (!simplifiedDebtsSection.classList.contains('hidden')) {
            renderSimplifiedDebts();
        }
    });

    copySummaryBtn.addEventListener('click', () => {
        let summaryText = "Poker Night Summary:\n\n";
        const items = debtsList.querySelectorAll('li');
        if (items.length === 0 || (items.length === 1 && items[0].innerText === 'No debts to settle!')) {
            summaryText += "No debts to settle!";
        } else {
            items.forEach(li => {
                summaryText += li.innerText + "\n";
            });
        }
        
        navigator.clipboard.writeText(summaryText).then(() => {
            const originalText = copySummaryBtn.innerText;
            copySummaryBtn.innerText = "Copied!";
            setTimeout(() => {
                copySummaryBtn.innerText = originalText;
            }, 2000);
        });
    });

    newGameBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to start a new game? This will clear current data.')) {
            state = {
                screen: 'setup',
                config: { chips: null, dollars: null },
                players: []
            };
            saveState();
            render();
        }
    });
}

// Core Logic
function startGame() {
    const chips = parseInt(chipsInput.value);
    const dollars = parseFloat(dollarsInput.value);

    if (isNaN(chips) || chips <= 0 || isNaN(dollars) || dollars <= 0) {
        alert('Please enter valid positive numbers for chips and dollars.');
        return;
    }

    state.config = { chips, dollars };
    state.screen = 'dashboard';
    saveState();
    render();
}

function addPlayer() {
    const name = newPlayerName.value.trim();
    if (!name) return;

    state.players.push({
        id: Date.now().toString(),
        name: name,
        buyIns: 1,
        finalChips: null
    });

    newPlayerName.value = '';
    newPlayerName.focus();
    saveState();
    render();
}

function addBuyIn(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (player) {
        player.buyIns += 1;
        saveState();
        render();
    }
}

function removeBuyIn(playerId) {
    const player = state.players.find(p => p.id === playerId);
    if (player && player.buyIns > 1) {
        if (confirm(`Are you sure you want to remove a buy-in from ${player.name}?`)) {
            player.buyIns -= 1;
            saveState();
            render();
        }
    }
}

function calculateResults() {
    // Save final chips from inputs
    let allValid = true;
    
    const inputs = document.querySelectorAll('.cash-out-input');
    inputs.forEach(input => {
        const id = input.dataset.id;
        const val = parseInt(input.value);
        
        if (isNaN(val) || val < 0) {
            allValid = false;
            input.style.borderColor = 'red';
        } else {
            input.style.borderColor = '';
            const player = state.players.find(p => p.id === id);
            if (player) player.finalChips = val;
        }
    });

    if (!allValid) {
        alert('Please enter a valid chip amount for all players (0 or more).');
        return;
    }

    state.screen = 'results';
    saveState();
    render();
}

// Rendering
function render() {
    // Hide all screens
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));

    // Show active screen
    const activeScreen = screens[state.screen === 'cash-out' ? 'cashOut' : state.screen];
    if (activeScreen) {
        activeScreen.classList.remove('hidden');
    }

    if (state.screen === 'setup') {
        chipsInput.value = state.config.chips || '';
        dollarsInput.value = state.config.dollars || '';
    } else if (state.screen === 'dashboard') {
        renderDashboard();
    } else if (state.screen === 'cash-out') {
        renderCashOut();
    } else if (state.screen === 'results') {
        renderResults();
    }
}

function renderDashboard() {
    infoChips.textContent = state.config.chips;
    infoDollars.textContent = state.config.dollars;

    const totalPot = state.players.reduce((sum, p) => sum + p.buyIns, 0) * state.config.dollars;
    infoTotalPot.textContent = totalPot.toFixed(2);

    activePlayersList.innerHTML = '';
    state.players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-card';
        div.innerHTML = `
            <div class="player-info">
                <span class="player-name">${player.name}</span>
                <span class="player-buyins">Buy-ins: ${player.buyIns} (Total: $${(player.buyIns * state.config.dollars).toFixed(2)})</span>
            </div>
            <div class="buyin-controls">
                <button class="buyin-btn buyin-sub-btn" onclick="removeBuyIn('${player.id}')">-</button>
                <button class="buyin-btn buyin-add-btn" onclick="addBuyIn('${player.id}')">+</button>
            </div>
        `;
        activePlayersList.appendChild(div);
    });
}

function renderCashOut() {
    cashOutPlayersList.innerHTML = '';
    
    const totalExpectedChips = state.players.reduce((sum, p) => sum + p.buyIns, 0) * state.config.chips;

    state.players.forEach(player => {
        const div = document.createElement('div');
        div.className = 'player-card';
        div.innerHTML = `
            <div class="player-info">
                <span class="player-name">${player.name}</span>
                <span class="player-buyins">Buy-ins: ${player.buyIns}</span>
            </div>
            <input type="number" class="cash-out-input" data-id="${player.id}" min="0" placeholder="Chips" value="${player.finalChips !== null ? player.finalChips : ''}">
        `;
        cashOutPlayersList.appendChild(div);
    });

    const inputs = document.querySelectorAll('.cash-out-input');
    
    function updateRemaining() {
        let enteredChips = 0;
        inputs.forEach(input => {
            const val = parseInt(input.value);
            if (!isNaN(val) && val >= 0) {
                enteredChips += val;
            }
        });
        
        const remaining = totalExpectedChips - enteredChips;
        remainingChipsCount.textContent = remaining;
        
        if (remaining === 0) {
            remainingChipsCount.style.color = 'var(--success-color)';
            calculateResultsBtn.disabled = false;
        } else {
            remainingChipsCount.style.color = remaining < 0 ? 'var(--danger-color)' : '';
            calculateResultsBtn.disabled = true;
        }
    }

    inputs.forEach(input => {
        input.addEventListener('input', updateRemaining);
    });

    // Initial check when screen loads
    updateRemaining();
}

function renderResults() {
    finalResultsList.innerHTML = '';
    simplifiedDebtsSection.classList.add('hidden');
    
    const { chips: chipsPerBuyIn, dollars: dollarsPerBuyIn } = state.config;

    let totalProfit = 0;
    
    // Sort players by profit (highest first)
    const results = state.players.map(player => {
        const totalCost = player.buyIns * dollarsPerBuyIn;
        const finalValue = (player.finalChips / chipsPerBuyIn) * dollarsPerBuyIn;
        const profit = finalValue - totalCost;
        return { ...player, totalCost, finalValue, profit };
    }).sort((a, b) => b.profit - a.profit);

    results.forEach(player => {
        let profitClass = 'result-even';
        let profitText = '$0.00';
        
        if (player.profit > 0.001) {
            profitClass = 'result-profit';
            profitText = '+$' + player.profit.toFixed(2);
        } else if (player.profit < -0.001) {
            profitClass = 'result-loss';
            profitText = '-$' + Math.abs(player.profit).toFixed(2);
        }

        totalProfit += player.profit;

        const div = document.createElement('div');
        div.className = 'result-card';
        div.innerHTML = `
            <div>
                <span class="player-name">${player.name}</span>
                <div class="result-details">
                    In: $${player.totalCost.toFixed(2)} | Out: $${player.finalValue.toFixed(2)}
                </div>
            </div>
            <div class="${profitClass}">
                ${profitText}
            </div>
        `;
        finalResultsList.appendChild(div);
    });
}

function renderSimplifiedDebts() {
    debtsList.innerHTML = '';
    const { chips: chipsPerBuyIn, dollars: dollarsPerBuyIn } = state.config;
    
    let debtors = [];
    let creditors = [];
    
    state.players.forEach(player => {
        const totalCost = player.buyIns * dollarsPerBuyIn;
        const finalValue = (player.finalChips / chipsPerBuyIn) * dollarsPerBuyIn;
        const profit = finalValue - totalCost;
        
        if (profit < -0.001) {
            debtors.push({ name: player.name, amount: Math.abs(profit) });
        } else if (profit > 0.001) {
            creditors.push({ name: player.name, amount: profit });
        }
    });
    
    // Sort descending to settle largest amounts first
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);
    
    let i = 0;
    let j = 0;
    
    while (i < debtors.length && j < creditors.length) {
        let debtor = debtors[i];
        let creditor = creditors[j];
        
        let amount = Math.min(debtor.amount, creditor.amount);
        
        const li = document.createElement('li');
        li.style.marginBottom = '8px';
        li.style.borderBottom = '1px solid #ddd';
        li.style.paddingBottom = '8px';
        li.innerHTML = `<strong>${debtor.name}</strong> owes <strong>${creditor.name}</strong>: <span style="color: var(--danger-color); font-weight: bold;">$${amount.toFixed(2)}</span>`;
        debtsList.appendChild(li);
        
        debtor.amount -= amount;
        creditor.amount -= amount;
        
        if (debtor.amount < 0.001) i++;
        if (creditor.amount < 0.001) j++;
    }

    if (debtsList.children.length === 0) {
        debtsList.innerHTML = '<li>No debts to settle!</li>';
    }
}

// Expose functions to global scope for inline onclick handlers
window.addBuyIn = addBuyIn;
window.removeBuyIn = removeBuyIn;

// Boot
init();
