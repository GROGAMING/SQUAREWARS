"use client"

import { Play, RotateCcw, Grid3x3, Settings, Home } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PauseMenuProps {
  onResume: () => void
  onChangeMode: () => void
  onSettings: () => void
  onMainMenu: () => void
}

export function PauseMenu({ onResume, onChangeMode, onSettings, onMainMenu }: PauseMenuProps) {
  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center rounded-3xl">
      <div className="flex flex-col items-center gap-3 w-full max-w-sm px-6">
        <h2 className="text-white text-4xl font-bold tracking-wider mb-2">PAUSED</h2>

        <Button
          onClick={onResume}
          className="w-full h-12 bg-gradient-to-r from-[#00bfff] to-[#0099ff] hover:from-[#00d4ff] hover:to-[#00aaff] text-white font-semibold text-sm rounded-full shadow-lg shadow-cyan-500/50 border border-cyan-300/30"
        >
          <Play className="w-4 h-4 mr-2 fill-white" />
          RESUME
        </Button>

        <Button className="w-full h-11 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-semibold text-sm rounded-full shadow-lg shadow-purple-500/40 border border-purple-400/30">
          <RotateCcw className="w-4 h-4 mr-2" />
          RESET GAME
        </Button>

        <Button
          onClick={onChangeMode}
          className="w-full h-11 bg-[#2a2b4e]/90 hover:bg-[#3a3b5e]/90 text-white font-semibold text-sm rounded-full shadow-lg border border-gray-600/50"
        >
          <Grid3x3 className="w-4 h-4 mr-2" />
          CHANGE MODE
        </Button>

        <Button
          onClick={onSettings}
          className="w-full h-11 bg-[#2a2b4e]/90 hover:bg-[#3a3b5e]/90 text-white font-semibold text-sm rounded-full shadow-lg border border-gray-600/50"
        >
          <Settings className="w-4 h-4 mr-2" />
          SETTINGS
        </Button>

        <Button
          onClick={onMainMenu}
          className="w-full h-11 bg-[#2a2b4e]/90 hover:bg-[#3a3b5e]/90 text-white font-semibold text-sm rounded-full shadow-lg border border-gray-600/50"
        >
          <Home className="w-4 h-4 mr-2" />
          MAIN MENU
        </Button>
      </div>
    </div>
  )
}
