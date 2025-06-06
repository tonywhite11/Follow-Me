
import { GameColor, ColorButtonConfig } from './types';

export const COLORS_ORDER: GameColor[] = [GameColor.GREEN, GameColor.RED, GameColor.YELLOW, GameColor.BLUE];

export const COLOR_CONFIGS: Record<GameColor, ColorButtonConfig> = {
  [GameColor.GREEN]: {
    color: GameColor.GREEN,
    baseClass: 'bg-green-500 hover:bg-green-600',
    activeClass: 'bg-green-400 simon-button-active-shadow text-green-400',
  },
  [GameColor.RED]: {
    color: GameColor.RED,
    baseClass: 'bg-red-500 hover:bg-red-600',
    activeClass: 'bg-red-400 simon-button-active-shadow text-red-400',
  },
  [GameColor.YELLOW]: {
    color: GameColor.YELLOW,
    baseClass: 'bg-yellow-500 hover:bg-yellow-600',
    activeClass: 'bg-yellow-400 simon-button-active-shadow text-yellow-400',
  },
  [GameColor.BLUE]: {
    color: GameColor.BLUE,
    baseClass: 'bg-blue-500 hover:bg-blue-600',
    activeClass: 'bg-blue-400 simon-button-active-shadow text-blue-400',
  },
};

export const SIMON_FLASH_DURATION_MS = 350;
export const SIMON_PAUSE_BETWEEN_FLASHES_MS = 200;
export const PLAYER_PRESS_FLASH_DURATION_MS = 150;
export const DELAY_BEFORE_NEXT_ROUND_MS = 1000;
export const INITIAL_GAME_START_DELAY_MS = 500;
    