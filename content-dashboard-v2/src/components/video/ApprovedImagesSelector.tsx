'use client'

import { useState, useMemo, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useApprovalStore } from '@/store/approval'

interface ApprovedImagesSelectorProps {
  selectedIds: Set<string>
  onToggle: (id: string) => void
  onSelectAll: () => void
  onSelectNone: () => void
}

const ImageThumb = memo(function ImageThumb({
  item,
  isSelected,
  onToggle,
}: {
  item: { id: string; thumbnailUrl: string; character: { displayName: string }; batchId: string }
  isSelected: boolean
  onToggle: (id: string) => void
}) {
  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
      onClick={() => onToggle(item.id)}
      className={cn(
        'relative aspect-square rounded-lg border overflow-hidden transition-all group',
        isSelected
          ? 'border-primary ring-2 ring-primary/30'
          : 'border-border hover:border-primary/40'
      )}
    >
      <img
        src={item.thumbnailUrl}
        alt={item.character.displayName}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
      />
      {/* Selection overlay */}
      <div
        className={cn(
          'absolute inset-0 transition-colors',
          isSelected ? 'bg-primary/20' : 'bg-transparent group-hover:bg-black/10'
        )}
      />
      {/* Checkmark */}
      <div
        className={cn(
          'absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center transition-all',
          isSelected ? 'bg-primary text-primary-foreground scale-100' : 'bg-black/40 text-white/60 scale-90'
        )}
      >
        {isSelected ? (
          <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <div className="h-2 w-2 rounded-full bg-white/40" />
        )}
      </div>
      {/* Character name */}
      <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1">
        <div className="text-[9px] text-white font-medium truncate">{item.character.displayName}</div>
      </div>
    </motion.button>
  )
})

export function ApprovedImagesSelector({ selectedIds, onToggle, onSelectAll, onSelectNone }: ApprovedImagesSelectorProps) {
  const [search, setSearch] = useState('')
  const items = useApprovalStore((s) => s.items)

  const approvedImages = useMemo(() => {
    let filtered = items.filter(
      (i) => i.approvalStatus === 'approved' && i.type === 'image' && i.eligibleForVideo
    )
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (i) =>
          i.character.displayName.toLowerCase().includes(q) ||
          i.batchId.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [items, search])

  if (items.filter((i) => i.approvalStatus === 'approved' && i.type === 'image').length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border py-8 text-center">
        <svg className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <div className="text-sm text-muted-foreground">No approved images yet</div>
        <div className="text-xs text-muted-foreground/60 mt-1">Approve images in the Approval tab first</div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Search + bulk actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by character or batch…"
            className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <button type="button" onClick={onSelectAll} className="text-xs text-primary hover:text-primary/80 transition-colors whitespace-nowrap">
          All
        </button>
        <button type="button" onClick={onSelectNone} className="text-xs text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap">
          None
        </button>
      </div>

      {/* Count */}
      <div className="text-xs text-muted-foreground">
        {selectedIds.size} of {approvedImages.length} selected
      </div>

      {/* Grid */}
      {approvedImages.length === 0 && search.trim() ? (
        <div className="rounded-lg border border-dashed border-border py-6 text-center">
          <div className="text-sm text-muted-foreground">No images match &ldquo;{search}&rdquo;</div>
          <button type="button" onClick={() => setSearch('')} className="text-xs text-primary hover:text-primary/80 mt-1">
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-1.5 max-h-[240px] overflow-y-auto rounded-lg">
          <AnimatePresence mode="popLayout">
            {approvedImages.map((item) => (
              <ImageThumb
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                onToggle={onToggle}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
