
import React from 'react';
import { GameColor } from '../types';
import { COLOR_CONFIGS } from '../constants';

interface ColorButtonProps {
  gameColor: GameColor;
  onClick: (color: GameColor) => void;
  isLit: boolean;
  disabled: boolean;
  className?: string;
}

const ColorButton: React.FC<ColorButtonProps> = ({ gameColor, onClick, isLit, disabled, className }) => {
  const config = COLOR_CONFIGS[gameColor];

  const buttonClasses = `
    w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 m-2 rounded-full
    focus:outline-none transition-all duration-150 ease-in-out
    transform active:scale-95
    ${isLit ? config.activeClass : config.baseClass}
    ${disabled && !isLit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className || ''}
  `;

  return (
    <button
      type="button"
      onClick={() => !disabled && onClick(gameColor)}
      disabled={disabled}
      className={buttonClasses}
      aria-label={`Simon button ${gameColor.toLowerCase()}`}
    />
  );
};

export default ColorButton;
    