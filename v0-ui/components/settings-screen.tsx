"use client"

import { useState } from "react"
import { ChevronLeft, Hand, Gamepad2, Play, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SettingsScreenProps {
  controlScheme: "touch" | "button"
  onControlSchemeChange: (scheme: "touch" | "button") => void
  onBack: () => void
  fromScreen: string
  onLogout: () => void
}

export function SettingsScreen({
  controlScheme,
  onControlSchemeChange,
  onBack,
  fromScreen,
  onLogout,
}: SettingsScreenProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-[#1a1b3e] via-[#2a2b5e] to-[#3a3b7e] p-4 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="w-12 h-12 rounded-2xl bg-[#2a2b4e]/80 hover:bg-[#3a3b5e]/80 text-white shadow-lg border border-gray-600/50"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        <h1 className="text-white text-3xl font-bold tracking-wider">SETTINGS</h1>

        <div className="rounded-2xl bg-[#2a2b4e]/80 px-4 py-2 border border-gray-600/50">
          <p className="text-white text-xs font-semibold">Square Wars</p>
          <p className="text-gray-400 text-[10px]">Version 1.0.0</p>
        </div>
      </div>

      {/* Control Scheme Section */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <h2 className="text-cyan-400 text-xl font-bold tracking-wider uppercase">Control Scheme</h2>

        {/* Toggle Container */}
        <div className="w-full max-w-xl h-16 rounded-full bg-[#2a2b4e]/80 border-2 border-gray-600/50 p-1.5 flex items-center gap-2 shadow-xl">
          <button
            onClick={() => onControlSchemeChange("touch")}
            className={`flex-1 h-full rounded-full flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
              controlScheme === "touch"
                ? "bg-gradient-to-r from-[#00bfff] to-[#0099ff] text-white shadow-lg shadow-cyan-500/50"
                : "text-gray-400"
            }`}
          >
            <Hand className="w-4 h-4" />
            TOUCH
          </button>

          <button
            onClick={() => onControlSchemeChange("button")}
            className={`flex-1 h-full rounded-full flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
              controlScheme === "button"
                ? "bg-gradient-to-r from-[#00bfff] to-[#0099ff] text-white shadow-lg shadow-cyan-500/50"
                : "text-gray-400"
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            BUTTON
          </button>
        </div>

        {fromScreen === "game" && (
          <Button
            onClick={onBack}
            className="w-full max-w-xl h-12 bg-gradient-to-r from-[#00bfff] to-[#0099ff] hover:from-[#00d4ff] hover:to-[#00aaff] text-white font-semibold text-sm rounded-full shadow-lg shadow-cyan-500/50 border border-cyan-300/30"
          >
            <Play className="w-4 h-4 mr-2 fill-white" />
            RESUME GAME
          </Button>
        )}

        <Button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full max-w-xl h-12 bg-red-600/80 hover:bg-red-600 text-white font-semibold text-sm rounded-full shadow-lg border border-red-500/50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          LOG OUT
        </Button>
      </div>

      {showLogoutConfirm && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-[#2a2b4e] border-2 border-gray-600/50 rounded-3xl p-6 max-w-sm shadow-2xl">
            <h2 className="text-white text-xl font-bold text-center mb-3">Log Out</h2>
            <p className="text-gray-300 text-sm text-center mb-4">Are you sure you want to log out?</p>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowLogoutConfirm(false)
                  onLogout()
                }}
                className="flex-1 h-11 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-xl text-sm"
              >
                YES
              </Button>
              <Button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-11 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-xl text-sm"
              >
                NO
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
