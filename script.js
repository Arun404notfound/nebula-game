// Game Configuration
const gameConfig = {
    difficulties: {
        novice: { maxRange: 100, guesses: 5, hintLevel: 'basic' },
        explorer: { maxRange: 1000, guesses: 7, hintLevel: 'moderate' },
        cosmonaut: { maxRange: 10000, guesses: 10, hintLevel: 'advanced' }
    },
    customRangeMax: 100000
};

// Game State
let gameState = {
    targetNumber: 0,
    maxNumber: 100,
    guessesLeft: 0,
    guesses: [],
    difficulty: 'novice',
    hintLevel: 'basic',
    gameActive: false
};

// DOM Elements
const elements = {
    setupScreen: document.getElementById('setup-screen'),
    gameScreen: document.getElementById('game-screen'),
    resultModal: document.getElementById('result-modal'),
    difficultyCards: document.querySelectorAll('.difficulty-card'),
    customMaxInput: document.getElementById('custom-max'),
    customStartBtn: document.getElementById('custom-start'),
    rangeDisplay: document.getElementById('range-display'),
    guessesLeftDisplay: document.getElementById('guesses-left'),
    userGuessInput: document.getElementById('user-guess'),
    submitGuessBtn: document.getElementById('submit-guess'),
    hintBox: document.getElementById('hint-box'),
    guessHistory: document.getElementById('guess-history'),
    resultTitle: document.getElementById('result-title'),
    resultMessage: document.getElementById('result-message'),
    resultIcon: document.getElementById('result-icon'),
    playAgainBtn: document.getElementById('play-again')
};

// Initialize Particles.js
particlesJS('particles-js', {
    particles: {
        number: { value: 80, density: { enable: true, value_area: 800 } },
        color: { value: "#6e00ff" },
        shape: { type: "circle" },
        opacity: { value: 0.5, random: true },
        size: { value: 3, random: true },
        line_linked: { enable: true, distance: 150, color: "#6e00ff", opacity: 0.4, width: 1 },
        move: { enable: true, speed: 2, direction: "none", random: true, straight: false, out_mode: "out" }
    },
    interactivity: {
        detect_on: "canvas",
        events: {
            onhover: { enable: true, mode: "repulse" },
            onclick: { enable: true, mode: "push" }
        }
    }
});

// Initialize Game
function initGame() {
    setupEventListeners();
    console.log('Game initialized');
}

// Event Listeners
function setupEventListeners() {
    // Difficulty selection
    elements.difficultyCards.forEach(card => {
        card.addEventListener('click', () => {
            const difficulty = card.dataset.difficulty;
            startGame(gameConfig.difficulties[difficulty].maxRange, difficulty);
        });
    });

    // Custom game
    elements.customStartBtn.addEventListener('click', startCustomGame);
    elements.customMaxInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') startCustomGame();
    });

    // Gameplay
    elements.submitGuessBtn.addEventListener('click', processGuess);
    elements.userGuessInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') processGuess();
    });

    // Play again
    elements.playAgainBtn.addEventListener('click', resetGame);
}

// Game Functions
function startGame(maxNumber, difficulty) {
    gameState = {
        targetNumber: generateRandomNumber(maxNumber),
        maxNumber,
        guessesLeft: gameConfig.difficulties[difficulty]?.guesses || calculateCustomGuesses(maxNumber),
        guesses: [],
        difficulty,
        hintLevel: gameConfig.difficulties[difficulty]?.hintLevel || calculateCustomHintLevel(maxNumber),
        gameActive: true
    };

    updateGameUI();
    animateScreenTransition(elements.setupScreen, elements.gameScreen);
    elements.userGuessInput.focus();
}

function startCustomGame() {
    const max = parseInt(elements.customMaxInput.value);
    if (max >= 1 && max <= gameConfig.customRangeMax) {
        const difficulty = 'custom';
        startGame(max, difficulty);
    } else {
        alert(`Please enter a number between 1 and ${gameConfig.customRangeMax}`);
    }
}

function calculateCustomGuesses(maxNumber) {
    return Math.min(15, Math.max(5, Math.floor(Math.log2(maxNumber)) + 5));
}

function calculateCustomHintLevel(maxNumber) {
    if (maxNumber <= 100) return 'basic';
    if (maxNumber <= 1000) return 'moderate';
    return 'advanced';
}

function generateRandomNumber(max) {
    return Math.floor(Math.random() * max) + 1;
}

function updateGameUI() {
    elements.rangeDisplay.textContent = `1-${gameState.maxNumber}`;
    elements.guessesLeftDisplay.textContent = gameState.guessesLeft;
    elements.userGuessInput.value = '';
    elements.hintBox.innerHTML = '<p>Your first guess will unlock cosmic hints...</p>';
    elements.guessHistory.innerHTML = '';
}

function processGuess() {
    if (!gameState.gameActive) return;

    const guess = parseInt(elements.userGuessInput.value);
    
    if (!validateGuess(guess)) return;

    gameState.guesses.push(guess);
    gameState.guessesLeft--;
    
    updateGameState(guess);

    if (guess === gameState.targetNumber) {
        endGame(true);
        return;
    }

    if (gameState.guessesLeft === 0) {
        endGame(false);
        return;
    }

    generateHint(guess);
}

function validateGuess(guess) {
    if (isNaN(guess)) {
        alert('Please enter a valid number');
        return false;
    }
    
    if (guess < 1 || guess > gameState.maxNumber) {
        alert(`Please enter a number between 1 and ${gameState.maxNumber}`);
        return false;
    }
    
    return true;
}

function updateGameState(guess) {
    elements.guessesLeftDisplay.textContent = gameState.guessesLeft;
    elements.userGuessInput.value = '';
    updateGuessHistory(guess);
}

function updateGuessHistory(guess) {
    const guessItem = document.createElement('div');
    guessItem.className = 'guess-item';
    
    if (guess === gameState.targetNumber) {
        guessItem.classList.add('correct');
        guessItem.innerHTML = `<i class="fas fa-check"></i> ${guess}`;
    } else if (guess > gameState.targetNumber) {
        guessItem.classList.add('high');
        guessItem.innerHTML = `<i class="fas fa-arrow-down"></i> ${guess}`;
    } else {
        guessItem.classList.add('low');
        guessItem.innerHTML = `<i class="fas fa-arrow-up"></i> ${guess}`;
    }
    
    elements.guessHistory.appendChild(guessItem);
}

async function generateHint(guess) {
    try {
        const response = await fetch('/get_hint', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                guess: guess,
                target: gameState.targetNumber,
                max_num: gameState.maxNumber,
                previous_guesses: gameState.guesses
            })
        });
        
        const data = await response.json();
        elements.hintBox.innerHTML = `<p>${data.hint}</p>`;
    } catch (error) {
        console.error('Error getting hint:', error);
        const localHint = HintGenerator.generate(
            guess, 
            gameState.targetNumber, 
            gameState.maxNumber, 
            gameState.hintLevel
        );
        elements.hintBox.innerHTML = `<p>${localHint}</p>`;
    }
}

function endGame(win) {
    gameState.gameActive = false;
    
    if (win) {
        elements.resultTitle.textContent = 'Mission Complete!';
        elements.resultMessage.textContent = `You discovered the cosmic number ${gameState.targetNumber} in ${gameState.guesses.length} attempts!`;
        elements.resultIcon.innerHTML = '<i class="fas fa-trophy"></i>';
    } else {
        elements.resultTitle.textContent = 'Mission Failed';
        elements.resultMessage.textContent = `The cosmic number was ${gameState.targetNumber}. Better luck next time!`;
        elements.resultIcon.innerHTML = '<i class="fas fa-satellite-dish"></i>';
    }
    
    elements.resultModal.classList.remove('hidden');
}

function resetGame() {
    elements.resultModal.classList.add('hidden');
    animateScreenTransition(elements.gameScreen, elements.setupScreen);
}

function animateScreenTransition(fromScreen, toScreen) {
    fromScreen.style.animation = 'fadeOut 0.5s ease-out forwards';
    setTimeout(() => {
        fromScreen.classList.add('hidden');
        toScreen.classList.remove('hidden');
        toScreen.style.animation = 'fadeIn 0.5s ease-out forwards';
    }, 500);
}

// Hint Generator
const HintGenerator = {
    basicHints: [
        (g, t, m) => {
            const diff = Math.abs(t - g);
            const percent = Math.round((diff / m) * 100);
            if (diff > m * 0.5) return `The number is in the ${t > m/2 ? 'upper' : 'lower'} half of the cosmos.`;
            if (diff > m * 0.2) return `You're ${diff > m * 0.3 ? 'far away' : 'getting closer'} (${percent}% distance).`;
            return `Very close! Within ${percent}% of the target.`;
        },
        (g, t) => {
            const factors = [2, 3, 5, 10].filter(d => t % d === 0);
            return factors.length > 0 
                ? `The cosmic number is divisible by ${factors.join(' or ')}.`
                : `The number isn't divisible by 2, 3, 5, or 10.`;
        },
        (g, t) => {
            const parity = t % 2 === 0 ? 'even' : 'odd';
            return `The number is ${parity}, and ${t > g ? 'higher' : 'lower'} than your guess.`;
        }
    ],
    
    moderateHints: [
        (g, t) => {
            const digitSum = t.toString().split('').reduce((a,b) => a + parseInt(b), 0);
            return `Digit sum: ${digitSum}. Square root between ${Math.floor(Math.sqrt(t))} and ${Math.ceil(Math.sqrt(t))}.`;
        },
        (g, t) => {
            const binary = t.toString(2);
            return `Binary code: ${binary.length} bits ${binary.length > 5 ? '(starts with ' + binary.slice(0,3) + '...)' : ''}`;
        },
        (g, t) => {
            const ratio = (g/t).toFixed(2);
            return `Your guess is ${ratio}x the target. ${t > g ? 'Aim higher.' : 'Aim lower.'}`;
        }
    ],
    
    advancedHints: [
        (g, t) => {
            const primeFactors = this.getPrimeFactors(t);
            return primeFactors.length > 1 
                ? `Prime factors: ${primeFactors.join(' × ')}`
                : `The number is a prime cosmic entity!`;
        },
        (g, t) => {
            const steps = this.collatzSteps(t);
            return `Collatz sequence reaches 1 in ${steps} steps.`;
        },
        (g, t) => {
            const hex = t.toString(16);
            return `Hexadecimal: 0x${hex}. Digit product: ${this.productOfDigits(t)}.`;
        }
    ],

    getPrimeFactors(num) {
        const factors = [];
        let divisor = 2;
        while (num >= 2) {
            while (num % divisor === 0) {
                factors.push(divisor);
                num /= divisor;
            }
            divisor++;
        }
        return factors;
    },
    
    collatzSteps(num) {
        let steps = 0;
        while (num !== 1) {
            num = num % 2 === 0 ? num / 2 : num * 3 + 1;
            steps++;
        }
        return steps;
    },
    
    productOfDigits(num) {
        return num.toString().split('').reduce((prod, digit) => prod * parseInt(digit), 1);
    },

    generate(guess, target, maxNumber, level) {
        let hint;
        switch(level) {
            case 'basic':
                hint = this.basicHints[Math.floor(Math.random() * this.basicHints.length)](guess, target, maxNumber);
                break;
            case 'moderate':
                hint = this.moderateHints[Math.floor(Math.random() * this.moderateHints.length)](guess, target);
                break;
            case 'advanced':
                hint = this.advancedHints[Math.floor(Math.random() * this.advancedHints.length)](guess, target);
                break;
        }
        return hint;
    }
};

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', initGame);