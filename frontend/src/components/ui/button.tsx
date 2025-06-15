import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useInteractionFeedback } from "@/lib/interactionFeedback"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "bg-white text-[#08090A] font-medium hover:bg-white/95 active:scale-[0.98] shadow-sm hover:shadow-md",
        destructive:
          "bg-[#FF4D4F] text-white font-medium hover:bg-[#FF4D4F]/90 active:scale-[0.98] shadow-sm hover:shadow-md",
        outline:
          "border-2 border-white/60 bg-transparent text-white hover:bg-white/10 hover:text-white backdrop-blur-md hover:backdrop-blur-lg",
        secondary:
          "bg-[#07080A] text-white border border-white/10 hover:bg-white/5 active:scale-[0.98] shadow-sm hover:shadow-md",
        ghost:
          "bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white backdrop-blur-md hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)]",
        link:
          "text-white underline-offset-4 hover:underline hover:text-white/80",
        success:
          "bg-green-600 text-white font-medium hover:bg-green-700 active:scale-[0.98] shadow-sm hover:shadow-md",
        warning:
          "bg-yellow-600 text-white font-medium hover:bg-yellow-700 active:scale-[0.98] shadow-sm hover:shadow-md",
        glass:
          "bg-white/5 text-[#B3B3B3] hover:bg-white/10 hover:text-white backdrop-blur-md hover:shadow-[0_2px_10px_rgba(255,255,255,0.08)]",
        'glass-primary':
          "bg-white/10 text-white hover:bg-white/15 hover:text-white backdrop-blur-lg hover:backdrop-blur-xl",
      },
      size: {
        default: "h-10 px-6 py-2 text-sm",
        sm: "h-8 rounded-md px-3 text-xs font-medium",
        lg: "h-12 rounded-lg px-8 text-base font-semibold",
        xl: "h-14 rounded-xl px-10 text-lg font-bold",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, onClick, onMouseEnter, ...props }, ref) => {
    const feedback = useInteractionFeedback()
    const buttonRef = React.useRef<HTMLButtonElement>(null)

    // Combine refs
    React.useImperativeHandle(ref, () => buttonRef.current!)

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Trigger interaction feedback based on variant
      if (variant === 'glass-primary' || variant === 'default') {
        feedback.drinkSplash(buttonRef.current || undefined)
      } else if (variant === 'glass') {
        feedback.glassClick(buttonRef.current || undefined)
      } else if (variant === 'destructive') {
        feedback.error(buttonRef.current || undefined)
      } else {
        feedback.glassClick(buttonRef.current || undefined)
      }

      onClick?.(e)
    }

    const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Subtle hover feedback for glass variants
      if (variant?.includes('glass')) {
        feedback.glassHover(buttonRef.current || undefined)
      }

      onMouseEnter?.(e)
    }

    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={buttonRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }