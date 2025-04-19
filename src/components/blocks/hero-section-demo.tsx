"use client"

import { HeroSection } from "@/components/blocks/hero-section"
import { Button } from "@/components/ui/button"
import { SignUpDialog } from "@/components/ui/signup-dialog"
import { LoginDialog } from "@/components/ui/login-dialog"
import { RainbowButton } from "@/components/ui/rainbow-button"

export function HeroSectionDemo() {
  return (
    <HeroSection
      badge={{
        text: "Introducing our new components",
        action: {
          text: "Learn more",
          href: "/docs",
        },
      }}
      title="Quick Test Platform"
      description="Create and take tests rapidly."
      actions={[
        {
          text: "Get Started",
          href: "#",
          variant: "rainbow",
          component: (props) => {
            const { key, ...rest } = props;
            return (
              <SignUpDialog 
                key="signup-dialog"
                trigger={
                  <RainbowButton {...rest}>Get Started</RainbowButton>
                }
              />
            );
          },
        },
        {
          text: "Sign In",
          href: "#",
          variant: "outline",
          component: (props) => {
            const { key, ...rest } = props;
            return (
              <LoginDialog 
                key="login-dialog"
                trigger={
                  <Button className="px-8" variant="outline">Sign In</Button>
                }
              />
            );
          },
        },
      ]}
      image={{
        light: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
        dark: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe",
        alt: "UI Components Preview",
      }}
    />
  )
} 