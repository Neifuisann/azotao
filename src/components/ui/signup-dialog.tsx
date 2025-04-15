"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useId } from "react";
import { LoginDialog } from "./login-dialog";
import { useAuth } from "../../lib/auth-context";

interface SignUpDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function SignUpDialog({ trigger, children }: SignUpDialogProps) {
  const id = useId();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup, apiAvailable } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Reset error when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setError(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Check if API is available
    if (!apiAvailable) {
      setError("Server unavailable. Please try again later.");
      setLoading(false);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const result = await signup(name, email, password);

      if (!result.success) {
        setError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setLoading(false);
      setIsOpen(false);
      setShowLogin(true);
    } catch (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {children || trigger || <Button variant="outline">Sign up</Button>}
        </DialogTrigger>
        <DialogContent>
          <div className="flex flex-col items-center gap-2">
            <div
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
              aria-hidden="true"
            >
              <svg
                className="stroke-zinc-800 dark:stroke-zinc-100"
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 32 32"
                aria-hidden="true"
              >
                <circle cx="16" cy="16" r="12" fill="none" strokeWidth="8" />
              </svg>
            </div>
            <DialogHeader>
              <DialogTitle className="sm:text-center">Create an account</DialogTitle>
              <DialogDescription className="sm:text-center">
                We just need a few details to get you started.
              </DialogDescription>
            </DialogHeader>
          </div>

          {!apiAvailable && (
            <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 rounded-md text-sm">
              Server connection unavailable. Try again later.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Full name</Label>
                <Input
                  id={`${id}-name`}
                  name="name"
                  placeholder=""
                  type="text"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input
                  id={`${id}-email`}
                  name="email"
                  placeholder=""
                  type="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-password`}>Password</Label>
                <Input
                  id={`${id}-password`}
                  name="password"
                  placeholder="Create a secure password"
                  type="password"
                  required
                  minLength={8}
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !apiAvailable}
            >
              {loading ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <div className="flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
            <span className="text-xs text-muted-foreground">Or</span>
          </div>

          <Button variant="outline">Continue with Google</Button>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              className="font-medium text-primary underline hover:no-underline"
              onClick={() => {
                setIsOpen(false);
                setShowLogin(true);
              }}
            >
              Sign in
            </button>
          </p>
        </DialogContent>
      </Dialog>

      {showLogin && (
        <LoginDialog
          trigger={
            <button className="hidden" onClick={() => setShowLogin(false)} />
          }
        />
      )}
    </>
  );
} 