import type React from "react"

interface NeonCardProps {
  children: React.ReactNode
  glowColor?: "cyan" | "pink" | "blue" | "orange" | "none"
  className?: string
}

export function NeonCard({ children, glowColor = "cyan", className = "" }: NeonCardProps) {
  const glowClasses = {
    cyan: "box-glow-cyan",
    pink: "box-glow-pink",
    blue: "box-glow-blue",
    orange: "box-glow-orange",
    none: "shadow-lg",
  }

  return (
    <div
      className={`relative bg-slate-800/30 backdrop-blur-sm border border-white/10 
        rounded-3xl p-6 ${glowClasses[glowColor]} 
        before:absolute before:inset-0 before:rounded-3xl 
        before:bg-gradient-to-br before:from-white/5 before:to-transparent
        ${className}`}
    >
      {children}
    </div>
  )
}
