import * as React from "react"
import { cn } from "@/lib/utils"

interface MockupFrameProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "small" | "default" | "large"
}

export function MockupFrame({
  children,
  className,
  size = "default",
  ...props
}: MockupFrameProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border bg-background p-4 shadow-lg",
        {
          "max-w-[800px]": size === "small",
          "max-w-[1000px]": size === "default",
          "max-w-[1200px]": size === "large",
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface MockupProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: "browser" | "responsive"
}

export function Mockup({ children, className, type = "browser", ...props }: MockupProps) {
  if (type === "responsive") {
    return (
      <div
        className={cn(
          "overflow-hidden rounded-xl border bg-background shadow-2xl",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-background shadow-2xl",
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-1.5 border-b px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
      </div>
      {children}
    </div>
  )
} 