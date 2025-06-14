import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <div className="relative">
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-sm shadow-glass transition-all duration-300",
            "backdrop-blur-md hover:backdrop-blur-lg focus:backdrop-blur-lg",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium",
            "placeholder:text-muted-foreground/70",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50",
            "hover:border-white/30 hover:bg-white/8",
            "focus:border-primary/40 focus:bg-white/10 focus:shadow-amber/20",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "glass-effect",
            className
          )}
          ref={ref}
          {...props}
        />
        {/* Glass highlight effect */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input } 