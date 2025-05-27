import * as React from "react"
import { cn } from "@/lib/utils"

interface HoverCardProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface HoverCardTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

interface HoverCardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  sideOffset?: number
}

const HoverCard: React.FC<HoverCardProps> = ({ children, open, onOpenChange }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  const timeoutRef = React.useRef<NodeJS.Timeout>()

  const handleOpen = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(true)
    onOpenChange?.(true)
  }

  const handleClose = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
      onOpenChange?.(false)
    }, 100)
  }

  const contextValue = {
    isOpen: open !== undefined ? open : isOpen,
    onOpen: handleOpen,
    onClose: handleClose
  }

  return (
    <HoverCardContext.Provider value={contextValue}>
      {children}
    </HoverCardContext.Provider>
  )
}

const HoverCardContext = React.createContext<{
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
} | null>(null)

const HoverCardTrigger: React.FC<HoverCardTriggerProps> = ({ children, asChild }) => {
  const context = React.useContext(HoverCardContext)

  if (!context) {
    throw new Error('HoverCardTrigger must be used within HoverCard')
  }

  const props = {
    onMouseEnter: context.onOpen,
    onMouseLeave: context.onClose,
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, props)
  }

  return <div className="relative inline-block" {...props}>{children}</div>
}

const HoverCardContent = React.forwardRef<HTMLDivElement, HoverCardContentProps>(
  ({ className, children, side = "top", align = "center", sideOffset = 4, ...props }, ref) => {
    const context = React.useContext(HoverCardContext)

    if (!context) {
      throw new Error('HoverCardContent must be used within HoverCard')
    }

    if (!context.isOpen) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 w-80 rounded-md border bg-popover p-0 text-popover-foreground shadow-lg animate-in fade-in-0 zoom-in-95",
          side === "top" && "bottom-full mb-2",
          side === "bottom" && "top-full mt-2",
          side === "left" && "right-full mr-2",
          side === "right" && "left-full ml-2",
          align === "start" && "left-0",
          align === "center" && "left-1/2 transform -translate-x-1/2",
          align === "end" && "right-0",
          className
        )}
        style={{
          position: 'absolute',
          zIndex: 9999,
        }}
        onMouseEnter={context.onOpen}
        onMouseLeave={context.onClose}
        {...props}
      >
        {children}
      </div>
    )
  }
)
HoverCardContent.displayName = "HoverCardContent"

export { HoverCard, HoverCardTrigger, HoverCardContent }
