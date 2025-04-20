import { useState } from "react"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { Label } from "../ui/label"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, LoginFormData } from "../../validation/auth-schemas"
import { useAuth } from "../../lib/auth-context"

export function LoginForm() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { login, apiAvailable } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null)

    if (!apiAvailable) {
      setServerError("Server unavailable. Please try again later.")
      return
    }

    setLoading(true)
    const { email, password } = data

    try {
      const result = await login(email, password)

      if (!result.success) {
        setServerError(result.error || "Invalid credentials")
        setLoading(false)
        return
      }
      reset()
      navigate("/dashboard")
    } catch (error) {
      console.error("Login submission error:", error)
      setServerError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Enter your credentials to access your account
        </p>
      </div>
      {!apiAvailable && (
        <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 p-3 rounded-md text-sm text-center">
          Server connection unavailable. Login is disabled.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            placeholder="m@example.com"
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
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
        {serverError && (
          <div className="text-sm text-red-500">{serverError}</div>
        )}
        <Button
          className="w-full"
          type="submit"
          disabled={loading || !apiAvailable}
        >
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  )
} 