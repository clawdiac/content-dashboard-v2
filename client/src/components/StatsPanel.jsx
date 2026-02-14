import React from 'react';

export default function StatsPanel({ stats }) {
  const successRate = (stats.success_rate * 100).toFixed(1);
  const approvedRate = stats.total > 0 ? ((stats.approved / stats.total) * 100).toFixed(1) : 0;
  const rejectedRate = stats.total > 0 ? ((stats.rejected / stats.total) * 100).toFixed(1) : 0;
  const closeRate = stats.total > 0 ? (((stats.close || 0) / stats.total) * 100).toFixed(1) : 0;

  return (
    <div className="p-6 bg-slate-800 border-t border-slate-700">
      <h3 className="text-lg font-bold text-slate-50 mb-4">📊 Approval Statistics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Images */}
        <StatCard
          label="Total Images"
          value={stats.total}
          percentage={100}
          color="bg-blue-600"
        />

        {/* Approved */}
        <StatCard
          label="Approved"
          value={stats.approved}
          percentage={approvedRate}
          color="bg-green-600"
        />

        {/* Rejected */}
        <StatCard
          label="Rejected"
          value={stats.rejected}
          percentage={rejectedRate}
          color="bg-red-600"
        />

        {/* Close/Needs Fixes */}
        <StatCard
          label="Needs Fixes"
          value={stats.close || 0}
          percentage={closeRate}
          color="bg-yellow-500"
        />
      </div>

      {/* Success Rate Bar */}
      <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-300">Success Rate</span>
          <span className="text-xl font-bold text-green-600">{successRate}%</span>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-green-600 transition-all"
            style={{ width: `${successRate}%` }}
          />
        </div>
      </div>

      {/* Last Updated */}
      <p className="text-xs text-slate-400 mt-4">
        Last updated: {new Date(stats.calculated_at).toLocaleTimeString()}
      </p>
    </div>
  );
}

function StatCard({ label, value, percentage, color }) {
  return (
    <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
      <p className="text-sm text-slate-400 mb-2">{label}</p>
      <p className="text-2xl font-bold text-slate-50 mb-3">{value}</p>
      <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2">{percentage}% of total</p>
    </div>
  );
}
