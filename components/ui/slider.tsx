"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
  value: number[]
  max: number
  step?: number
  className?: string
  onValueChange?: (value: number[]) => void
  onPointerDown?: () => void
  onPointerUp?: () => void
  disabled?: boolean
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ value, max, step = 1, className, onValueChange, onPointerDown, onPointerUp, disabled, ...props }, ref) => {
    return (
      <div className="py-2">
        <input
          ref={ref}
          type="range"
          min={0}
          max={max}
          step={step}
          value={value[0] || 0}
          disabled={disabled}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          onMouseDown={onPointerDown}
          onMouseUp={onPointerUp}
          onTouchStart={onPointerDown}
          onTouchEnd={onPointerUp}
          className={cn(
            "w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-blue-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-105 [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:-mt-1",
            "[&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-blue-500 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:hover:scale-105 [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:border-none",
            "[&::-webkit-slider-runnable-track]:bg-slate-600 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:h-1.5",
            "[&::-moz-range-track]:bg-slate-600 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-1.5 [&::-moz-range-track]:border-none",
            className,
          )}
          {...props}
        />
      </div>
    )
  },
)

Slider.displayName = "Slider"

export { Slider }