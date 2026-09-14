import React from 'react';
import { Outlet } from 'react-router-dom';
import { AppNav } from '../components/AppNav';
import { ui } from '../theme/ui';

export const AppLayout: React.FC = () => {
  return (
    <div className={`min-h-screen flex flex-col ${ui.canvas}`}>
      <AppNav />
      <div className="flex-1 flex flex-col min-h-0">
        <Outlet />
      </div>
    </div>
  );
};
