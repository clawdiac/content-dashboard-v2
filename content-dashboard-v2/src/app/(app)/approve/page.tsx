'use client'

import { useEffect, useCallback, useState, useRef, useMemo } from 'react'
import { useApprovalStore } from '@/store/approval'
import { ApprovalGrid } from '@/components/approval/ApprovalGrid'
import { ApprovalControls } from '@/components/approval/ApprovalControls'
import { ApprovalPreview } from '@/components/approval/ApprovalPreview'
import { useSSE } from '@/context/SSEContext'

export default function ApprovePage() {
  const { connected } = useSSE()
  const {
    items,
    selected,
    filter,
    loading,
    error,
    fetchItems,
    approve,
    reject,
    regenerate,
    sendToVideoGen,
    toggleSelect,
    selectAll,
    selectNone,
    setFilter,
    filteredItems,
    selectedItems,
    resetStatus,
    clearError,
  } = useApprovalStore()

  const [focusedIndex, setFocusedIndex] = useState(0)
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<{ id: string; status: 'pending' | 'approved' | 'rejected' }[]>([])
  const [toast, setToast] = useState<string | null>(null)

  const filtered = useMemo(() => filteredItems(), [items, filter])
  const focusedId = filtered[focusedIndex]?.id ?? null
  const previewItem = previewId ? items.find((i) => i.id === previewId) ?? null : null

  // Clamp focusedIndex when filtered list changes (BUG-3)
  useEffect(() => {
    setFocusedIndex((i) => Math.min(i, Math.max(filtered.length - 1, 0)))
  }, [filtered.length])

  // Counts (memoized)
  const counts = useMemo(() => ({
    total: items.length,
    pending: items.filter((i) => i.approvalStatus === 'pending').length,
    approved: items.filter((i) => i.approvalStatus === 'approved').length,
    rejected: items.filter((i) => i.approvalStatus === 'rejected').length,
  }), [items])

  // Fetch on mount
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  // Columns heuristic for keyboard nav
  // BUG-4: Match Tailwind breakpoints exactly
  const getColumns = useCallback(() => {
    const w = window.innerWidth
    if (w >= 1024) return 4
    if (w >= 768) return 3
    return 2
  }, [])

  const handleApprove = useCallback((id: string) => {
    const item = items.find((i) => i.id === id)
    if (item) {
      setUndoStack((s) => [...s.slice(-20), { id, status: item.approvalStatus }])
    }
    approve([id])
  }, [items, approve])

  const handleReject = useCallback((id: string) => {
    const item = items.find((i) => i.id === id)
    if (item) {
      setUndoStack((s) => [...s.slice(-20), { id, status: item.approvalStatus }])
    }
    reject([id])
  }, [items, reject])

  const handleUndo = useCallback(() => {
    const last = undoStack[undoStack.length - 1]
    if (!last) return
    setUndoStack((s) => s.slice(0, -1))
    if (last.status === 'approved') approve([last.id])
    else if (last.status === 'rejected') reject([last.id])
    else if (last.status === 'pending') resetStatus([last.id])
    showToast('Undo applied')
  }, [undoStack, approve, reject, resetStatus])

  // Toast helper
  const showToast = useCallback((msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleSelect = useCallback((id: string) => {
    setPreviewId(id)
    const idx = filtered.findIndex((i) => i.id === id)
    if (idx >= 0) setFocusedIndex(idx)
  }, [filtered])

  const handleBulkApprove = useCallback(() => {
    const ids = selected.size > 0
      ? Array.from(selected)
      : filtered.filter((i) => i.approvalStatus === 'pending').map((i) => i.id)
    if (ids.length === 0) return
    if (!window.confirm(`Approve ${ids.length} item${ids.length > 1 ? 's' : ''}?`)) return
    approve(ids)
    showToast(`${ids.length} item${ids.length > 1 ? 's' : ''} approved`)
  }, [selected, filtered, approve, showToast])

  const handleBulkReject = useCallback(() => {
    const ids = selected.size > 0
      ? Array.from(selected)
      : filtered.filter((i) => i.approvalStatus === 'pending').map((i) => i.id)
    if (ids.length === 0) return
    if (!window.confirm(`Reject ${ids.length} item${ids.length > 1 ? 's' : ''}?`)) return
    reject(ids)
    showToast(`${ids.length} item${ids.length > 1 ? 's' : ''} rejected`)
  }, [selected, filtered, reject, showToast])

  const handleClearRejected = useCallback(() => {
    // For now just filter them out visually
    setFilter({ status: 'pending' })
  }, [setFilter])

  const handleSendToVideo = useCallback(() => {
    const approvedIds = items.filter((i) => i.approvalStatus === 'approved' && i.eligibleForVideo).map((i) => i.id)
    if (approvedIds.length > 0) sendToVideoGen(approvedIds)
  }, [items, sendToVideoGen])

  const handleSendSingleToVideo = useCallback((id: string) => {
    sendToVideoGen([id])
  }, [sendToVideoGen])

  const handlePrevPreview = useCallback(() => {
    if (!previewId) return
    const idx = filtered.findIndex((i) => i.id === previewId)
    if (idx > 0) {
      setPreviewId(filtered[idx - 1].id)
      setFocusedIndex(idx - 1)
    }
  }, [previewId, filtered])

  const handleNextPreview = useCallback(() => {
    if (!previewId) return
    const idx = filtered.findIndex((i) => i.id === previewId)
    if (idx < filtered.length - 1) {
      setPreviewId(filtered[idx + 1].id)
      setFocusedIndex(idx + 1)
    }
  }, [previewId, filtered])

  // Keyboard shortcuts (after all handlers to avoid stale closures - BUG-2)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const cols = getColumns()
      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          setFocusedIndex((i) => Math.min(i + 1, filtered.length - 1))
          break
        case 'ArrowLeft':
          e.preventDefault()
          setFocusedIndex((i) => Math.max(i - 1, 0))
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((i) => Math.min(i + cols, filtered.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((i) => Math.max(i - cols, 0))
          break
        case 'Home':
          e.preventDefault()
          setFocusedIndex(0)
          break
        case 'End':
          e.preventDefault()
          setFocusedIndex(filtered.length - 1)
          break
        case ' ':
          e.preventDefault()
          if (focusedId) handleApprove(focusedId)
          break
        case 'x':
        case 'X':
          e.preventDefault()
          if (focusedId) handleReject(focusedId)
          break
        case 'z':
        case 'Z':
          e.preventDefault()
          handleUndo()
          break
        case 'Enter':
          e.preventDefault()
          if (focusedId) setPreviewId(focusedId)
          break
        case 'Escape':
          e.preventDefault()
          setPreviewId(null)
          break
        case 'a':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault()
            selectAll()
          }
          break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [filtered, focusedId, getColumns, handleApprove, handleReject, handleUndo, selectAll])

  const previewIndex = previewId ? filtered.findIndex((i) => i.id === previewId) : -1

  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] flex-col gap-4 overflow-hidden">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold">Approve</h1>
        <p className="text-sm text-muted-foreground">Review and approve generated content</p>
      </div>

      {/* Controls */}
      <ApprovalControls
        filter={filter}
        onFilterChange={setFilter}
        counts={counts}
        selectedCount={selected.size}
        onApproveAll={handleBulkApprove}
        onRejectAll={handleBulkReject}
        onClearRejected={handleClearRejected}
        onSendToVideo={handleSendToVideo}
      />

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-lg bg-foreground text-background px-4 py-2 text-sm shadow-lg animate-in fade-in slide-in-from-bottom-4">
          {toast}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center justify-between">
          {error}
          <button type="button" onClick={clearError} className="text-xs underline ml-2">Dismiss</button>
        </div>
      )}

      {/* Loading */}
      {loading && items.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Main layout: Grid + Preview */}
      {!loading || items.length > 0 ? (
        <div className="flex flex-1 gap-4 min-h-0 overflow-hidden">
          {/* Grid */}
          <div className={previewId ? 'flex-1 min-w-0' : 'w-full'}>
            <ApprovalGrid
              items={filtered}
              selectedIds={selected}
              focusedId={focusedId}
              onSelect={handleSelect}
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>

          {/* Preview sidebar */}
          {previewId && (
            <div className="hidden lg:flex w-[380px] xl:w-[440px] flex-shrink-0 flex-col border-l border-border pl-4 overflow-y-auto">
              <ApprovalPreview
                item={previewItem}
                onApprove={handleApprove}
                onReject={handleReject}
                onRegenerate={(id) => regenerate([id])}
                onSendToVideo={handleSendSingleToVideo}
                onPrev={handlePrevPreview}
                onNext={handleNextPreview}
                onClose={() => setPreviewId(null)}
                hasPrev={previewIndex > 0}
                hasNext={previewIndex < filtered.length - 1}
              />
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
