"use client"

import { Play, Trophy, BookOpen, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MainMenuProps {
  onStartGame: () => void
  onLeaderboard: () => void
  onTutorial: () => void
  onSettings: () => void
}

export function MainMenu({ onStartGame, onLeaderboard, onTutorial, onSettings }: MainMenuProps) {
  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex items-center justify-center p-6">
      <div className="w-full flex items-center justify-between gap-12">
        {/* Logo Section */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <img
            src="/images/chatgpt-20image-20jan-206-2c-202026-2c-2010-08-56-20pm.png"
            alt="Square Wars Logo"
            className="w-[280px] h-auto mix-blend-screen"
            style={{ filter: "drop-shadow(0 0 20px rgba(255, 165, 0, 0.5))" }}
          />
        </div>

        {/* Buttons Section */}
        <div className="flex-1 max-w-[400px] flex flex-col gap-3">
          <Button
            onClick={onStartGame}
            className="w-full h-16 bg-gradient-to-r from-[#00bfff] to-[#0099ff] hover:from-[#00d4ff] hover:to-[#00aaff] text-white font-semibold text-lg rounded-full shadow-lg shadow-cyan-500/50 border border-cyan-300/30"
          >
            <Play className="w-5 h-5 mr-2" />
            START GAME
          </Button>

          <Button
            onClick={onLeaderboard}
            className="w-full h-14 bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold text-base rounded-full shadow-lg border border-gray-600/50"
          >
            <Trophy className="w-5 h-5 mr-2" />
            LEADERBOARD
          </Button>

          <Button
            onClick={onTutorial}
            className="w-full h-14 bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold text-base rounded-full shadow-lg border border-gray-600/50"
          >
            <BookOpen className="w-5 h-5 mr-2" />
            TUTORIAL
          </Button>

          <Button
            onClick={onSettings}
            className="w-full h-14 bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold text-base rounded-full shadow-lg border border-gray-600/50"
          >
            <Settings className="w-5 h-5 mr-2" />
            SETTINGS
          </Button>
        </div>
      </div>
    </div>
  )
}
