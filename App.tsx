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

// Audio file mapping (make sure your files are all lowercase in /public/audio/)
const AUDIO_PATHS: Record<string, string> = {
  RED: '/audio/red.mp3',
  BLUE: '/audio/blue.mp3',
  GREEN: '/audio/green.mp3',
  YELLOW: '/audio/yellow.mp3',
  fail: '/audio/fail.mp3',
  start: '/audio/game-start.mp3',
  gameover: '/audio/gameover-off.mp3',
};

// Simple playSound function with logging for debugging
const playSound = (sound: string) => {
  const src = AUDIO_PATHS[sound];
  if (src) {
    const audio = new Audio(src);
    audio.play().catch(error => {
      console.error(`Failed to play ${sound} sound:`, error);
    });
  } else {
    console.error(`No audio path found for sound: ${sound}`);
  }
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [sequence, setSequence] = useState<GameColor[]>([]);
  const [playerSequence, setPlayerSequence] = useState<GameColor[]>([]);
  const [litColor, setLitColor] = useState<GameColor | null>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(0);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('Press Start to Play!');

  // Add a new color to Simon's sequence
  const simonAddsColor = () => {
    const randomColorIndex = Math.floor(Math.random() * COLORS_ORDER.length);
    const newColor = COLORS_ORDER[randomColorIndex];
    setSequence(prevSeq => [...prevSeq, newColor]);
  };

  // Add this temporarily to test file existence
useEffect(() => {
  COLORS_ORDER.forEach(color => {
    const audio = new Audio(AUDIO_PATHS[color]);
    audio.addEventListener('canplaythrough', () => {
      console.log(`${color} audio loaded successfully`);
    });
    audio.addEventListener('error', (e) => {
      console.error(`Failed to load ${color} audio:`, e);
    });
  });
}, []);

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
    </div>
  );
};

export default App;