interface ScorePillProps {
  label: string
  value: string | number
  color: "pink" | "cyan" | "blue" | "orange"
  className?: string
}

export function ScorePill({ label, value, color, className = "" }: ScorePillProps) {
  const colorClasses = {
    pink: "bg-gradient-to-r from-pink-500 to-pink-600 box-glow-pink",
    cyan: "bg-gradient-to-r from-cyan-400 to-cyan-500 box-glow-cyan",
    blue: "bg-gradient-to-r from-blue-500 to-blue-600 box-glow-blue",
    orange: "bg-gradient-to-r from-orange-400 to-orange-500 box-glow-orange",
  }

  return (
    <div
      className={`relative px-6 py-2 rounded-full font-bold 
        ${colorClasses[color]}
        before:absolute before:inset-0 before:rounded-full 
        before:bg-gradient-to-b before:from-white/30 before:to-transparent
        ${className}`}
    >
      <div className="relative z-10 flex flex-col items-center">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-white/90">{label}</div>
        <div className="text-2xl font-display text-white">{value}</div>
      </div>
    </div>
  )
}
