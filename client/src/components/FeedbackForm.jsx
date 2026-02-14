import React, { useState } from 'react';

export default function FeedbackForm({ image, onClose, onSubmit }) {
  const [status, setStatus] = useState('APPROVED');
  const [feedback, setFeedback] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(status, feedback);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <div
        className="bg-slate-900 rounded-lg w-full max-w-lg border border-slate-700 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700">
          <h2 className="text-xl font-bold text-slate-50">Detailed Feedback</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Image Info */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-sm text-slate-400">File</p>
            <p className="text-slate-50 font-mono text-sm truncate">{image.filename}</p>
          </div>

          {/* Status Dropdown */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Status *
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 focus:outline-none focus:border-blue-500"
            >
              <option value="APPROVED">✅ Approved</option>
              <option value="REJECTED">❌ Rejected</option>
              <option value="CLOSE">⚠️ Close (Needs Fixes)</option>
            </select>
          </div>

          {/* Feedback Textarea */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Feedback (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter your feedback here..."
              rows={4}
              className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-50 placeholder-slate-400 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setStatus('APPROVED');
                setFeedback('');
              }}
              className="flex-1 px-4 py-2 bg-slate-600 hover:bg-slate-500 text-slate-50 rounded-lg font-medium transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
              title="Submit feedback (F)"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
