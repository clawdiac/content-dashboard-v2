import React from 'react';

export default function Sidebar({ statusFilter, onStatusChange, filters, onFiltersChange }) {
  const statuses = ['All', 'APPROVED', 'REJECTED', 'CLOSE'];

  return (
    <aside className="hidden md:flex w-64 bg-slate-800 border-r border-slate-700 p-6 flex-col gap-6 overflow-y-auto">
      {/* Navigation */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-400 uppercase">Status</h3>
        <div className="space-y-2">
          {statuses.map(status => (
            <button
              key={status}
              onClick={() => onStatusChange(status)}
              className={`w-full px-4 py-2 rounded-lg text-left font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              {status === 'APPROVED' && '✅'} {status === 'REJECTED' && '❌'} {status === 'CLOSE' && '⚠️'} {status}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase">Filters</h3>

        {/* Search */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">Search</label>
          <input
            type="text"
            placeholder="Filename..."
            value={filters.search || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, search: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Date Range */}
        <div>
          <label className="block text-sm text-slate-300 mb-2">From Date</label>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, from: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">To Date</label>
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) =>
              onFiltersChange({ ...filters, to: e.target.value })
            }
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Clear Button */}
        <button
          onClick={() =>
            onFiltersChange({
              status: null,
              batch: null,
              from: null,
              to: null,
              search: '',
            })
          }
          className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-medium transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Help */}
      <div className="mt-auto pt-6 border-t border-slate-700 text-xs text-slate-400 space-y-1">
        <p className="font-semibold">Keyboard Shortcuts:</p>
        <p>A = Approve</p>
        <p>R = Reject</p>
        <p>F = Feedback</p>
        <p>ESC = Close</p>
      </div>
    </aside>
  );
}
