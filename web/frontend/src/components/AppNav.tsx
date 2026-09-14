import React from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, Home, Columns3, FolderKanban, Workflow, Wallet, CalendarDays, Leaf } from 'lucide-react';
import { ThemeSelect } from '../theme/ThemeSelect';
import { ui } from '../theme/ui';

const links = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, end: false },
  { to: '/board', label: 'Kanban', icon: Columns3, end: false },
  { to: '/seasons', label: 'Seasons', icon: Leaf, end: false },
  { to: '/projects', label: 'Projects', icon: FolderKanban, end: false },
  { to: '/finance', label: 'Finance', icon: Wallet, end: false },
  { to: '/diagrams', label: 'BPMN', icon: Workflow, end: false },
];

export const AppNav: React.FC = () => {
  return (
    <nav className="sticky top-0 z-50 bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-md bg-accent text-accent-fg flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <span className="font-semibold text-fg tracking-tight">OrganizApp</span>
        </NavLink>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                title={label}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 px-2 xl:px-3 py-1.5 rounded-md text-sm font-medium ${
                    isActive ? ui.navActive : ui.navIdle
                  }`
                }
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden xl:inline">{label}</span>
              </NavLink>
            ))}
          </div>
          <ThemeSelect />
        </div>
      </div>
    </nav>
  );
};
