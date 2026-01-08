"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Play } from "lucide-react"
import { Button } from "@/components/ui/button"

interface TutorialScreenProps {
  onBack: () => void
  onComplete: () => void
}

const tutorialSlides = [
  {
    title: "Welcome to Square Wars",
    description: "Draw lines between dots to create squares and score points!",
    imageAlt: "Gameplay demonstration showing how to draw lines",
  },
  {
    title: "Complete Squares",
    description: "When you complete a square, you earn a point and get another turn!",
    imageAlt: "Example of completing a square",
  },
  {
    title: "Block Your Opponent",
    description: "Strategic play is key! Block your opponent from completing squares.",
    imageAlt: "Strategic blocking demonstration",
  },
  {
    title: "Win the Game",
    description: "The player with the most squares at the end wins. Good luck!",
    imageAlt: "Victory screen example",
  },
]

export function TutorialScreen({ onBack, onComplete }: TutorialScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  const handleNext = () => {
    if (currentSlide < tutorialSlides.length - 1) {
      setCurrentSlide(currentSlide + 1)
    }
  }

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1)
    }
  }

  const isLastSlide = currentSlide === tutorialSlides.length - 1

  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-[#1a1b3e] via-[#2a2b5e] to-[#3a3b7e] flex items-center justify-center p-6 relative">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 w-14 h-14 bg-[#2a2b4e]/80 hover:bg-[#3a3b5e]/80 rounded-2xl flex items-center justify-center text-white shadow-lg border border-gray-600/50 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <div className="flex items-center gap-4 justify-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="w-12 h-12 bg-[#2a2b4e]/60 hover:bg-[#3a3b5e]/80 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl flex items-center justify-center text-gray-400 hover:text-white transition-all"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Main Content Card with 3:2 aspect ratio */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-[450px] h-[300px] bg-[#1e2047]/60 rounded-3xl border-2 border-gray-600/30 shadow-xl p-6 flex flex-col items-center justify-center gap-4">
            {/* Screenshot Placeholder - maintains 3:2 ratio */}
            <div className="w-[300px] h-[200px] bg-[#2a2d5e] rounded-xl border border-gray-500/30 flex items-center justify-center">
              <span className="text-gray-400 text-sm font-medium text-center px-4">
                {tutorialSlides[currentSlide].imageAlt}
              </span>
            </div>

            {/* Description Text */}
            <p className="text-white text-sm font-medium text-center px-4">
              {tutorialSlides[currentSlide].description}
            </p>
          </div>

          {/* Progress Dots */}
          <div className="flex gap-2">
            {tutorialSlides.map((_, index) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentSlide ? "w-8 bg-cyan-400" : "w-2 bg-gray-500"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Arrow or Start Game Button */}
        {isLastSlide ? (
          <Button
            onClick={onComplete}
            className="h-12 px-6 bg-gradient-to-r from-[#00bfff] to-[#0099ff] hover:from-[#00d4ff] hover:to-[#00aaff] text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/50 border border-cyan-300/30"
          >
            <Play className="w-4 h-4 mr-2" />
            START GAME
          </Button>
        ) : (
          <button
            onClick={handleNext}
            className="w-12 h-12 bg-gradient-to-br from-[#7799ff] to-[#5577ff] hover:from-[#8899ff] hover:to-[#6688ff] rounded-xl flex items-center justify-center text-white shadow-lg transition-all"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  )
}
