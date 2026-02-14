import React, { useEffect } from 'react';

export default function ImageModal({
  image,
  onClose,
  onApprove,
  onReject,
  onFeedback,
  onNext,
  onPrev,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onNext();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key.toLowerCase() === 'a') onApprove();
      if (e.key.toLowerCase() === 'r') onReject();
      if (e.key.toLowerCase() === 'f') onFeedback();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNext, onPrev, onApprove, onReject, onFeedback]);

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 rounded-lg max-w-4xl w-full mx-4 max-h-90vh overflow-auto border border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <div className="flex justify-end p-4 border-b border-slate-700">
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            title="Close (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Image */}
        <div className="flex justify-center bg-black p-4">
          <img
            src={`/api/file/${encodeURIComponent(image.filename)}`}
            alt={image.filename}
            className="max-h-60vh object-contain"
          />
        </div>

        {/* Metadata */}
        <div className="p-6 border-b border-slate-700">
          <h3 className="text-lg font-bold text-slate-50 mb-4">{image.filename}</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-slate-400">
            <div>
              <span className="text-slate-500">Size:</span>
              <p className="font-medium text-slate-50">
                {(image.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
            <div>
              <span className="text-slate-500">Dimensions:</span>
              <p className="font-medium text-slate-50">
                {image.width}×{image.height}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Created:</span>
              <p className="font-medium text-slate-50">
                {new Date(image.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Status:</span>
              <p className="font-medium text-slate-50">
                {image.approval_status || 'Pending'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 flex justify-between gap-4">
          <button
            onClick={onPrev}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-medium transition-colors"
            title="Previous (←)"
          >
            ← Previous
          </button>

          <div className="flex gap-4">
            <button
              onClick={onApprove}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold transition-colors"
              title="Approve (A)"
            >
              ✅ Approve (A)
            </button>
            <button
              onClick={onReject}
              className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold transition-colors"
              title="Reject (R)"
            >
              ❌ Reject (R)
            </button>
            <button
              onClick={onFeedback}
              className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg font-bold transition-colors"
              title="Feedback (F)"
            >
              💬 Feedback (F)
            </button>
          </div>

          <button
            onClick={onNext}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-50 rounded-lg font-medium transition-colors"
            title="Next (→)"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}
