"use client"

import { useState } from "react"
import { Menu, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PauseMenu } from "@/components/pause-menu"

interface GameScreenProps {
  mode: string
  difficulty: string
  targetBoxes?: number
  controlScheme: "touch" | "button"
  onMainMenu: () => void
  onChangeMode: () => void
  onSettings: () => void
}

export function GameScreen({
  mode,
  difficulty,
  targetBoxes,
  controlScheme,
  onMainMenu,
  onChangeMode,
  onSettings,
}: GameScreenProps) {
  const [isPaused, setIsPaused] = useState(false)

  const difficultyDisplay = {
    easy: "EASY AI",
    medium: "MEDIUM AI",
    hard: "HARD AI",
    impossible: "IMPOSSIBLE AI",
  }[difficulty]

  const modeDisplay = {
    classic: "CLASSIC",
    territory: "TERRITORY TAKEDOWN",
    quickfire: `QUICKFIRE ${targetBoxes ? `(${targetBoxes})` : ""}`,
  }[mode]

  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-[#1a1b3e] via-[#2a2b5e] to-[#3a3b7e] p-4 flex flex-col relative">
      {isPaused && (
        <PauseMenu
          onResume={() => setIsPaused(false)}
          onChangeMode={onChangeMode}
          onSettings={onSettings}
          onMainMenu={onMainMenu}
        />
      )}

      {/* Top bar with scores and mode */}
      <div className="flex items-center gap-3 mb-3">
        <Button
          onClick={() => setIsPaused(true)}
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/50 border border-purple-400/30"
        >
          <Menu className="w-6 h-6" />
        </Button>

        {/* Player 1 score */}
        <div className="flex-1 h-16 rounded-3xl bg-gradient-to-br from-[#ff1e5a] to-[#ff0844] shadow-xl shadow-pink-500/40 border border-white/20 flex flex-col items-center justify-center px-4">
          <p className="text-white/90 text-xs font-semibold tracking-wider uppercase">Player 1</p>
          <p className="text-white text-3xl font-bold">0</p>
        </div>

        {/* Game mode display */}
        <div className="flex-1 h-16 rounded-3xl bg-[#2a2b4e]/80 backdrop-blur-sm shadow-xl border border-gray-600/30 flex items-center justify-center px-4">
          <p className="text-cyan-400 text-base font-bold tracking-wider uppercase">{modeDisplay}</p>
        </div>

        {/* AI score */}
        <div className="flex-1 h-16 rounded-3xl bg-gradient-to-br from-[#00bfff] to-[#0099ff] shadow-xl shadow-cyan-500/40 border border-white/20 flex flex-col items-center justify-center px-4">
          <p className="text-white/90 text-xs font-semibold tracking-wider uppercase">{difficultyDisplay}</p>
          <p className="text-white text-3xl font-bold">0</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center gap-3">
        {controlScheme === "button" && (
          <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
            {/* Empty spacer to match DROP button height on right side */}
            <div className="w-16 h-20" />
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 rounded-2xl bg-[#2a2b4e]/80 hover:bg-[#3a3b5e]/80 text-white shadow-lg border border-gray-600/50"
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          </div>
        )}

        {/* Game grid placeholder - fixed 3:2 aspect ratio (450px × 300px) */}
        <div className="w-[450px] h-[260px] rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-2xl shadow-black/20 border-4 border-white/50 flex items-center justify-center flex-shrink-0">
          <p className="text-gray-400 text-lg font-semibold">Game Grid Placeholder</p>
        </div>

        {/* Right side controls - only show in button mode */}
        {controlScheme === "button" && (
          <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#00bfff] to-[#0099ff] hover:from-[#00d4ff] hover:to-[#00aaff] text-white shadow-lg shadow-cyan-500/50 border border-cyan-300/30 font-bold text-sm"
            >
              DROP
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 rounded-2xl bg-[#2a2b4e]/80 hover:bg-[#3a3b5e]/80 text-white shadow-lg border border-gray-600/50"
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
