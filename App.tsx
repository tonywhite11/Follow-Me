
import React, { useState, useEffect, useCallback } from 'react';
import { GameColor, GameState } from './types';
import {
  COLORS_ORDER,
  COLOR_CONFIGS,
  SIMON_FLASH_DURATION_MS,
  SIMON_PAUSE_BETWEEN_FLASHES_MS,
  PLAYER_PRESS_FLASH_DURATION_MS,
  DELAY_BEFORE_NEXT_ROUND_MS,
  INITIAL_GAME_START_DELAY_MS
} from './constants';
import ColorButton from './components/ColorButton';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [sequence, setSequence] = useState<GameColor[]>([]);
  const [playerSequence, setPlayerSequence] = useState<GameColor[]>([]);
  const [litColor, setLitColor] = useState<GameColor | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Press Start to Play!');

  // Utility to add a new color to Simon's sequence
  const simonAddsColor = useCallback(() => {
    const randomColorIndex = Math.floor(Math.random() * COLORS_ORDER.length);
    const newColor = COLORS_ORDER[randomColorIndex];
    setSequence(prevSeq => [...prevSeq, newColor]);
  }, []);

  // Effect for Simon's turn logic (adding color and initiating display)
  useEffect(() => {
    if (gameState === 'SIMON_TURN') {
      // If sequence length matches current score, it means player just completed a level or it's the first turn.
      if (sequence.length === score) {
         setTimeout(() => {
            simonAddsColor();
         }, sequence.length === 0 ? INITIAL_GAME_START_DELAY_MS : DELAY_BEFORE_NEXT_ROUND_MS / 2); // shorter delay if first, longer between rounds
      }
      // If sequence is already longer (e.g., after simonAddsColor), the display effect will handle it.
    }
  }, [gameState, score, sequence.length, simonAddsColor]);


  // Effect for displaying Simon's sequence
  useEffect(() => {
    if (gameState === 'SIMON_TURN' && sequence.length > 0 && sequence.length > playerSequence.length) { // Ensures it plays new part of sequence
      setFeedbackMessage("Simon's turn...");
      const timeouts: NodeJS.Timeout[] = [];
      let i = 0;

      const playNextInSequence = () => {
        if (i < sequence.length) {
          setLitColor(sequence[i]);
          timeouts.push(setTimeout(() => {
            setLitColor(null);
            i++;
            if (i < sequence.length) {
              timeouts.push(setTimeout(playNextInSequence, SIMON_PAUSE_BETWEEN_FLASHES_MS));
            } else {
              // Sequence finished displaying
              setGameState('PLAYER_TURN');
              setPlayerSequence([]);
              setFeedbackMessage('Your turn!');
            }
          }, SIMON_FLASH_DURATION_MS));
        }
      };
      
      // Delay before starting sequence display, especially if it's not the very first color added in this turn
      const initialDisplayDelay = (sequence.length - score === 1 && score > 0) ? SIMON_PAUSE_BETWEEN_FLASHES_MS : INITIAL_GAME_START_DELAY_MS;
      timeouts.push(setTimeout(playNextInSequence, initialDisplayDelay));
      
      return () => {
        timeouts.forEach(clearTimeout);
        setLitColor(null); // Ensure lit color is cleared on cleanup
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, sequence]); // Runs when sequence updates during Simon's turn


  const handlePlayerInput = (color: GameColor) => {
    if (gameState !== 'PLAYER_TURN' || litColor) return; // Prevent input if not player's turn or Simon is flashing

    setLitColor(color);
    setTimeout(() => setLitColor(null), PLAYER_PRESS_FLASH_DURATION_MS);

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    // Check correctness
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      // Mistake
      setFeedbackMessage(`Game Over! Final Score: ${score}`);
      if (score > highScore) {
        setHighScore(score);
      }
      setGameState('GAME_OVER');
      return;
    }

    // Correct, and sequence complete for this round
    if (newPlayerSequence.length === sequence.length) {
      const newScore = sequence.length;
      setScore(newScore);
      setFeedbackMessage(`Correct! Level ${newScore} passed.`);
      // Transition to Simon's turn after a delay
      setTimeout(() => {
        setPlayerSequence([]); // Reset for Simon's display logic check
        setGameState('SIMON_TURN');
      }, DELAY_BEFORE_NEXT_ROUND_MS);
    }
  };

  const startGame = () => {
    setGameState('IDLE'); // Reset to IDLE first to ensure clean state transitions
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setLitColor(null);
    setFeedbackMessage("Get Ready...");
    // Transition to SIMON_TURN, which will trigger effects to add first color and play
    setTimeout(() => {
        setGameState('SIMON_TURN');
    }, INITIAL_GAME_START_DELAY_MS / 2);
  };
  
  const isButtonDisabled = gameState !== 'PLAYER_TURN' || !!litColor;

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen w-full max-w-lg mx-auto text-center">
      <header className="mb-6 w-full">
        <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 mb-2">
          Simon Challenge
        </h1>
        <div className="flex justify-around w-full text-lg sm:text-xl">
          <p>Score: <span className="font-semibold text-yellow-400">{score}</span></p>
          <p>High Score: <span className="font-semibold text-green-400">{highScore}</span></p>
        </div>
      </header>

      <div className="mb-6 h-10">
        <p className="text-xl text-gray-300">{feedbackMessage}</p>
      </div>

      <main className="grid grid-cols-2 gap-2 sm:gap-4 mb-8 relative">
        {COLORS_ORDER.map((gameColor, index) => (
          <ColorButton
            key={gameColor}
            gameColor={gameColor}
            onClick={handlePlayerInput}
            isLit={litColor === gameColor}
            disabled={isButtonDisabled}
            className={
              index === 0 ? 'rounded-tl-full' : 
              index === 1 ? 'rounded-tr-full' : 
              index === 2 ? 'rounded-bl-full' : 
              'rounded-br-full'
            } // Specific rounding for a more classic Simon look
          />
        ))}
        {/* Central circle aesthetic */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gray-800 rounded-full border-4 border-gray-700 shadow-inner"></div>
        </div>
      </main>

      <footer className="w-full">
        {gameState === 'IDLE' || gameState === 'GAME_OVER' ? (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg text-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50"
          >
            {gameState === 'GAME_OVER' ? 'Play Again?' : 'Start Game'}
          </button>
        ) : (
          <div className="h-12"> {/* Placeholder to prevent layout shift */} </div>
        )}
      </footer>
    </div>
  );
};

export default App;
    