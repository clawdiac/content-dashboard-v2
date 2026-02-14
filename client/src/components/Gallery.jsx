import React, { useMemo } from 'react';
import { Virtuoso } from 'react-virtuoso';

export default function Gallery({ images, onSelectImage }) {
  // Group images into rows for grid layout
  const gridRows = useMemo(() => {
    const cols = 4;
    const rows = [];
    for (let i = 0; i < images.length; i += cols) {
      rows.push(images.slice(i, i + cols));
    }
    return rows;
  }, [images]);

  return (
    <div className="p-6 h-full overflow-auto">
      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-4">
          <div className="text-6xl opacity-50">📭</div>
          <h3 className="text-lg font-semibold text-slate-400">No images found</h3>
          <p className="text-slate-500">Try adjusting your filters</p>
        </div>
      ) : (
        <Virtuoso
          style={{ height: '100%' }}
          data={gridRows}
          itemContent={(_, row) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-4">
              {row.map((image) => (
                <ImageCard
                  key={image.filename}
                  image={image}
                  onClick={() => onSelectImage(image)}
                />
              ))}
            </div>
          )}
        />
      )}
    </div>
  );
}

function ImageCard({ image, onClick }) {
  const statusBadgeColor = {
    APPROVED: 'bg-green-600',
    REJECTED: 'bg-red-600',
    CLOSE: 'bg-yellow-500',
  };

  const statusBadgeText = {
    APPROVED: '✅ Approved',
    REJECTED: '❌ Rejected',
    CLOSE: '⚠️ Close',
  };

  return (
    <div
      onClick={onClick}
      className="group relative bg-slate-800 rounded-lg overflow-hidden border border-slate-700 hover:border-blue-500 cursor-pointer transition-all hover:shadow-lg"
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-square bg-slate-900 overflow-hidden">
        <img
          src={`/api/file/${encodeURIComponent(image.filename)}`}
          alt={image.filename}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
          loading="lazy"
        />
        
        {/* Status Badge */}
        {image.approval_status && (
          <div
            className={`absolute top-2 right-2 px-3 py-1 rounded text-white text-xs font-bold ${
              statusBadgeColor[image.approval_status]
            }`}
          >
            {statusBadgeText[image.approval_status]}
          </div>
        )}

        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold">
            ✅ Approve
          </button>
          <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold">
            ❌ Reject
          </button>
        </div>
      </div>

      {/* Metadata */}
      <div className="p-3 bg-slate-800">
        <h4 className="text-sm font-bold text-slate-50 truncate" title={image.filename}>
          {image.filename}
        </h4>
        <p className="text-xs text-slate-400 mt-1">
          {(image.size / 1024 / 1024).toFixed(2)} MB · {image.width}×{image.height}
        </p>
        <p className="text-xs text-slate-500 mt-1">
          {new Date(image.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
