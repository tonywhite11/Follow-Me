import React, { useState, useEffect } from 'react';
import { GameColor, GameState } from './types';
import {
  COLORS_ORDER,
  SIMON_FLASH_DURATION_MS,
  SIMON_PAUSE_BETWEEN_FLASHES_MS,
  PLAYER_PRESS_FLASH_DURATION_MS,
  DELAY_BEFORE_NEXT_ROUND_MS,
  INITIAL_GAME_START_DELAY_MS
} from './constants';
import ColorButton from './components/ColorButton';

// Audio file mapping (all lowercase keys and filenames)
const AUDIO_PATHS: Record<string, string> = {
  red: '/audio/red.mp3',
  blue: '/audio/blue.mp3',
  green: '/audio/green.mp3',
  yellow: '/audio/yellow.mp3',
  fail: '/audio/fail.mp3',
  start: '/audio/game-start.mp3',
  gameover: '/audio/gameover-off.mp3',
};

// Simple playSound function with case normalization
const playSound = (sound: string) => {
  const src = AUDIO_PATHS[sound.toLowerCase()];
  if (src) {
    const audio = new Audio(src);
    audio.play().catch(error => {
      console.error(`Failed to play ${sound} sound:`, error);
    });
  } else {
    console.error(`No audio path found for sound: ${sound}`);
  }
};

const PLAYER_TIMEOUT_MS = 5000; // 5 seconds to press a button

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [sequence, setSequence] = useState<GameColor[]>([]);
  const [playerSequence, setPlayerSequence] = useState<GameColor[]>([]);
  const [litColor, setLitColor] = useState<GameColor | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Press Start to Play!');
  const [showInstructions, setShowInstructions] = useState<boolean>(false);

  // Add a new color to Simon's sequence
  const simonAddsColor = () => {
    const randomColorIndex = Math.floor(Math.random() * COLORS_ORDER.length);
    const newColor = COLORS_ORDER[randomColorIndex];
    setSequence(prevSeq => [...prevSeq, newColor]);
  };

  // Simon's turn logic
  useEffect(() => {
    if (gameState === 'SIMON_TURN') {
      if (sequence.length === score) {
        setTimeout(() => {
          simonAddsColor();
        }, sequence.length === 0 ? INITIAL_GAME_START_DELAY_MS : DELAY_BEFORE_NEXT_ROUND_MS / 2);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, score, sequence.length]);

  // Display Simon's sequence
  useEffect(() => {
    if (gameState === 'SIMON_TURN' && sequence.length > 0 && sequence.length > playerSequence.length) {
      setFeedbackMessage("Simon's turn...");
      const timeouts: NodeJS.Timeout[] = [];
      let i = 0;

      const playNextInSequence = () => {
        if (i < sequence.length) {
          setLitColor(sequence[i]);
          playSound(sequence[i]);
          timeouts.push(setTimeout(() => {
            setLitColor(null);
            i++;
            if (i < sequence.length) {
              timeouts.push(setTimeout(playNextInSequence, SIMON_PAUSE_BETWEEN_FLASHES_MS));
            } else {
              setGameState('PLAYER_TURN');
              setPlayerSequence([]);
              setFeedbackMessage('Your turn!');
            }
          }, SIMON_FLASH_DURATION_MS));
        }
      };

      const initialDisplayDelay =
        sequence.length - score === 1 && score > 0
          ? SIMON_PAUSE_BETWEEN_FLASHES_MS
          : INITIAL_GAME_START_DELAY_MS;
      timeouts.push(setTimeout(playNextInSequence, initialDisplayDelay));

      return () => {
        timeouts.forEach(clearTimeout);
        setLitColor(null);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState, sequence]);

  // Player inactivity timer
  useEffect(() => {
    if (gameState !== 'PLAYER_TURN') return;

    const timeout = setTimeout(() => {
      setFeedbackMessage('Time out! Game Over.');
      playSound('fail');
      setTimeout(() => playSound('gameover'), 400);
      setGameState('GAME_OVER');
    }, PLAYER_TIMEOUT_MS);

    return () => clearTimeout(timeout);
  }, [gameState, playerSequence]);

  // Handle player input
  const handlePlayerInput = (color: GameColor) => {
    if (gameState !== 'PLAYER_TURN' || litColor) return;
    setLitColor(color);
    playSound(color);
    setTimeout(() => setLitColor(null), PLAYER_PRESS_FLASH_DURATION_MS);

    const newPlayerSequence = [...playerSequence, color];
    setPlayerSequence(newPlayerSequence);

    // Check correctness
    if (newPlayerSequence[newPlayerSequence.length - 1] !== sequence[newPlayerSequence.length - 1]) {
      setFeedbackMessage(`Game Over! Final Score: ${score}`);
      if (score > highScore) {
        setHighScore(score);
      }
      playSound('fail');
      setTimeout(() => playSound('gameover'), 400);
      setGameState('GAME_OVER');
      return;
    }

    // Correct, and sequence complete for this round
    if (newPlayerSequence.length === sequence.length) {
      const newScore = sequence.length;
      setScore(newScore);
      setFeedbackMessage(`Correct! Level ${newScore} passed.`);
      setTimeout(() => {
        setPlayerSequence([]);
        setGameState('SIMON_TURN');
      }, DELAY_BEFORE_NEXT_ROUND_MS);
    }
  };

  // Start game
  const startGame = () => {
    setGameState('IDLE');
    setSequence([]);
    setPlayerSequence([]);
    setScore(0);
    setLitColor(null);
    setFeedbackMessage("Get Ready...");
    playSound('start');
    setTimeout(() => {
      setGameState('SIMON_TURN');
    }, INITIAL_GAME_START_DELAY_MS / 2);
  };

  const isButtonDisabled = gameState !== 'PLAYER_TURN' || !!litColor;

  return (
    <div className="flex flex-col items-center justify-center p-4 min-h-screen w-full max-w-lg mx-auto text-center">
      <header className="mb-6 w-full">
        {/* How to Play Button */}
        <button
          onClick={() => setShowInstructions(true)}
          className="mb-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          How to Play
        </button>
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
            }
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
          <div className="h-12"></div>
        )}
      </footer>

      {/* Instructions Modal */}
      {showInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close"
            >
              &times;
            </button>
            <h2 className="text-2xl font-bold mb-4 text-gray-800">How to Play</h2>
            <ul className="text-gray-700 list-disc pl-5 space-y-2 text-left">
              <li>Press <b>Start Game</b> to begin.</li>
              <li>Watch the sequence of lights and sounds.</li>
              <li>Repeat the sequence by clicking the colored buttons in order.</li>
              <li>If you make a mistake or run out of time, the game ends.</li>
              <li>Try to beat your high score!</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;