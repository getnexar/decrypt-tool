"use client"

import * as React from "react"
import { X } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"

interface InputProps extends Omit<React.ComponentProps<"input">, "prefix"> {
  icon?: React.ReactNode
  suffix?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
}

function Input({
  className,
  type,
  icon,
  suffix,
  clearable,
  onClear,
  value,
  onChange,
  ...props
}: InputProps) {
  const [internalValue, setInternalValue] = React.useState("")
  
  // Use controlled or uncontrolled value
  const isControlled = value !== undefined
  const inputValue = isControlled ? value : internalValue

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalValue(e.target.value)
    }
    onChange?.(e)
  }

  const handleClear = () => {
    if (!isControlled) {
      setInternalValue("")
    }
    onClear?.()
  }

  const hasValue = inputValue && String(inputValue).length > 0
  const isInvalid = props["aria-invalid"] === true

  return (
    <div
      aria-invalid={isInvalid}
      className={cn(
        // Base wrapper styles
        "flex items-center gap-2 w-full rounded-xl border bg-card px-3 transition-all",
        // Default border
        "border-border",
        // Focus-within state - purple border (no ring/shadow)
        "focus-within:border-primary",
        // Error state - red border from globals.css destructive color (no ring/shadow)
        isInvalid && "border-destructive",
        // Height
        "h-11",
        className
      )}
    >
      {/* Left icon */}
      {icon && (
        <span className="text-muted-foreground shrink-0 [&>svg]:size-5">
          {icon}
        </span>
      )}

      {/* Input */}
      <input
        type={type}
        data-slot="input"
        value={inputValue}
        onChange={handleChange}
        className={cn(
          "flex-1 min-w-0 bg-transparent text-sm font-medium outline-none",
          "placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        {...props}
      />

      {/* Clear button */}
      {clearable && hasValue && (
        <button
          type="button"
          onClick={handleClear}
          className="text-muted-foreground hover:text-foreground shrink-0 p-0.5 rounded transition-colors"
        >
          <X className="size-4" />
        </button>
      )}

      {/* Suffix */}
      {suffix && (
        <span className="text-muted-foreground text-sm shrink-0 [&>svg]:size-5">
          {suffix}
        </span>
      )}
    </div>
  )
}

export { Input, type InputProps }
