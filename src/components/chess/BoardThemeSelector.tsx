import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Palette } from 'lucide-react';

export interface BoardTheme {
  id: string;
  name: string;
  light: string;
  dark: string;
}

export const BOARD_THEMES: BoardTheme[] = [
  { id: 'classic', name: 'Classic', light: '35 30% 75%', dark: '25 25% 35%' },
  { id: 'wooden', name: 'Wooden', light: '30 40% 70%', dark: '25 45% 30%' },
  { id: 'dark', name: 'Dark', light: '220 15% 35%', dark: '220 20% 18%' },
  { id: 'neon', name: 'Neon', light: '180 50% 40%', dark: '280 60% 25%' },
  { id: 'forest', name: 'Forest', light: '120 25% 50%', dark: '140 30% 25%' },
  { id: 'ocean', name: 'Ocean', light: '200 40% 60%', dark: '210 50% 30%' },
];

interface BoardThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export function BoardThemeSelector({ currentTheme, onThemeChange }: BoardThemeSelectorProps) {
  const current = BOARD_THEMES.find(t => t.id === currentTheme) || BOARD_THEMES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          {current.name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover border-border z-50">
        {BOARD_THEMES.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <div className="flex gap-1">
              <div
                className="w-4 h-4 rounded-sm border border-border"
                style={{ backgroundColor: `hsl(${theme.light})` }}
              />
              <div
                className="w-4 h-4 rounded-sm border border-border"
                style={{ backgroundColor: `hsl(${theme.dark})` }}
              />
            </div>
            <span className={currentTheme === theme.id ? 'font-semibold' : ''}>
              {theme.name}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
