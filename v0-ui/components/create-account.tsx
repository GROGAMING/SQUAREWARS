"use client"

import { useState } from "react"
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CreateAccountProps {
  onComplete: () => void
  onLogin: () => void
}

export function CreateAccount({ onComplete, onLogin }: CreateAccountProps) {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<{
    displayName?: string
    email?: string
    password?: string
    confirmPassword?: string
    terms?: string
  }>({})

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleCreateAccount = () => {
    const newErrors: typeof errors = {}

    // Validate display name
    if (!displayName.trim()) {
      newErrors.displayName = "Display name is required"
    }

    // Validate email
    if (!email.trim()) {
      newErrors.email = "Email is required"
    } else if (!validateEmail(email)) {
      newErrors.email = "Please enter a valid email address"
    }

    // Validate password
    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    // Validate terms
    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the Terms of Service and Privacy Policy"
    }

    setErrors(newErrors)

    // If no errors, proceed
    if (Object.keys(newErrors).length === 0) {
      // Here you would typically send the data to your backend
      console.log("[v0] Account created:", { displayName, email })
      onComplete()
    }
  }

  return (
    <div className="h-[390px] w-[844px] mx-auto flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 overflow-hidden">
      <div className="h-full w-full overflow-y-auto px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-5 h-full flex flex-col justify-between">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white tracking-wider">CREATE ACCOUNT</h1>
            <Button
              variant="ghost"
              className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold px-4 py-2 h-auto rounded-xl bg-slate-700/50"
              onClick={onLogin}
            >
              LOG IN
            </Button>
          </div>

          {/* Form - Two Column Layout for Landscape */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Display Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  placeholder="Your name"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    if (errors.displayName) setErrors({ ...errors, displayName: undefined })
                  }}
                  className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-xl px-9 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              {errors.displayName && <p className="text-red-400 text-xs">{errors.displayName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Email Address</label>
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
                  className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-xl px-9 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errors.password) setErrors({ ...errors, password: undefined })
                  }}
                  className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-xl px-9 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors pr-10"
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

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-white text-sm font-medium">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined })
                  }}
                  className="w-full bg-slate-700/50 border-2 border-slate-600 rounded-xl px-9 py-2.5 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-cyan-400 transition-colors pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400 hover:text-cyan-300"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword}</p>}
            </div>

            {/* Terms Checkbox - Full Width */}
            <div className="col-span-2 flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => {
                  setAgreedToTerms(e.target.checked)
                  if (errors.terms) setErrors({ ...errors, terms: undefined })
                }}
                className="w-4 h-4 mt-0.5 rounded border-2 border-slate-600 bg-slate-700/50 checked:bg-cyan-500 checked:border-cyan-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-white text-xs cursor-pointer">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            {errors.terms && <p className="col-span-2 text-red-400 text-xs -mt-1">{errors.terms}</p>}
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCreateAccount}
              className="bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-cyan-500/50 transition-all text-sm"
            >
              CREATE ACCOUNT
            </button>

            <button
              onClick={onComplete}
              className="bg-purple-600/50 hover:bg-purple-600/70 text-white font-semibold py-3.5 rounded-xl transition-all border-2 border-purple-500 text-sm"
            >
              SKIP (Testing Only)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
