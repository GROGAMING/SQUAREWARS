"use client"

import { ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface GameModesProps {
  onBack: () => void
  onSelectMode: (mode: string) => void
}

export function GameModes({ onBack, onSelectMode }: GameModesProps) {
  const modes = [
    {
      id: "classic",
      title: "CLASSIC MODE",
      description: "1 point per completed box.",
      gradient: "from-[#00bfff] to-[#0099ff]",
      shadow: "shadow-cyan-500/50",
    },
    {
      id: "territory",
      title: "TERRITORY TAKEDOWN",
      description: "Area Mode – biggest connected territory wins.",
      gradient: "from-[#ff1e5a] to-[#ff0844]",
      shadow: "shadow-pink-500/50",
    },
    {
      id: "quickfire",
      title: "QUICKFIRE",
      description: "Best to X points (player sets winning number).",
      gradient: "from-[#a855f7] to-[#8b5cf6]",
      shadow: "shadow-purple-500/50",
    },
  ]

  const renderIcon = (modeId: string) => {
    if (modeId === "classic") {
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <g>
            {/* Crown base */}
            <path d="M15 55 L20 35 L30 45 L40 25 L50 45 L60 35 L65 55 Z" fill="white" opacity="0.9" />
            {/* Crown points */}
            <circle cx="20" cy="32" r="4" fill="white" opacity="0.95" />
            <circle cx="40" cy="22" r="5" fill="white" opacity="0.95" />
            <circle cx="60" cy="32" r="4" fill="white" opacity="0.95" />
            {/* Static gems */}
            <circle cx="30" cy="42" r="3" fill="cyan" opacity="0.9" />
            <circle cx="40" cy="38" r="3" fill="yellow" opacity="0.9" />
            <circle cx="50" cy="42" r="3" fill="cyan" opacity="0.9" />
          </g>
        </svg>
      )
    }

    if (modeId === "territory") {
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <g>
            {/* Map background */}
            <rect x="15" y="20" width="50" height="40" rx="4" fill="white" opacity="0.2" />
            {/* Horizontal fold line */}
            <line x1="15" y1="40" x2="65" y2="40" stroke="white" strokeWidth="2" opacity="0.6" />
            {/* Vertical fold line */}
            <line x1="40" y1="20" x2="40" y2="60" stroke="white" strokeWidth="2" opacity="0.6" />
            {/* Region borders - creating 4 quadrants */}
            <path d="M15 20 L40 40 L65 20" stroke="white" strokeWidth="2" opacity="0.5" fill="none" />
            <path d="M15 60 L40 40 L65 60" stroke="white" strokeWidth="2" opacity="0.5" fill="none" />
            {/* Map pins/markers */}
            <circle cx="27" cy="30" r="4" fill="white" opacity="0.9" />
            <path d="M27 26 L27 30 L25 32 Z" fill="white" opacity="0.9" />
            <circle cx="53" cy="30" r="4" fill="white" opacity="0.9" />
            <path d="M53 26 L53 30 L51 32 Z" fill="white" opacity="0.9" />
            <circle cx="27" cy="50" r="4" fill="white" opacity="0.9" />
            <path d="M27 46 L27 50 L25 52 Z" fill="white" opacity="0.9" />
            <circle cx="53" cy="50" r="4" fill="white" opacity="0.9" />
            <path d="M53 46 L53 50 L51 52 Z" fill="white" opacity="0.9" />
          </g>
        </svg>
      )
    }

    if (modeId === "quickfire") {
      return (
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <g>
            {/* Outer dark red flames */}
            <path
              d="M 40 15 C 35 18, 30 25, 28 32 C 26 38, 28 45, 30 50 C 32 54, 35 58, 40 62 C 45 58, 48 54, 50 50 C 52 45, 54 38, 52 32 C 50 25, 45 18, 40 15 Z"
              fill="#b91c1c"
              opacity="1"
            />
            {/* Left outer flame curl */}
            <path
              d="M 28 32 C 25 30, 22 28, 20 30 C 18 33, 18 38, 20 42 C 22 45, 25 48, 28 48 C 28 42, 28 36, 28 32 Z"
              fill="#b91c1c"
              opacity="1"
            />
            {/* Right outer flame curl */}
            <path
              d="M 52 32 C 55 30, 58 28, 60 30 C 62 33, 62 38, 60 42 C 58 45, 55 48, 52 48 C 52 42, 52 36, 52 32 Z"
              fill="#b91c1c"
              opacity="1"
            />

            {/* Middle orange flames */}
            <path
              d="M 40 20 C 37 22, 33 27, 32 33 C 31 38, 32 43, 34 48 C 36 52, 38 56, 40 58 C 42 56, 44 52, 46 48 C 48 43, 49 38, 48 33 C 47 27, 43 22, 40 20 Z"
              fill="#f97316"
              opacity="1"
            />

            {/* Inner yellow flame */}
            <path
              d="M 40 28 C 38 30, 36 34, 36 38 C 36 42, 37 46, 38 50 C 39 52, 39 54, 40 55 C 41 54, 41 52, 42 50 C 43 46, 44 42, 44 38 C 44 34, 42 30, 40 28 Z"
              fill="#fbbf24"
              opacity="1"
            />

            {/* Center bright core */}
            <path
              d="M 40 35 C 39 36, 38 38, 38 40 C 38 43, 39 46, 40 48 C 41 46, 42 43, 42 40 C 42 38, 41 36, 40 35 Z"
              fill="#fef3c7"
              opacity="1"
            />
          </g>
        </svg>
      )
    }

    return null
  }

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
          <h1 className="flex-1 text-center text-2xl font-bold text-white tracking-wider mr-12">GAME MODES</h1>
        </div>

        {/* Game modes in horizontal layout */}
        <div className="flex-1 flex items-center justify-center">
          <div className="grid grid-cols-3 gap-4 w-full max-w-[750px]">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onSelectMode(mode.id)}
                className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${mode.gradient} p-4 shadow-xl ${mode.shadow} border border-white/20 hover:scale-105 transition-all duration-300 h-[220px] flex flex-col items-center justify-center`}
              >
                <div className="mb-4 w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 transition-all flex items-center justify-center p-2">
                  {renderIcon(mode.id)}
                </div>

                {/* Content */}
                <div className="text-white text-center space-y-2">
                  <h3 className="font-bold text-base tracking-wide">{mode.title}</h3>
                  <p className="text-xs text-white/90 leading-relaxed px-2">{mode.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
