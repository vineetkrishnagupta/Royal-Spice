import { cn } from '@/utils/helpers'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function DataTable({
  columns,
  data,
  loading,
  emptyMessage = 'No records found',
  onRowClick,
  className,
}) {
  return (
    <div className={cn('table-wrapper', className)}>
      <table className="table-base">
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={i}
                style={{ width: col.width }}
                className={cn(col.headerClassName)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((_, j) => (
                  <td key={j}>
                    <div className="skeleton h-4 rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="text-center py-16 text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr
                key={row.id || i}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(onRowClick && 'cursor-pointer')}
              >
                {columns.map((col, j) => (
                  <td key={j} className={cn(col.cellClassName)}>
                    {col.cell ? col.cell(row) : row[col.accessor]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  className,
}) {
  if (totalPages <= 1) return null

  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className={cn('flex items-center justify-between px-1 mt-4', className)}>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Showing <span className="font-medium text-slate-700 dark:text-slate-300">{from}–{to}</span> of{' '}
        <span className="font-medium text-slate-700 dark:text-slate-300">{totalItems}</span> results
      </p>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let pageNum
          if (totalPages <= 7) {
            pageNum = i + 1
          } else if (page <= 4) {
            pageNum = i + 1 <= 5 ? i + 1 : i === 5 ? '...' : totalPages
          } else if (page >= totalPages - 3) {
            pageNum = i === 0 ? 1 : i === 1 ? '...' : totalPages - (6 - i)
          } else {
            pageNum = i === 0 ? 1 : i === 1 ? '...' : i === 5 ? '...' : i === 6 ? totalPages : page + (i - 3)
          }

          return (
            <button
              key={i}
              onClick={() => typeof pageNum === 'number' && onPageChange(pageNum)}
              disabled={pageNum === '...'}
              className={cn(
                'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                pageNum === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800',
                pageNum === '...' && 'pointer-events-none',
              )}
            >
              {pageNum}
            </button>
          )
        })}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default DataTable
