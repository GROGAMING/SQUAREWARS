"use client"

import { useState } from "react"
import { CreateAccount } from "@/components/create-account"
import { LoginScreen } from "@/components/login-screen"
import { DailyChallenge } from "@/components/daily-challenge"
import { MainMenu } from "@/components/main-menu"
import { GameModes } from "@/components/game-modes"
import { DifficultySelection } from "@/components/difficulty-selection"
import { QuickfireSettings } from "@/components/quickfire-settings"
import { GameScreen } from "@/components/game-screen"
import { SettingsScreen } from "@/components/settings-screen"
import { LeaderboardScreen } from "@/components/leaderboard-screen"
import { TutorialScreen } from "@/components/tutorial-screen"

export default function Page() {
  const [currentScreen, setCurrentScreen] = useState<
    | "create-account"
    | "login"
    | "daily-challenge"
    | "menu"
    | "game-modes"
    | "difficulty"
    | "quickfire"
    | "quickfire-difficulty"
    | "game"
    | "settings"
    | "leaderboard"
    | "tutorial"
  >("create-account")
  const [selectedMode, setSelectedMode] = useState<string>("")
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("")
  const [targetBoxes, setTargetBoxes] = useState<number>(5)
  const [returnToScreen, setReturnToScreen] = useState<string>("menu")
  const [controlScheme, setControlScheme] = useState<"touch" | "button">("button")

  return (
    <div className="min-h-screen">
      {currentScreen === "create-account" && (
        <CreateAccount
          onComplete={() => setCurrentScreen("daily-challenge")}
          onLogin={() => setCurrentScreen("login")}
        />
      )}
      {currentScreen === "login" && (
        <LoginScreen
          onBack={() => setCurrentScreen("create-account")}
          onComplete={() => setCurrentScreen("daily-challenge")}
        />
      )}
      {currentScreen === "daily-challenge" && (
        <DailyChallenge controlScheme={controlScheme} onComplete={() => setCurrentScreen("menu")} />
      )}
      {currentScreen === "menu" && (
        <MainMenu
          onStartGame={() => setCurrentScreen("game-modes")}
          onLeaderboard={() => setCurrentScreen("leaderboard")}
          onTutorial={() => setCurrentScreen("tutorial")}
          onSettings={() => {
            setReturnToScreen("menu")
            setCurrentScreen("settings")
          }}
        />
      )}
      {currentScreen === "tutorial" && (
        <TutorialScreen onBack={() => setCurrentScreen("menu")} onComplete={() => setCurrentScreen("game-modes")} />
      )}
      {currentScreen === "leaderboard" && <LeaderboardScreen onBack={() => setCurrentScreen("menu")} />}
      {currentScreen === "game-modes" && (
        <GameModes
          onBack={() => setCurrentScreen("menu")}
          onSelectMode={(mode) => {
            setSelectedMode(mode)
            if (mode === "quickfire") {
              setCurrentScreen("quickfire")
            } else {
              setCurrentScreen("difficulty")
            }
          }}
        />
      )}
      {currentScreen === "difficulty" && (
        <DifficultySelection
          mode={selectedMode}
          onBack={() => setCurrentScreen("game-modes")}
          onSelectDifficulty={(difficulty) => {
            setSelectedDifficulty(difficulty)
            setCurrentScreen("game")
          }}
        />
      )}
      {currentScreen === "quickfire" && (
        <QuickfireSettings
          onBack={() => setCurrentScreen("game-modes")}
          onContinue={(boxes) => {
            setTargetBoxes(boxes)
            setCurrentScreen("quickfire-difficulty")
          }}
        />
      )}
      {currentScreen === "quickfire-difficulty" && (
        <DifficultySelection
          mode="quickfire"
          onBack={() => setCurrentScreen("quickfire")}
          onSelectDifficulty={(difficulty) => {
            setSelectedDifficulty(difficulty)
            setCurrentScreen("game")
          }}
        />
      )}
      {currentScreen === "game" && (
        <GameScreen
          mode={selectedMode}
          difficulty={selectedDifficulty}
          targetBoxes={selectedMode === "quickfire" ? targetBoxes : undefined}
          controlScheme={controlScheme}
          onMainMenu={() => setCurrentScreen("menu")}
          onChangeMode={() => setCurrentScreen("game-modes")}
          onSettings={() => {
            setReturnToScreen("game")
            setCurrentScreen("settings")
          }}
        />
      )}
      {currentScreen === "settings" && (
        <SettingsScreen
          controlScheme={controlScheme}
          onControlSchemeChange={setControlScheme}
          onBack={() => setCurrentScreen(returnToScreen as any)}
          fromScreen={returnToScreen}
          onLogout={() => setCurrentScreen("login")}
        />
      )}
    </div>
  )
}
