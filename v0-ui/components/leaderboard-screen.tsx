"use client"

import { useState } from "react"
import { ChevronLeft, Trophy, Target, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LeaderboardScreenProps {
  onBack: () => void
}

type TabType = "score" | "wins" | "streak"

interface PlayerEntry {
  id: string
  name: string
  score: number
  wins: number
  streak: number
  isActive: boolean // Track if player has played yet
}

// You can add more players to this array as they join the game
const playerData: PlayerEntry[] = [
  { id: "p1", name: "You", score: 2450, wins: 45, streak: 12, isActive: true },
  { id: "p2", name: "Player 2", score: 2150, wins: 38, streak: 8, isActive: true },
  { id: "p3", name: "Player 3", score: 1980, wins: 32, streak: 6, isActive: true },
  { id: "p4", name: "Player 4", score: 1750, wins: 28, streak: 5, isActive: true },
  { id: "p5", name: "Player 5", score: 1620, wins: 25, streak: 4, isActive: true },
  { id: "p6", name: "Player 6", score: 1450, wins: 22, streak: 3, isActive: true },
  { id: "p7", name: "Player 7", score: 1280, wins: 19, streak: 3, isActive: true },
  { id: "p8", name: "Player 8", score: 1150, wins: 16, streak: 2, isActive: true },
  { id: "p9", name: "Player 9", score: 0, wins: 0, streak: 0, isActive: false }, // Inactive placeholder
  { id: "p10", name: "Player 10", score: 0, wins: 0, streak: 0, isActive: false }, // Inactive placeholder
]

export function addPlayer(name: string): PlayerEntry {
  return {
    id: `p${Date.now()}`,
    name,
    score: 0,
    wins: 0,
    streak: 0,
    isActive: true,
  }
}

export function updatePlayerStats(
  players: PlayerEntry[],
  playerId: string,
  updates: Partial<Pick<PlayerEntry, "score" | "wins" | "streak">>,
): PlayerEntry[] {
  return players.map((player) => {
    if (player.id === playerId) {
      return {
        ...player,
        ...updates,
        isActive: true, // Activate player when they play
      }
    }
    return player
  })
}

export function LeaderboardScreen({ onBack }: LeaderboardScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>("score")

  const getRankColor = (rank: number) => {
    if (rank === 1) return "from-yellow-400 to-orange-400" // Gold
    if (rank === 2) return "from-gray-300 to-gray-400" // Silver
    if (rank === 3) return "from-orange-300 to-yellow-600" // Bronze
    return "from-gray-600 to-gray-700" // Navy/Dark
  }

  const sortedPlayers = playerData
    .filter((player) => player.isActive) // Only show players who have played
    .sort((a, b) => {
      if (activeTab === "score") return b.score - a.score
      if (activeTab === "wins") return b.wins - a.wins
      return b.streak - a.streak
    })

  return (
    <div className="w-[844px] h-[390px] mx-auto bg-gradient-to-br from-[#1a1b3e] via-[#2a2b5e] to-[#3a3b7e] flex flex-col p-6 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="w-12 h-12 rounded-2xl bg-[#2a2b4e]/80 hover:bg-[#3a3b5e]/80 border border-gray-600/50 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-3xl font-bold text-white tracking-wider">LEADERBOARD</h1>
        <div className="w-12" /> {/* Spacer for centering */}
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-4 justify-center">
        <Button
          onClick={() => setActiveTab("score")}
          className={`h-12 px-8 rounded-full font-semibold text-sm transition-all ${
            activeTab === "score"
              ? "bg-gradient-to-r from-[#00bfff] to-[#0099ff] text-white shadow-lg shadow-cyan-500/50 border border-cyan-300/30"
              : "bg-[#2a2b4e]/80 text-gray-300 border border-gray-600/50 hover:bg-[#3a3b5e]/80"
          }`}
        >
          <Trophy className="w-4 h-4 mr-2" />
          SCORE
        </Button>
        <Button
          onClick={() => setActiveTab("wins")}
          className={`h-12 px-8 rounded-full font-semibold text-sm transition-all ${
            activeTab === "wins"
              ? "bg-gradient-to-r from-[#00bfff] to-[#0099ff] text-white shadow-lg shadow-cyan-500/50 border border-cyan-300/30"
              : "bg-[#2a2b4e]/80 text-gray-300 border border-gray-600/50 hover:bg-[#3a3b5e]/80"
          }`}
        >
          <Target className="w-4 h-4 mr-2" />
          WINS
        </Button>
        <Button
          onClick={() => setActiveTab("streak")}
          className={`h-12 px-8 rounded-full font-semibold text-sm transition-all ${
            activeTab === "streak"
              ? "bg-gradient-to-r from-[#00bfff] to-[#0099ff] text-white shadow-lg shadow-cyan-500/50 border border-cyan-300/30"
              : "bg-[#2a2b4e]/80 text-gray-300 border border-gray-600/50 hover:bg-[#3a3b5e]/80"
          }`}
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          STREAK
        </Button>
      </div>

      {/* Leaderboard Entries - Scrollable */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-2">
        <div className="grid grid-cols-2 gap-3">
          {sortedPlayers.map((player, index) => {
            const rank = index + 1
            return (
              <div
                key={player.id}
                className="bg-[#2a2b4e]/60 rounded-3xl p-4 border border-gray-600/40 flex items-center gap-4"
              >
                {/* Rank Badge */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getRankColor(
                    rank,
                  )} flex items-center justify-center text-2xl font-bold text-black shadow-lg`}
                >
                  {rank}
                </div>

                {/* Player Info */}
                <div className="flex-1">
                  <h3 className="text-white font-semibold text-lg">{player.name}</h3>
                  <div className="flex gap-4 text-xs text-gray-400">
                    <span>Wins: {player.wins}</span>
                    <span>Streak: {player.streak}</span>
                  </div>
                </div>

                {/* Score/Value */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-400">
                    {activeTab === "score" ? player.score : activeTab === "wins" ? player.wins : player.streak}
                  </div>
                  <div className="text-xs text-gray-400">{activeTab === "score" ? "points" : ""}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
