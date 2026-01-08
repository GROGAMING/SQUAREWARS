import type React from "react"

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger"
  children: React.ReactNode
}

export function NeonButton({ variant = "primary", children, className = "", ...props }: NeonButtonProps) {
  const variants = {
    primary:
      "bg-gradient-to-br from-[#00C6FF] to-[#2E6BFF] box-glow-cyan hover:shadow-[0_0_30px_rgba(0,198,255,0.5),0_0_50px_rgba(0,198,255,0.3),0_4px_12px_rgba(0,0,0,0.3)]",
    secondary: "bg-slate-800/40 border border-white/10 hover:border-[#00C6FF]/50 hover:box-glow-cyan",
    danger:
      "bg-gradient-to-br from-[#FF3D8D] to-[#FF1744] box-glow-pink hover:shadow-[0_0_30px_rgba(255,61,141,0.5),0_0_50px_rgba(255,61,141,0.3),0_4px_12px_rgba(0,0,0,0.3)]",
  }

  return (
    <button
      className={`relative px-6 py-3 rounded-2xl font-bold text-white tracking-wide
        transition-all duration-200 active:scale-95
        before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-b 
        before:from-white/20 before:to-transparent before:opacity-50
        ${variants[variant]} ${className}`}
      {...props}
    >
      <span className="relative z-10">{children}</span>
    </button>
  )
}
