import React from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'

/**
 * Reusable, modern pagination bar for admin and data tables.
 *
 * @param {number} currentPage - 1-based current page index
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total record count
 * @param {number} pageSize - Number of items per page
 * @param {number[]} pageSizeOptions - Array of available page size options
 * @param {function} onPageChange - Callback when page changes: (page: number) => void
 * @param {function} onPageSizeChange - Callback when page size changes: (size: number) => void
 * @param {string} itemLabel - Label for records (e.g., 'leads', 'devices', 'items')
 * @param {boolean} isLoading - Disables controls during loading states
 */
export default function TablePagination({
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 25,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  itemLabel = 'records',
  isLoading = false,
}) {
  const safeCurrentPage = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)))
  const safeTotalPages = Math.max(1, totalPages)

  // Calculate item range
  const startItem = totalItems === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1
  const endItem = Math.min(safeCurrentPage * pageSize, totalItems)

  // Generate page numbers with smart ellipsis
  const getPageNumbers = () => {
    if (safeTotalPages <= 7) {
      return Array.from({ length: safeTotalPages }, (_, i) => i + 1)
    }

    if (safeCurrentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', safeTotalPages]
    }

    if (safeCurrentPage >= safeTotalPages - 3) {
      return [
        1,
        '...',
        safeTotalPages - 4,
        safeTotalPages - 3,
        safeTotalPages - 2,
        safeTotalPages - 1,
        safeTotalPages,
      ]
    }

    return [
      1,
      '...',
      safeCurrentPage - 1,
      safeCurrentPage,
      safeCurrentPage + 1,
      '...',
      safeTotalPages,
    ]
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-5 py-3.5 bg-white border-t border-gray-100 rounded-b-2xl">
      {/* Left: Record Range Count */}
      <div className="flex items-center gap-3 text-xs text-gray-500">
        <span>
          {totalItems === 0 ? (
            'No records found'
          ) : (
            <>
              Showing <span className="font-semibold text-gray-800">{startItem}</span> to{' '}
              <span className="font-semibold text-gray-800">{endItem}</span> of{' '}
              <span className="font-semibold text-gray-800">{totalItems}</span> {itemLabel}
            </>
          )}
        </span>

        {/* Page Size Dropdown */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200">
            <label htmlFor="pageSizeSelect" className="text-gray-400 text-xs">
              Rows:
            </label>
            <select
              id="pageSizeSelect"
              value={pageSize}
              disabled={isLoading}
              onChange={(e) => {
                const newSize = parseInt(e.target.value, 10)
                onPageSizeChange(newSize)
              }}
              className="bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium rounded-lg px-2 py-1 focus:outline-none focus:border-[#0C81F3] focus:bg-white cursor-pointer transition-colors"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Right: Pagination Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={safeCurrentPage <= 1 || isLoading}
          title="First page"
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage - 1)}
          disabled={safeCurrentPage <= 1 || isLoading}
          title="Previous page"
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Number Buttons */}
        <div className="flex items-center gap-1 px-1">
          {pageNumbers.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs text-gray-400 select-none"
                >
                  ...
                </span>
              )
            }

            const isActive = p === safeCurrentPage
            return (
              <button
                key={`page-${p}`}
                type="button"
                disabled={isLoading}
                onClick={() => onPageChange(p)}
                className={`min-w-[32px] h-8 px-2 text-xs font-medium rounded-lg transition-all ${
                  isActive
                    ? 'bg-[#0C81F3] text-white shadow-sm font-bold'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                {p}
              </button>
            )
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeCurrentPage + 1)}
          disabled={safeCurrentPage >= safeTotalPages || isLoading}
          title="Next page"
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(safeTotalPages)}
          disabled={safeCurrentPage >= safeTotalPages || isLoading}
          title="Last page"
          className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg disabled:opacity-30 disabled:pointer-events-none transition-colors"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
