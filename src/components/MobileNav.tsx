import React from 'react';
import { TabPage } from '../types';
import { NAV_ITEMS } from './Sidebar';

interface MobileNavProps {
  currentPage: TabPage;
  onSelectPage: (page: TabPage) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentPage, onSelectPage }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 z-40 px-2 py-2 flex items-center gap-1 overflow-x-auto scrollbar-none">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectPage(item.id)}
            className={`flex flex-col items-center justify-center min-w-[68px] px-2 py-1.5 rounded-lg text-[10px] font-medium transition shrink-0 ${
              isActive ? 'text-blue-400 bg-blue-500/10 font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className="w-5 h-5 mb-0.5 shrink-0" />
            <span className="truncate max-w-[64px]">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
