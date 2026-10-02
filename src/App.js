import { useEffect, useState } from 'react';
import './App.css';

const GAME_LENGTH = 30;
const LISTERIA_DOUBLING_INTERVAL = 3000;
const INITIAL_LISTERIA_COUNT = 15;
const GRID_SIZE = 10;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;
const HELP_PROMPT_THRESHOLD = Math.ceil(CELL_COUNT * 0.95);

function getRandomEmptyCells(count, occupiedCells = []) {
  const occupied = new Set(occupiedCells);
  const emptyCells = Array.from({ length: CELL_COUNT }, (_, cell) => cell)
    .filter((cell) => !occupied.has(cell));

  for (let index = emptyCells.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [emptyCells[index], emptyCells[swapIndex]] = [emptyCells[swapIndex], emptyCells[index]];
  }

  return emptyCells.slice(0, count);
}

function App() {
  const [gameState, setGameState] = useState('ready');
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_LENGTH);
  const [listeriaCells, setListeriaCells] = useState([]);
  const [growthStopped, setGrowthStopped] = useState(false);
  const [tagHelpUsed, setTagHelpUsed] = useState(false);
  const [helpPromptDismissed, setHelpPromptDismissed] = useState(false);
  const [cleanPromptDismissed, setCleanPromptDismissed] = useState(false);

  useEffect(() => {
    if (gameState !== 'playing') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((time) => Math.max(0, time - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== 'playing' || growthStopped) {
      return undefined;
    }

    const growthTimer = window.setInterval(() => {
      setListeriaCells((currentCells) => {
        const newCellCount = Math.min(currentCells.length, CELL_COUNT - currentCells.length);
        return [...currentCells, ...getRandomEmptyCells(newCellCount, currentCells)];
      });
    }, LISTERIA_DOUBLING_INTERVAL);

    return () => window.clearInterval(growthTimer);
  }, [gameState, growthStopped]);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft === 0) {
      setListeriaCells([]);
      setGameState('finished');
    }
  }, [gameState, timeLeft]);

  function startGame() {
    setScore(0);
    setTimeLeft(GAME_LENGTH);
    setListeriaCells(getRandomEmptyCells(INITIAL_LISTERIA_COUNT));
    setGrowthStopped(false);
    setTagHelpUsed(false);
    setHelpPromptDismissed(false);
    setCleanPromptDismissed(false);
    setGameState('playing');
  }

  function tapListeria(cell) {
    if (gameState !== 'playing' || !listeriaCells.includes(cell)) {
      return;
    }

    setScore((currentScore) => currentScore + 1);
    setListeriaCells((currentCells) => currentCells.filter((currentCell) => currentCell !== cell));
  }

  function askTagForHelp() {
    setListeriaCells((currentCells) => currentCells.slice(0, 1));
    setGrowthStopped(true);
    setTagHelpUsed(true);
  }

  function dismissHelpPrompt() {
    setHelpPromptDismissed(true);
  }

  function dismissCleanPrompt() {
    setCleanPromptDismissed(true);
  }

  const showHelpPrompt = gameState === 'playing'
    && listeriaCells.length >= HELP_PROMPT_THRESHOLD
    && !helpPromptDismissed;
  const showCleanPrompt = gameState === 'playing'
    && listeriaCells.length === 0
    && !cleanPromptDismissed;

  const statusMessage = {
    ready: 'Can you get your plant TAG clean?',
    playing: 'Tap the Listeria to clean it up before your problem gets out of hand',
    finished: 'Time is up! Want to play again?',
  }[gameState];

  return (
    <main className="game-page">
      <section className="game-card" aria-labelledby="game-title">
        <header className="game-header">
          <img className="brand-logo" src="/tag-logo.jpeg" alt="The Acheson Group (TAG)" />
          <p className="eyebrow">THE MICROBE GAME</p>
          <h1 id="game-title">Listeria Dash</h1>
          <p className="game-description">{statusMessage}</p>
        </header>

        <div className="scoreboard" role="group" aria-label="Listeria statistics">
          <div className="stat">
            <span className="stat-label">Listeria Detected</span>
            <strong aria-live="polite">{score}</strong>
          </div>
          <div className="stat-divider" aria-hidden="true" />
          <div className="stat">
            <span className="stat-label">Listeria Contamination</span>
            <strong aria-live="polite">{listeriaCells.length}</strong>
          </div>
        </div>

        <div className="grid-board" role="group" aria-label="10 by 10 Listeria game grid">
          {Array.from({ length: CELL_COUNT }, (_, cell) => {
            const hasListeria = gameState === 'playing' && listeriaCells.includes(cell);
            return (
              <button
                className={`grid-cell${hasListeria ? ' cell-active' : ''}`}
                key={cell}
                type="button"
                onClick={() => tapListeria(cell)}
                aria-label={hasListeria ? 'Tap a Listeria' : `Empty cell ${cell + 1}`}
              >
                {hasListeria && (
                  <img className="listeria" src="/listeria.svg" alt="" />
                )}
              </button>
            );
          })}
        </div>

        <button className="game-button" type="button" onClick={startGame}>
          {gameState === 'ready' ? 'Start game' : gameState === 'playing' ? 'Restart game' : 'Play again'}
          <span aria-hidden="true"> ↗</span>
        </button>
        <p className="how-to-play">Tap the cartoon Listeria to move it from your equipment. Can you get your plant clean in time?</p>
      </section>
      <p className="footer-note">A little microbe hunt, one tap at a time.</p>
      {showHelpPrompt && (
        <div className="modal-backdrop help-backdrop">
          <section
            className="help-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="help-dialog-title"
          >
            <h2 id="help-dialog-title">Ask TAG for help</h2>
            <div className="help-dialog-actions">
              <button className="help-button help-button-yes" type="button" onClick={askTagForHelp}>
                Yes
              </button>
              <button className="help-button" type="button" onClick={dismissHelpPrompt}>
                No
              </button>
            </div>
          </section>
        </div>
      )}
      {showCleanPrompt && (
        <div className="modal-backdrop">
          <section
            className="help-dialog clean-dialog"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="clean-dialog-title"
          >
            <div className="celebration-icon" aria-hidden="true">🎉</div>
            <h2 id="clean-dialog-title">Your Plant is Clean</h2>
            {tagHelpUsed && (
              <p className="tag-clean-message">There's clean and then there's TAG clean</p>
            )}
            <button className="help-button help-button-yes" type="button" onClick={dismissCleanPrompt}>
              Hooray!
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

export default App;
