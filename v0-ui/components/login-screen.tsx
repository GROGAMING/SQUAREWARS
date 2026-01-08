"use client"

import { useState } from "react"
import { Mail, Lock, Eye, EyeOff, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoginScreenProps {
  onBack: () => void
  onComplete: () => void
}

export function LoginScreen({ onBack, onComplete }: LoginScreenProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{
    email?: string
    password?: string
  }>({})

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleLogin = () => {
    const newErrors: typeof errors = {}

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate password
    if (!password) {
      newErrors.password = "Password is required"
    }

    setErrors(newErrors)

    // If no errors, proceed
    if (Object.keys(newErrors).length === 0) {
      // Here you would typically verify credentials with your backend
      console.log("[v0] Login attempt:", { email })
      onComplete()
    }
  }

  return (
    <div className="h-[390px] w-[844px] mx-auto flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 relative">
      <div className="w-full max-w-lg space-y-4 px-8">
        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-2xl bg-[#2a2b4e]/80 hover:bg-[#3a3b5e]/80 text-white shadow-lg border border-gray-600/50"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
        </div>

        {/* Header */}
        <h1 className="text-4xl font-bold text-white tracking-wider text-center">LOG IN</h1>

        {/* Form */}
        <div className="space-y-3">
          {/* Email */}
          <div className="space-y-1">
            <label className="text-white text-xs font-medium">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (errors.email) setErrors({ ...errors, email: undefined })
                }}
                className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-2xl px-10 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-white text-xs font-medium">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errors.password) setErrors({ ...errors, password: undefined })
                }}
                className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-2xl px-10 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs">{errors.password}</p>}
          </div>

          {/* Forgot Password Link */}
          <div className="flex justify-end">
            <button className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold">Forgot Password?</button>
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold py-3 rounded-2xl shadow-lg shadow-cyan-500/50 transition-all text-base"
        >
          LOGIN
        </button>

        <button
          onClick={onComplete}
          className="w-full bg-purple-600/50 hover:bg-purple-600/70 text-white/70 font-semibold py-2 rounded-2xl transition-all text-xs border border-purple-400/30"
        >
          SKIP (Testing Only)
        </button>
      </div>
    </div>
  )
}
