import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    variant?: 'default' | 'glass' | 'interactive' | 'floating' | 'modal'
  }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: "glass-card rounded-lg border bg-gradient-card text-card-foreground shadow-glass transition-all duration-300 hover:shadow-glass-lg hover:border-border-hover/50 backdrop-blur-md hover:backdrop-blur-lg",
    glass: "glass-effect rounded-xl border border-white/10 bg-transparent text-foreground shadow-glass backdrop-blur-lg hover:backdrop-blur-xl transition-all duration-400 hover:border-primary/30",
    interactive: "interactive-card glass-card rounded-xl border bg-gradient-card text-card-foreground shadow-glass hover:shadow-glass-lg cursor-pointer",
    floating: "glass-panel rounded-2xl border border-white/15 bg-gradient-glass text-foreground shadow-glass-lg backdrop-blur-xl float-slow hover:shadow-amber transition-all duration-500",
    modal: "glass-modal rounded-2xl border border-white/20 bg-gradient-glass text-foreground shadow-glass-lg modal-slide-in"
  }

  return (
    <div
      ref={ref}
      className={cn(variants[variant], className)}
      {...props}
    />
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-4 sm:p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg sm:text-xl font-heading font-semibold leading-tight tracking-tight text-foreground",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-4 sm:p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-4 sm:p-6 pt-0 gap-2", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
