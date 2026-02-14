import React from 'react';

export default function Header({ onRefresh, onToggleTheme, theme, stats }) {
  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-700 shadow-lg">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-50">
            🖼️ ComfyUI Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-6">
          {/* Stats Summary */}
          <div className="flex gap-6 text-sm font-medium text-slate-300">
            <div className="flex flex-col">
              <span className="text-slate-400">Total</span>
              <span className="text-lg font-bold text-slate-50">{stats.total}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Approved</span>
              <span className="text-lg font-bold text-green-600">{stats.approved}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Rejected</span>
              <span className="text-lg font-bold text-red-600">{stats.rejected}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-400">Pending</span>
              <span className="text-lg font-bold text-yellow-500">
                {stats.total - (stats.approved + stats.rejected + (stats.close || 0))}
              </span>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            title="Refresh images (F5)"
          >
            🔄 Refresh
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-medium transition-colors"
            title="Toggle dark/light mode"
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>
      </div>
    </header>
  );
}
