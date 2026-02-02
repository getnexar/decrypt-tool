'use client'

import { Warning, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface ErrorAlertProps {
  title?: string
  message: string
  onDismiss?: () => void
  className?: string
}

export function ErrorAlert({
  title = 'Error',
  message,
  onDismiss,
  className
}: ErrorAlertProps) {
  return (
    <div
      data-slot="error-alert"
      className={cn(
        "bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex gap-3",
        className
      )}
    >
      <Warning
        className="size-5 text-destructive flex-shrink-0 mt-0.5"
        weight="fill"
      />
      <div className="flex-1 space-y-1">
        <p className="font-medium text-destructive">{title}</p>
        <p className="text-sm text-destructive/80">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-destructive/60 hover:text-destructive transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label="Dismiss error"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
