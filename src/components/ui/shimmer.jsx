import { cn } from "@/lib/utils"

export function Shimmer({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/50",
        className
      )}
      {...props}
    />
  )
}

export function CardSkeleton({ className, ...props }) {
  return (
    <div className={cn("space-y-3 p-4 border rounded-lg", className)} {...props}>
      <Shimmer className="h-4 w-2/3" />
      <Shimmer className="h-4 w-1/2" />
      <div className="flex justify-between">
        <Shimmer className="h-6 w-16" />
        <Shimmer className="h-6 w-6 rounded-full" />
      </div>
    </div>
  )
}
