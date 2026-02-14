import React from 'react';

export default function SearchFilters({
  filters,
  onFiltersChange,
  statusFilter,
  onStatusChange,
}) {
  return (
    <div className="bg-slate-800 border-b border-slate-700 p-4 flex flex-wrap gap-4 items-end">
      {/* Search Input */}
      <div className="flex-1 min-w-48">
        <label className="block text-xs text-slate-400 mb-1 uppercase">Search</label>
        <input
          type="text"
          placeholder="Filename..."
          value={filters.search || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value })
          }
          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Date Range */}
      <div>
        <label className="block text-xs text-slate-400 mb-1 uppercase">From</label>
        <input
          type="date"
          value={filters.from || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, from: e.target.value })
          }
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-50 focus:outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-1 uppercase">To</label>
        <input
          type="date"
          value={filters.to || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, to: e.target.value })
          }
          className="px-3 py-2 bg-slate-700 border border-slate-600 rounded text-slate-50 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Status Buttons */}
      <div className="flex gap-2">
        {['All', 'APPROVED', 'REJECTED', 'CLOSE'].map((status) => (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              statusFilter === status
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Clear Button */}
      <button
        onClick={() => {
          onFiltersChange({
            status: null,
            batch: null,
            from: null,
            to: null,
            search: '',
          });
          onStatusChange('All');
        }}
        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded font-medium transition-colors"
      >
        Clear
      </button>
    </div>
  );
}
