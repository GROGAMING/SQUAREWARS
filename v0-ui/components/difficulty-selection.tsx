"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DifficultySelectionProps {
  mode: string
  onBack: () => void
  onSelectDifficulty: (difficulty: string) => void
}

export function DifficultySelection({ mode, onBack, onSelectDifficulty }: DifficultySelectionProps) {
  const modeTitle = mode === "classic" ? "Classic Mode" : mode === "territory" ? "Territory Takedown" : "Quickfire Mode"

  const difficulties = [
    {
      id: "easy",
      title: "EASY",
      description: "For Beginners",
      gradient: "from-[#00ff88] to-[#00cc66]",
      shadow: "shadow-green-500/50",
    },
    {
      id: "medium",
      title: "MEDIUM",
      description: "Moderate Challenge",
      gradient: "from-[#00bfff] to-[#0099ff]",
      shadow: "shadow-cyan-500/50",
    },
    {
      id: "hard",
      title: "HARD",
      description: "Intense Difficulty",
      gradient: "from-[#ff9944] to-[#ff7711]",
      shadow: "shadow-orange-500/50",
    },
    {
      id: "impossible",
      title: "IMPOSSIBLE",
      description: "For Experts Only",
      gradient: "from-[#ff1e5a] to-[#ff0844]",
      shadow: "shadow-pink-500/50",
    },
  ]

  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 p-6">
      <div className="h-full flex flex-col">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <Button
            onClick={onBack}
            variant="ghost"
            size="icon"
            className="w-12 h-12 rounded-2xl bg-slate-700/50 hover:bg-slate-600/70 text-white border border-gray-600/30"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center mr-12">
            <h2 className="text-cyan-400 text-xs font-semibold tracking-wide">{modeTitle}</h2>
            <h1 className="text-2xl font-bold text-white tracking-wider">SELECT DIFFICULTY</h1>
          </div>
        </div>

        {/* Title */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-4 gap-4 w-full max-w-[750px]">
            {difficulties.map((difficulty) => (
              <button
                key={difficulty.id}
                onClick={() => onSelectDifficulty(difficulty.id)}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${difficulty.gradient} p-3 shadow-xl ${difficulty.shadow} border border-white/20 hover:scale-105 transition-all duration-300 flex flex-col items-center justify-center h-[220px]`}
              >
                <div className="text-white text-center space-y-3">
                  <h3 className="font-bold text-lg tracking-wide">{difficulty.title}</h3>
                  <p className="text-white/90 text-xs font-medium">{difficulty.description}</p>
                  <div className="flex justify-center gap-1.5 pt-2">
                    {[...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-2 rounded-sm ${
                          i <= difficulties.findIndex((d) => d.id === difficulty.id) ? "bg-white" : "bg-white/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
