
export enum GameColor {
  RED = 'RED',
  GREEN = 'GREEN',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
}

export type GameState = 'IDLE' | 'SIMON_TURN' | 'PLAYER_TURN' | 'GAME_OVER';

export interface ColorButtonConfig {
  color: GameColor;
  baseClass: string;
  activeClass: string;
  sound?: string; // For future sound implementation
}
    