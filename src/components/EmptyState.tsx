'use client'

import { FolderOpen } from '@phosphor-icons/react'

interface EmptyStateProps {
  title: string
  description?: string
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="text-center py-12" data-slot="empty-state">
      <FolderOpen className="size-12 mx-auto text-muted-foreground/50 mb-4" />
      <p className="font-medium text-muted-foreground">{title}</p>
      {description && (
        <p className="text-sm text-muted-foreground/70 mt-1">{description}</p>
      )}
    </div>
  )
}
