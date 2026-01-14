'use client'

import { useEffect, useRef, useState } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GameAudio } from '../../../lib/gameAudio'

// Dynamic import Phaser to avoid SSR issues
let Phaser: any = null
if (typeof window !== 'undefined') {
  Phaser = require('phaser')
}

interface GameplayData {
  timestamp: number
  action: 'produce' | 'upgrade' | 'allocate' | 'optimize'
  gameState: {
    resources: number
    production: number
    efficiency: number
    score: number
  }
}

export default function ResourceGamePage() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [resources, setResources] = useState(100)
  const [production, setProduction] = useState(10)
  const [gameplayData, setGameplayData] = useState<GameplayData[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(true)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [efficiency, setEfficiency] = useState(1.0)
  const [level, setLevel] = useState(1)
  const gameAudioRef = useRef<any>(null)

  // AI State
  const [isAIPlaying, setIsAIPlaying] = useState(false)

  // Game Actions Ref
  const gameActionsRef = useRef<{
    produce: () => boolean,
    upgrade: () => boolean,
    optimize: () => boolean,
    getState: () => { resources: number, production: number, efficiency: number, level: number }
  } | null>(null)

  const handleRestart = () => {
    // Reset all states
    setScore(0)
    setResources(100)
    setProduction(10)
    setEfficiency(1.0)
    setLevel(1)
    setGameplayData([])
    setIsAIPlaying(false)

    // Destroy existing game
    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true)
      phaserGameRef.current = null
    }

    // Cleanup audio
    if (gameAudioRef.current) {
      gameAudioRef.current.cleanup()
      gameAudioRef.current = null
    }

    // Force re-render to recreate game
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current || !Phaser) return

    // Initialize audio
    gameAudioRef.current = new GameAudio()
    if (isMusicPlaying) {
      gameAudioRef.current.startBackgroundMusic(musicVolume)
    }

    const config: any = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      backgroundColor: '#0A0E27',
      scene: {
        create: function () {
          const scene = this as Phaser.Scene

          const background = scene.add.rectangle(400, 300, 800, 600, 0x1A1F3A)

          let gameData: GameplayData[] = []
          let currentResources = 100
          let currentProduction = 10
          let currentScore = 0
          let currentEfficiency = 1.0
          let currentLevel = 1
          let upgradeCount = 0
          let lastLevelNotified = 0
          let currentCase = 0
          let caseTarget = 0
          let caseProgress = 0

          // Case studies/scenarios
          const cases = [
            {
              name: 'Startup Phase',
              description: 'Limited resources. Focus on production first.',
              initialResources: 50,
              initialProduction: 5,
              target: 500
            },
            {
              name: 'Expansion Phase',
              description: 'Growing business. Balance production and upgrades.',
              initialResources: 200,
              initialProduction: 15,
              target: 1000
            },
            {
              name: 'Efficiency Challenge',
              description: 'Maximize efficiency. Optimize is key.',
              initialResources: 150,
              initialProduction: 10,
              target: 2000
            },
            {
              name: 'Crisis Management',
              description: 'Resources are low. Recover quickly!',
              initialResources: 30,
              initialProduction: 3,
              target: 800
            },
            {
              name: 'Optimization Master',
              description: 'Maximize all metrics. Full optimization needed.',
              initialResources: 100,
              initialProduction: 10,
              target: 3000
            }
          ]

          // Initialize case
          currentResources = cases[currentCase].initialResources
          currentProduction = cases[currentCase].initialProduction
          caseTarget = cases[currentCase].target
          caseProgress = 0

          const scoreText = scene.add.text(20, 20, 'Score: 0 | Resources: 100 | Production: 10/s', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace'
          })

          // Case display
          const caseNameText = scene.add.text(400, 50, `Case: ${cases[currentCase].name}`, { fontSize: '22px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          const caseDescText = scene.add.text(400, 80, cases[currentCase].description, { fontSize: '16px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5)
          const caseProgressText = scene.add.text(400, 110, `Progress: ${caseProgress}/${caseTarget}`, { fontSize: '18px', color: '#00ff00', fontFamily: 'monospace' }).setOrigin(0.5)
          const caseProgressBarBg = scene.add.rectangle(400, 140, 400, 15, 0x2A2F4A)
          const caseProgressBar = scene.add.rectangle(200, 140, 0, 15, 0x00ff00)
          caseProgressBar.setOrigin(0, 0.5)

          // Resource bar
          const resourceBarBg = scene.add.rectangle(400, 200, 400, 30, 0x2A2F4A)
          const resourceBar = scene.add.rectangle(200, 200, 0, 30, 0x00D9FF)
          resourceBar.setOrigin(0, 0.5)

          const productionIndicator = scene.add.text(400, 250, 'Production: 10/s', { fontSize: '20px', color: '#00ff00', fontFamily: 'monospace' }).setOrigin(0.5)
          const efficiencyIndicator = scene.add.text(400, 300, 'Efficiency: 100%', { fontSize: '20px', color: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5)

          // Buttons
          const produceButton = scene.add.rectangle(200, 500, 150, 50, 0x00D9FF)
          const produceText = scene.add.text(200, 500, 'PRODUCE', { fontSize: '18px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          produceButton.setInteractive({ useHandCursor: true })

          const upgradeButton = scene.add.rectangle(400, 500, 150, 50, 0xffd700)
          const upgradeText = scene.add.text(400, 500, 'UPGRADE', { fontSize: '18px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          upgradeButton.setInteractive({ useHandCursor: true })

          const optimizeButton = scene.add.rectangle(600, 500, 150, 50, 0x00ff00)
          const optimizeText = scene.add.text(600, 500, 'OPTIMIZE', { fontSize: '18px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          optimizeButton.setInteractive({ useHandCursor: true })

          const createParticleEffect = (x: number, y: number, color: number, count: number = 10) => {
            for (let i = 0; i < count; i++) {
              const particle = scene.add.circle(x, y, 3, color)
              const angle = (i / count) * Math.PI * 2
              scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 40,
                y: y + Math.sin(angle) * 40,
                alpha: 0,
                scale: 0,
                duration: 600,
                onComplete: () => particle.destroy()
              })
            }
          }

          const recordAction = (action: GameplayData['action']) => {
            const data: GameplayData = {
              timestamp: Date.now(),
              action,
              gameState: {
                resources: currentResources,
                production: currentProduction,
                efficiency: currentProduction / 10,
                score: currentScore
              }
            }
            gameData.push(data)
            setGameplayData([...gameData])
          }

          const updateUI = () => {
            scoreText.setText(`Score: ${currentScore} | Resources: ${currentResources} | Production: ${Math.floor(currentProduction * currentEfficiency)}/s | Efficiency: ${(currentEfficiency * 100).toFixed(0)}%`)

            const barWidth = Math.min(400, (currentResources / 200) * 400)
            scene.tweens.add({ targets: resourceBar, width: barWidth, duration: 300, ease: 'Power2' })

            productionIndicator.setText(`Production: ${Math.floor(currentProduction * currentEfficiency)}/s`)
            efficiencyIndicator.setText(`Efficiency: ${(currentEfficiency * 100).toFixed(0)}%`)

            caseProgress = currentResources
            const progressPercent = Math.min(100, (caseProgress / caseTarget) * 100)
            caseProgressText.setText(`Progress: ${caseProgress}/${caseTarget} (${progressPercent.toFixed(0)}%)`)

            const progressBarWidth = (progressPercent / 100) * 400
            scene.tweens.add({ targets: caseProgressBar, width: progressBarWidth, duration: 300, ease: 'Power2' })

            if (caseProgress >= caseTarget) {
              currentCase = (currentCase + 1) % cases.length
              caseTarget = cases[currentCase].target
              caseProgress = 0
              currentResources = cases[currentCase].initialResources
              currentProduction = cases[currentCase].initialProduction

              scene.tweens.add({
                targets: [caseNameText, caseDescText, caseProgressText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  caseNameText.setText(`Case: ${cases[currentCase].name}`)
                  caseDescText.setText(cases[currentCase].description)
                  caseProgressText.setText(`Progress: ${caseProgress}/${caseTarget}`)
                  scene.tweens.add({ targets: [caseNameText, caseDescText, caseProgressText], alpha: 1, duration: 300 })
                }
              })

              scene.tweens.add({ targets: caseProgressBar, width: 0, duration: 300 })
              gameAudioRef.current?.playSound('levelup')
              toast.success(`✅ Case Complete! New Case: ${cases[currentCase].name}`, { duration: 2000 })
              updateUI()
              return
            }

            setScore(currentScore)
            setResources(currentResources)
            setProduction(Math.floor(currentProduction * currentEfficiency))
          }

          // --- Actions ---
          const doProduce = () => {
            // Button animation logic moved or duplicated if needed, skipping for AI performance
            const produced = Math.floor(currentProduction * currentEfficiency)
            currentResources += produced
            currentScore += produced
            createParticleEffect(200, 500, 0x00D9FF, 15)

            const resourceText = scene.add.text(400, 200, `+${produced}`, { fontSize: '24px', color: '#00D9FF', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
            scene.tweens.add({ targets: resourceText, y: 150, alpha: 0, duration: 1000, onComplete: () => resourceText.destroy() })

            recordAction('produce')
            gameAudioRef.current?.playSound('coin')
            updateUI()
            if (!isAIPlaying) toast.success(`⚡ +${produced} resources!`, { duration: 500 })
            return true
          }

          const doUpgrade = () => {
            if (currentResources >= 50) {
              currentResources -= 50
              currentProduction += 5
              upgradeCount++
              createParticleEffect(400, 500, 0xffd700, 20)

              const upgradeText = scene.add.text(400, 250, 'Production +5!', { fontSize: '24px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
              scene.tweens.add({ targets: upgradeText, scale: 1.5, alpha: 0, duration: 1000, onComplete: () => upgradeText.destroy() })

              recordAction('upgrade')
              gameAudioRef.current?.playSound('powerup')
              updateUI()

              if (upgradeCount % 3 === 0) {
                const newLevel = currentLevel + 1
                if (newLevel > lastLevelNotified) {
                  lastLevelNotified = newLevel
                  currentLevel = newLevel
                  setLevel(currentLevel)
                  gameAudioRef.current?.playSound('levelup')
                  toast.success(`🎉 Level ${currentLevel}!`, { duration: 2000 })
                }
              }
              if (!isAIPlaying) toast.success('⚙️ Production upgraded!', { duration: 1000 })
              return true
            }
            return false
          }

          const doOptimize = () => {
            if (currentResources >= 30) {
              currentResources -= 30
              currentEfficiency = Math.min(2.0, currentEfficiency + 0.1)
              currentProduction = Math.floor(currentProduction * 1.1)
              recordAction('optimize')
              gameAudioRef.current?.playSound('powerup')
              setEfficiency(currentEfficiency)
              updateUI()
              if (!isAIPlaying) toast.success(`✨ Efficiency: ${(currentEfficiency * 100).toFixed(0)}%!`, { duration: 1000 })
              return true
            }
            return false
          }

          // Button wiring
          produceButton.on('pointerdown', () => { if (!isAIPlaying) doProduce() })
          upgradeButton.on('pointerdown', () => { if (!isAIPlaying) doUpgrade() })
          optimizeButton.on('pointerdown', () => { if (!isAIPlaying) doOptimize() })

          // Ref export
          gameActionsRef.current = {
            produce: doProduce,
            upgrade: doUpgrade,
            optimize: doOptimize,
            getState: () => ({ resources: currentResources, production: currentProduction, efficiency: currentEfficiency, level: currentLevel })
          }

          // Passive production (every 1s)
          scene.time.addEvent({
            delay: 1000,
            callback: () => {
              const produced = Math.floor(currentProduction * currentEfficiency)
              currentResources += produced
              currentScore += produced
              updateUI()
            },
            loop: true
          })

          setIsPlaying(true)
        }
      }
    }

    if (Phaser) {
      phaserGameRef.current = new Phaser.Game(config)
    }

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true)
        phaserGameRef.current = null
      }
      if (gameAudioRef.current) {
        gameAudioRef.current.cleanup()
      }
    }
  }, [isMusicPlaying, musicVolume])

  // AI Logic
  useEffect(() => {
    if (!isAIPlaying || !gameActionsRef.current) return

    const thinkInterval = setInterval(() => {
      const state = gameActionsRef.current!.getState()

      // AI Strategy
      // 1. If Efficiency is low (< 150%) and affordable, optimize! (It's cheap: 30)
      if (state.efficiency < 1.5 && state.resources >= 30) {
        gameActionsRef.current!.optimize()
      }
      // 2. If Production is low compared to level, upgrade (Cost: 50)
      else if (state.resources >= 50 && Math.random() > 0.3) {
        gameActionsRef.current!.upgrade()
      }
      // 3. Otherwise, Produce (Free, generates resources) to build capital
      else {
        gameActionsRef.current!.produce()
      }

    }, 800) // Fast actions

    return () => clearInterval(thinkInterval)
  }, [isAIPlaying])

  // ... (keeping handleStartTraining and music logic same)
  const handleStartTraining = async () => {
    if (gameplayData.length === 0) {
      toast.error('Play the game first to collect training data!')
      return
    }
    setIsTraining(true)
    toast.loading('Starting AI training...', { id: 'training' })
    await new Promise(resolve => setTimeout(resolve, 1500));
    const mockTrainingId = 'train_' + Date.now();
    toast.dismiss('training')
    toast.success('Training started!')
    window.location.href = `/training?id=${mockTrainingId}`
  }

  // Music control (re-added for completeness)
  useEffect(() => {
    if (gameAudioRef.current) {
      if (isMusicPlaying && isPlaying) {
        gameAudioRef.current.startBackgroundMusic(musicVolume)
      } else {
        gameAudioRef.current.stopBackgroundMusic()
      }
      gameAudioRef.current.setVolume(musicVolume)
    }
  }, [isMusicPlaying, musicVolume, isPlaying])

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">ResourceManager</h1>
              <p className="text-gray-400">Manage resources, optimize production. Train your Protocol Optimizer!</p>
            </div>
            <Link href="/games">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-[#1A1F3A] hover:bg-[#252B45] text-gray-300 rounded-lg border border-[#2A2F4A] transition-all"
              >
                ← Back to Games
              </motion.button>
            </Link>
          </div>

          <div className="flex gap-4 mb-6">
            {/* Stats Cards ... */}
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Score</div>
              <div className="text-2xl font-bold text-arbitrum-cyan">{score}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Resources</div>
              <div className="text-2xl font-bold text-yellow-400">{resources}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Production</div>
              <div className="text-2xl font-bold text-green-400">{production}/s</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Efficiency</div>
              <div className="text-2xl font-bold text-purple-400">{(efficiency * 100).toFixed(0)}%</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Level</div>
              <div className="text-2xl font-bold text-indigo-400">{level}</div>
            </div>
          </div>
        </div>

        {/* AI Training Banner */}
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Autopilot Button */}
            <button
              onClick={() => setIsAIPlaying(!isAIPlaying)}
              className={`px-6 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${isAIPlaying
                  ? 'bg-indigo-600 text-white shadow-[0_0_20px_rgba(79,70,229,0.5)] animate-pulse'
                  : 'bg-[#1A1F3A] text-gray-400 hover:bg-[#252B45] border border-[#2A2F4A]'
                }`}
            >
              {isAIPlaying ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  AI OPTIMIZING...
                </>
              ) : (
                <>
                  <span>⚡</span>
                  Watch AI Optimize
                </>
              )}
            </button>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">AI Training in Progress</h3>
              <p className="text-gray-300 mb-3">
                Every resource management decision teaches the AI optimization strategies.
              </p>
              <p className="text-indigo-400 font-semibold mt-3">
                → Deploy as: <span className="text-white">Protocol Optimizer</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Resource Management</h2>
            <div className="flex items-center gap-4">
              {/* Controls */}
              <div className="flex items-center gap-2 bg-[#1A1F3A] rounded-lg px-3 py-2 border border-[#2A2F4A]">
                <button
                  onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {isMusicPlaying ? '🔊' : '🔇'}
                </button>
                <input
                  type="range"
                  min="0" max="1" step="0.1"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-[#2A2F4A] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestart}
                className="px-4 py-2 bg-[#1A1F3A] hover:bg-[#252B45] text-gray-300 rounded-lg border border-[#2A2F4A] transition-all text-sm"
              >
                🔄 Restart
              </motion.button>
            </div>
          </div>
          <div className="flex justify-center">
            <div ref={gameRef} className={`rounded-lg overflow-hidden border-2 ${isAIPlaying ? 'border-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.3)]' : 'border-[#1A1F3A]'} transition-all`} />
          </div>
        </div>

        <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
          {/* Training Footer */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">AI Training</h2>
              <p className="text-sm text-gray-400">
                {gameplayData.length > 0
                  ? `${gameplayData.length} actions recorded. Ready to train AI!`
                  : 'Play the game to collect training data.'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartTraining}
              disabled={gameplayData.length === 0 || isTraining}
              className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {isTraining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Training...
                </>
              ) : (
                <>
                  <span className="text-xl">🤖</span>
                  Start Training
                </>
              )}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  )
}
