"use client"

import { useState } from "react"
import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface QuickfireSettingsProps {
  onBack: () => void
  onContinue: (targetBoxes: number) => void
}

export function QuickfireSettings({ onBack, onContinue }: QuickfireSettingsProps) {
  const [targetBoxes, setTargetBoxes] = useState(5)

  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-purple-900 via-blue-900 to-purple-800 flex flex-col justify-between p-4">
      {/* Back button */}
      <div>
        <Button
          onClick={onBack}
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-2xl bg-slate-700/50 hover:bg-slate-600/70 text-white border border-gray-600/30"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex items-center justify-center -mt-4">
        <div className="w-full max-w-[700px] space-y-4">
          {/* Title */}
          <div className="text-center space-y-0.5">
            <h1 className="text-2xl font-bold text-white tracking-wide">Quickfire Mode</h1>
            <p className="text-gray-300 text-sm">Select boxes needed to win</p>
          </div>

          {/* Target boxes display */}
          <div className="w-64 mx-auto rounded-3xl bg-gradient-to-br from-[#a3b7ff] to-[#8ba3ff] p-4 shadow-2xl shadow-blue-500/30 border border-white/20">
            <div className="text-center space-y-0.5">
              <p className="text-[#2a2b5e] font-semibold text-xs tracking-wider uppercase">Target Boxes</p>
              <p className="text-white text-5xl font-bold">{targetBoxes}</p>
            </div>
          </div>

          {/* Slider */}
          <div className="w-full max-w-[600px] mx-auto relative px-4">
            <div className="relative">
              {/* Slider track background */}
              <div className="h-10 rounded-full bg-slate-700/50 border border-gray-600/30 relative overflow-hidden">
                {/* Filled portion */}
                <div
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-[#a3b7ff] to-[#8ba3ff] transition-all duration-200"
                  style={{ width: `${((targetBoxes - 1) / 9) * 100}%` }}
                />

                {/* Tick marks */}
                <div className="absolute inset-0 flex items-center justify-between px-6">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((tick) => (
                    <div key={tick} className={`w-0.5 h-3 ${tick <= targetBoxes ? "bg-white/30" : "bg-gray-500/30"}`} />
                  ))}
                </div>
              </div>

              {/* Slider input */}
              <input
                type="range"
                min="1"
                max="10"
                value={targetBoxes}
                onChange={(e) => setTargetBoxes(Number.parseInt(e.target.value))}
                className="absolute inset-0 w-full h-10 opacity-0 cursor-pointer z-10"
              />

              {/* Slider thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-gradient-to-br from-[#b3c7ff] to-[#9bb3ff] shadow-xl shadow-blue-500/50 border-4 border-white flex items-center justify-center font-bold text-[#2a2b5e] text-base pointer-events-none transition-all duration-200"
                style={{ left: `calc(${((targetBoxes - 1) / 9) * 100}% - 24px)` }}
              >
                {targetBoxes}
              </div>
            </div>
          </div>

          {/* Continue button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={() => onContinue(targetBoxes)}
              className="w-56 h-12 rounded-full bg-gradient-to-r from-[#a3b7ff] to-[#8ba3ff] hover:from-[#b3c7ff] hover:to-[#9bb3ff] text-white text-base font-semibold tracking-wider shadow-2xl shadow-blue-500/30 border border-white/20 transition-all duration-300 hover:scale-105"
            >
              CONTINUE
            </Button>
          </div>
        </div>
      </div>

      <div className="h-10" />
    </div>
  )
}
