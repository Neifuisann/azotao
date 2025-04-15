import * as React from "react";
import { cn } from "@/lib/utils";

interface RainbowButtonProps extends React.ComponentProps<"a"> {
  className?: string
}

const RainbowButton = React.forwardRef<HTMLAnchorElement, RainbowButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <a
        className={cn(
          "inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium text-white",
          "relative overflow-hidden transition-all duration-500",
          "bg-gradient-to-r from-[hsl(var(--color-1))] via-[hsl(var(--color-2))] to-[hsl(var(--color-3))] bg-[length:200%_200%]",
          "animate-rainbow hover:animate-none hover:bg-[length:100%_100%] hover:bg-gradient-to-br",
          "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/50",
          "focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-50",
          "disabled:pointer-events-none disabled:opacity-50 dark:focus:ring-slate-400 dark:focus:ring-offset-slate-900",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
RainbowButton.displayName = "RainbowButton";

export { RainbowButton };
