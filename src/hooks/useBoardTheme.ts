import { useState, useEffect } from 'react';
import { BOARD_THEMES, BoardTheme } from '@/components/chess/BoardThemeSelector';

const STORAGE_KEY = 'chess_board_theme';

export function useBoardTheme() {
  const [themeId, setThemeId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY) || 'classic';
  });

  const theme = BOARD_THEMES.find(t => t.id === themeId) || BOARD_THEMES[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, themeId);
    
    // Update CSS variables
    document.documentElement.style.setProperty('--chess-light', theme.light);
    document.documentElement.style.setProperty('--chess-dark', theme.dark);
  }, [themeId, theme]);

  const setTheme = (id: string) => {
    setThemeId(id);
  };

  return { themeId, theme, setTheme };
}
