import React from 'react';
import { Shield, Activity, Cpu, Layers, FileCode, RefreshCw } from 'lucide-react';
import type { TabType } from '../types';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  isSimulating: boolean;
  onResetSystem: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isSimulating,
  onResetSystem
}) => {
  const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Command Center', icon: <Activity className="w-4 h-4" /> },
    { id: 'chaos', label: 'Chaos Workbench', icon: <Cpu className="w-4 h-4" /> },
    { id: 'industry', label: '20 Industry Scenarios', icon: <Layers className="w-4 h-4" /> },
    { id: 'architecture', label: 'Architecture & ADRs', icon: <Shield className="w-4 h-4" /> },
    { id: 'api', label: 'API & Sequence Flows', icon: <FileCode className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-slate-950 font-black text-xl">
            <Shield className="w-6 h-6 text-slate-950 fill-cyan-300" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                STORMSHIELD
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-700/50 rounded-full">
                SALESTORM 2026
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-Concurrency Resource Protection & Transaction Control Platform
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-300 font-medium">Invariant Guard:</span>
          <span className="text-emerald-400 font-bold font-mono">0.00% Oversubscribed</span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-400">ACID Boundary Active</span>
        </div>

        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap ${
                activeTab === item.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}

          <button
            onClick={onResetSystem}
            disabled={isSimulating}
            title="Reset Simulation State"
            className="p-1.5 ml-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isSimulating ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
