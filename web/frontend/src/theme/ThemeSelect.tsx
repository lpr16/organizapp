import React from 'react';
import { THEMES } from './themes';
import { useTheme } from './ThemeProvider';
import { ui } from './ui';

export const ThemeSelect: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <label className="flex items-center gap-2 text-sm text-muted shrink-0">
      <span className="sr-only">Color theme</span>
      <select
        value={theme}
        onChange={(e) => setTheme(e.target.value as typeof theme)}
        className={`${ui.field} w-auto py-1.5 pr-8`}
        aria-label="Color theme"
      >
        {THEMES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </label>
  );
};
