"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive" | "rainbow";
  component?: (props: React.ComponentProps<"a">) => React.ReactElement;
}

interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image: {
    light: string;
    dark: string;
    alt: string;
  };
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
}: HeroProps) {
  const { resolvedTheme } = useTheme();
  const imageSrc = resolvedTheme === "light" ? image.light : image.dark;

  return (
    <section className="relative overflow-hidden bg-background pt-24 md:pt-32">
      <div className="container relative">
        <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
          {/* Badge */}
          {badge && (
            <Badge variant="outline" className="animate-fade-up [--delay:200ms]">
              <span className="text-muted-foreground">{badge.text}</span>
              <a href={badge.action.href} className="ml-2 flex items-center gap-1 font-medium text-foreground">
                {badge.action.text}
                <ArrowRightIcon className="h-3 w-3" />
              </a>
            </Badge>
          )}

          {/* Title */}
          <h1 className="animate-fade-up text-3xl font-bold tracking-tight [--delay:400ms] sm:text-5xl md:text-6xl lg:text-7xl">
            {title}
          </h1>

          {/* Description */}
          <p className="animate-fade-up text-muted-foreground [--delay:600ms] sm:text-lg md:text-xl">
            {description}
          </p>

          {/* Actions */}
          <div className="flex animate-fade-up items-center gap-4 [--delay:800ms]">
            {actions.map((action, index) => {
              if (action.component) {
                return action.component({
                  key: index,
                  href: action.href,
                  className: "h-11",
                  children: (
                    <>
                      {action.icon}
                      {action.text}
                    </>
                  ),
                });
              }

              return (
                <Button 
                  key={index} 
                  variant={action.component ? undefined : action.variant as "default" | "outline" | "secondary" | "ghost" | "link" | "destructive"} 
                  size="lg" 
                  className={cn(
                    "h-11 px-8",
                    action.variant === "outline" && "border-2"
                  )}
                  asChild
                >
                  <a href={action.href} className="flex items-center gap-2">
                    {action.icon}
                    {action.text}
                  </a>
                </Button>
              );
            })}
          </div>

          {/* Image with Glow */}
          <div className="relative mt-16 w-full animate-fade-up [--delay:1000ms]">
            <MockupFrame size="small" className="mx-auto">
              <Mockup type="responsive">
                <img
                  src={imageSrc}
                  alt={image.alt}
                  className="w-full"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
} 