"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 font-sans",
  {
    variants: {
      variant: {
        dark: "bg-foreground text-background border-transparent",
        outline: "bg-transparent border-border text-foreground",
        destructive: "bg-destructive text-destructive-foreground border-transparent",
        secondary: "bg-secondary text-secondary-foreground border-transparent",
        primary: "bg-badge-primary-filled text-badge-primary-text border-transparent",
        numeric: "bg-destructive text-destructive-foreground border-transparent font-semibold tabular-nums",
      },
      size: {
        xs: "text-xs px-1.5 h-5 gap-1",
        sm: "text-xs px-2 h-6 gap-1",
        default: "text-sm px-2.5 h-7 gap-1.5",
      },
      shape: {
        rounded: "rounded-md",
        circular: "rounded-full",
      },
    },
    compoundVariants: [
      {
        variant: "numeric",
        shape: "circular",
        className: "aspect-square p-0 justify-center",
      },
    ],
    defaultVariants: {
      variant: "dark",
      size: "default",
      shape: "rounded",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
}

function Badge({
  className,
  variant,
  size,
  shape = variant === "numeric" ? "circular" : "rounded",
  asChild = false,
  ...props
}: BadgeProps) {
  const Comp = asChild ? Slot : "div"
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size, shape }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
