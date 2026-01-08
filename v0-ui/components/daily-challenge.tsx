"use client"

import { useState } from "react"
import { Info, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DailyChallengeProps {
  controlScheme: "touch" | "button"
  onComplete: () => void
}

export function DailyChallenge({ controlScheme, onComplete }: DailyChallengeProps) {
  const [showInstructions, setShowInstructions] = useState(true)
  const [instructions] = useState(
    "Welcome to today's Daily Challenge! Complete the puzzle to earn bonus points. You must capture at least 15 squares to win this challenge. Good luck!",
  )

  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 p-4 flex flex-col relative">
      {/* Instructions Popup */}
      {showInstructions && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md border-2 border-cyan-400/50 shadow-2xl shadow-cyan-500/20">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-cyan-400">Daily Challenge</h2>
              <button
                onClick={() => setShowInstructions(false)}
                className="text-white hover:text-cyan-400 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-white text-sm leading-relaxed mb-6">{instructions}</p>
            <Button
              onClick={() => setShowInstructions(false)}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-white font-bold py-3 rounded-xl shadow-lg shadow-cyan-500/50 border border-green-400/30"
            >
              START CHALLENGE
            </Button>
          </div>
        </div>
      )}

      {/* Top bar with heading and Info button */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-12 rounded-2xl bg-[#2a2b4e]/80 backdrop-blur-sm shadow-xl border border-gray-600/30 flex items-center justify-center px-4">
          <p className="text-cyan-400 text-xl font-bold tracking-wider uppercase">Daily Challenge</p>
        </div>

        <Button
          onClick={() => setShowInstructions(true)}
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-lg shadow-purple-500/50 border border-purple-400/30"
        >
          <Info className="w-6 h-6" />
        </Button>
      </div>

      {/* Game area */}
      <div className="flex-1 flex items-center justify-center gap-3 relative">
        {controlScheme === "button" && (
          <div className="flex flex-col gap-2 flex-shrink-0 justify-center">
            {/* Empty spacer to match DROP button height on right side */}
            <div className="w-16 h-20" />
            <Button
              variant="ghost"
              size="icon"
              className="w-16 h-16 rounded-2xl bg-[#2a2b4e]/80 hover:bg-[#3a3b5e]/80 text-white shadow-lg border border-gray-600/50"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </div>
        )}

        {/* Game grid */}
        <div className="w-[450px] h-[260px] rounded-3xl bg-gradient-to-br from-gray-200 to-gray-300 shadow-2xl shadow-black/20 border-4 border-white/50 flex items-center justify-center flex-shrink-0">
          <p className="text-gray-400 text-lg font-semibold">Daily Challenge Game Grid</p>
        </div>

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
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Button>
          </div>
        )}

        <Button
          onClick={onComplete}
          className="absolute bottom-0 right-0 px-6 h-12 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-bold shadow-lg shadow-green-500/50 border border-green-400/30"
        >
          COMPLETE
        </Button>
      </div>
    </div>
  )
}
