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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, SignupFormData } from "../../validation/auth-schemas";

interface SignUpDialogProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode;
}

export function SignUpDialog({ trigger, children }: SignUpDialogProps) {
  const id = useId();
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signup, apiAvailable } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!isOpen) {
      setServerError(null);
      setLoading(false);
      reset();
    } else {
      // Optional: Reset on open as well
      // reset();
      // setServerError(null);
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: SignupFormData) => {
    setServerError(null);

    if (!apiAvailable) {
      setServerError("Server unavailable. Please try again later.");
      return;
    }

    setLoading(true);
    const { name, email, password } = data;

    try {
      const result = await signup(name, email, password);

      if (!result.success) {
        setServerError(result.error || "Something went wrong");
        setLoading(false);
        return;
      }

      setLoading(false);
      setIsOpen(false);
      reset();
      setShowLogin(true);
    } catch (error) {
      console.error("Signup Dialog submission error:", error);
      setServerError("Something went wrong. Please try again.");
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor={`${id}-name`}>Full name</Label>
                <Input
                  id={`${id}-name`}
                  placeholder=""
                  type="text"
                  {...register("name")}
                  disabled={!apiAvailable || loading}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-email`}>Email</Label>
                <Input
                  id={`${id}-email`}
                  placeholder=""
                  type="email"
                  {...register("email")}
                  disabled={!apiAvailable || loading}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">
                    {errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor={`${id}-password`}>Password</Label>
                <Input
                  id={`${id}-password`}
                  placeholder="Create a secure password"
                  type="password"
                  {...register("password")}
                  disabled={!apiAvailable || loading}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>
            {serverError && (
              <div className="text-sm text-red-500">{serverError}</div>
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
              type="button"
              className="font-medium text-primary underline hover:no-underline"
              onClick={() => {
                if (loading) return;
                setIsOpen(false);
                setShowLogin(true);
              }}
              disabled={loading}
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