'use client'

import { useEffect, useRef, useState } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
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
  action: 'plan' | 'execute' | 'predict' | 'optimize'
  gameState: {
    strategy: number
    prediction: number
    score: number
    level: number
  }
}

export default function StrategyGamePage() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [strategy, setStrategy] = useState(0)
  const [level, setLevel] = useState(1)
  const [gameplayData, setGameplayData] = useState<GameplayData[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(true)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [predictionAccuracy, setPredictionAccuracy] = useState(0)
  const gameAudioRef = useRef<any>(null)

  // AI State
  const [isAIPlaying, setIsAIPlaying] = useState(false)
  const isAIPlayingRef = useRef(isAIPlaying)

  useEffect(() => {
    isAIPlayingRef.current = isAIPlaying
  }, [isAIPlaying])

  const isPlayingRef = useRef(isPlaying)
  useEffect(() => {
    isPlayingRef.current = isPlaying
  }, [isPlaying])

  // Game Actions Ref
  const gameActionsRef = useRef<{
    plan: (targetStrategy?: number) => void,
    execute: () => void,
    predict: () => void,
    getState: () => { currentStrategy: number, currentCase: any, optimalStrategy: number }
  } | null>(null)

  // Mode Selection
  const [isModeSelected, setIsModeSelected] = useState(false)

  const handleRestart = () => {
    // Reset all states
    setScore(0)
    setStrategy(0)
    setLevel(1)
    setPredictionAccuracy(0)
    setGameplayData([])
    setIsAIPlaying(false)
    setIsModeSelected(false)

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
    if (!isModeSelected) return
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
          const scene = this as unknown as Phaser.Scene

          const background = scene.add.rectangle(400, 300, 800, 600, 0x1A1F3A)

          let gameData: GameplayData[] = []
          let currentStrategy = 0
          let currentScore = 0
          let currentLevel = 1
          let lastLevelNotified = 0
          let currentCase = 0
          let caseScore = 0

          // Case studies/scenarios
          const cases = [
            {
              name: 'Market Volatility',
              description: 'High volatility market. Choose strategy carefully.',
              difficulty: 1,
              optimalStrategy: 1, // Balanced
              bonus: 1.2
            },
            {
              name: 'Bull Market',
              description: 'Rising market trend. Aggressive strategy recommended.',
              difficulty: 1,
              optimalStrategy: 0, // Aggressive
              bonus: 1.5
            },
            {
              name: 'Bear Market',
              description: 'Falling market. Defensive strategy is safer.',
              difficulty: 2,
              optimalStrategy: 2, // Defensive
              bonus: 1.3
            },
            {
              name: 'Crisis Management',
              description: 'Market crash scenario. Defensive approach needed.',
              difficulty: 3,
              optimalStrategy: 2, // Defensive
              bonus: 2.0
            },
            {
              name: 'Growth Phase',
              description: 'Expansion opportunity. Aggressive moves pay off.',
              difficulty: 2,
              optimalStrategy: 0, // Aggressive
              bonus: 1.8
            }
          ]

          const scoreText = scene.add.text(20, 20, 'Score: 0 | Strategy: 0 | Level: 1', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace'
          })

          // Case display
          const caseNameText = scene.add.text(400, 50, `Case: ${cases[currentCase].name}`, { fontSize: '22px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          const caseDescText = scene.add.text(400, 80, cases[currentCase].description, { fontSize: '16px', color: '#cccccc', fontFamily: 'monospace' }).setOrigin(0.5)
          const caseScoreText = scene.add.text(400, 110, `Case Score: ${caseScore}`, { fontSize: '18px', color: '#00ff00', fontFamily: 'monospace' }).setOrigin(0.5)

          const strategies = ['Aggressive', 'Balanced', 'Defensive']
          const strategyColors = [0xff0000, 0x00D9FF, 0x00ff00]
          let selectedStrategy = 0

          const strategyCircleOuter = scene.add.circle(400, 150, 55, strategyColors[selectedStrategy], 0.2)
          const strategyCircle = scene.add.circle(400, 150, 50, strategyColors[selectedStrategy], 0.3)

          const strategyText = scene.add.text(400, 150, strategies[selectedStrategy], { fontSize: '20px', color: '#ffffff', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)

          const predictionMeterBg = scene.add.rectangle(400, 250, 300, 20, 0x2A2F4A)
          const predictionMeter = scene.add.rectangle(250, 250, 0, 20, 0xffd700)
          predictionMeter.setOrigin(0, 0.5)

          const predictionText = scene.add.text(400, 280, 'Prediction Accuracy: 0%', { fontSize: '16px', color: '#ffd700', fontFamily: 'monospace' }).setOrigin(0.5)

          // Buttons
          const planButton = scene.add.rectangle(200, 400, 150, 50, 0x00D9FF)
          const planText = scene.add.text(200, 400, 'PLAN', { fontSize: '18px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          planButton.setInteractive({ useHandCursor: true })

          const executeButton = scene.add.rectangle(400, 400, 150, 50, 0x00ff00)
          const executeText = scene.add.text(400, 400, 'EXECUTE', { fontSize: '18px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          executeButton.setInteractive({ useHandCursor: true })

          const predictButton = scene.add.rectangle(600, 400, 150, 50, 0xffd700)
          const predictText = scene.add.text(600, 400, 'PREDICT', { fontSize: '18px', color: '#000000', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
          predictButton.setInteractive({ useHandCursor: true })

          // Particle effect helper
          const createParticleEffect = (x: number, y: number, color: number, count: number = 10) => {
            for (let i = 0; i < count; i++) {
              const particle = scene.add.circle(x, y, 4, color)
              const angle = (i / count) * Math.PI * 2
              scene.tweens.add({
                targets: particle,
                x: x + Math.cos(angle) * 50,
                y: y + Math.sin(angle) * 50,
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
                strategy: selectedStrategy,
                prediction: Math.random() * 100,
                score: currentScore,
                level: currentLevel
              }
            }
            gameData.push(data)
            setGameplayData([...gameData])
          }

          const updateUI = () => {
            scoreText.setText(`Score: ${currentScore} | Strategy: ${currentStrategy} | Level: ${currentLevel}`)
            const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
            const meterWidth = (accuracy / 100) * 300
            scene.tweens.add({ targets: predictionMeter, width: meterWidth, duration: 300, ease: 'Power2' })
            predictionText.setText(`Prediction Accuracy: ${accuracy.toFixed(0)}%`)
            setScore(currentScore)
          }

          // --- Actions ---
          const doPlan = (targetStrategy?: number) => {
            // Button animation
            scene.tweens.add({
              targets: planButton,
              scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true
            })

            if (targetStrategy !== undefined) {
              selectedStrategy = targetStrategy
            } else {
              selectedStrategy = (selectedStrategy + 1) % strategies.length
            }

            scene.tweens.add({
              targets: [strategyCircle, strategyCircleOuter],
              scaleX: 1.2, scaleY: 1.2, duration: 200, yoyo: true,
              onComplete: () => {
                strategyCircle.setFillStyle(strategyColors[selectedStrategy], 0.3)
                strategyCircleOuter.setFillStyle(strategyColors[selectedStrategy], 0.2)
              }
            })

            strategyText.setText(strategies[selectedStrategy])
            createParticleEffect(400, 150, strategyColors[selectedStrategy], 12)

            recordAction('plan')
            setStrategy(selectedStrategy)
            if (!isAIPlaying) toast(`Strategy: ${strategies[selectedStrategy]}`, { icon: 'ℹ️' })
          }

          let correctPredictions = 0
          let totalPredictions = 0

          const doExecute = () => {
            scene.tweens.add({ targets: executeButton, scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true })

            const basePoints = [50, 75, 100][selectedStrategy]
            const bonus = currentLevel * 10

            let caseBonus = 1.0
            if (selectedStrategy === cases[currentCase].optimalStrategy) {
              caseBonus = cases[currentCase].bonus
              if (!isAIPlaying) toast.success(`🎯 Optimal strategy! ${(caseBonus * 100).toFixed(0)}% bonus!`, { duration: 1500 })
            }

            const points = Math.floor((basePoints + bonus) * caseBonus)
            currentScore += points
            caseScore += points
            currentStrategy++

            caseScoreText.setText(`Case Score: ${caseScore}`)

            const caseTarget = cases[currentCase].difficulty * 500
            if (caseScore >= caseTarget) {
              currentCase = (currentCase + 1) % cases.length
              caseScore = 0

              scene.tweens.add({
                targets: [caseNameText, caseDescText, caseScoreText], alpha: 0, duration: 300,
                onComplete: () => {
                  caseNameText.setText(`Case: ${cases[currentCase].name}`)
                  caseDescText.setText(cases[currentCase].description)
                  caseScoreText.setText(`Case Score: ${caseScore}`)
                  scene.tweens.add({ targets: [caseNameText, caseDescText, caseScoreText], alpha: 1, duration: 300 })
                }
              })

              gameAudioRef.current?.playSound('levelup')
              toast.success(`✅ Case Complete! New Case: ${cases[currentCase].name}`, { duration: 2000 })

              // If AI is playing, force it to re-think strategy immediately
              if (gameActionsRef.current && isAIPlaying) {
                // Acknowledge change
              }
            }

            createParticleEffect(400, 400, 0x00ff00, 20)

            const pointsText = scene.add.text(400, 350, `+${points}`, { fontSize: '28px', color: '#00ff00', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
            scene.tweens.add({ targets: pointsText, y: 300, scale: 1.3, alpha: 0, duration: 1200, onComplete: () => pointsText.destroy() })

            recordAction('execute')
            gameAudioRef.current?.playSound('success')
            updateUI()
            if (!isAIPlaying) toast.success(`⚔️ +${points} points!`, { duration: 1000 })

            if (currentScore >= currentLevel * 200) {
              const newLevel = currentLevel + 1
              if (newLevel > lastLevelNotified) {
                lastLevelNotified = newLevel
                currentLevel = newLevel
                setLevel(currentLevel)
                gameAudioRef.current?.playSound('levelup')
                toast.success(`🎉 Level ${currentLevel}!`, { duration: 2000 })
              }
            }
          }

          const doPredict = () => {
            scene.tweens.add({ targets: predictButton, scaleX: 0.9, scaleY: 0.9, duration: 100, yoyo: true })

            totalPredictions++
            const prediction = Math.random() * 100
            const threshold = 50 + (currentLevel * 5)

            const predictionValue = scene.add.text(400, 250, `${prediction.toFixed(0)}%`, { fontSize: '32px', color: '#ffd700', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
            scene.tweens.add({ targets: predictionValue, scale: 1.5, alpha: 0, duration: 800, onComplete: () => predictionValue.destroy() })

            if (prediction > threshold) {
              correctPredictions++
              currentScore += 30 + (currentLevel * 5)
              createParticleEffect(600, 400, 0xffd700, 20)

              const successText = scene.add.text(400, 250, '✓ CORRECT', { fontSize: '24px', color: '#00ff00', fontFamily: 'monospace', fontStyle: 'bold' }).setOrigin(0.5)
              scene.tweens.add({ targets: successText, y: 200, alpha: 0, duration: 1000, onComplete: () => successText.destroy() })

              recordAction('predict')
              gameAudioRef.current?.playSound('success')
              updateUI()
              if (!isAIPlaying) toast.success(`🎯 Prediction correct! +${30 + (currentLevel * 5)}`, { duration: 1000 })
            } else {
              recordAction('predict')
              gameAudioRef.current?.playSound('error')

              // Error indicator (visual only)

              scene.tweens.add({ targets: predictButton, x: 595, duration: 50, yoyo: true, repeat: 2 })
              if (!isAIPlaying) toast.error('❌ Prediction wrong!')
            }
            // Update UI regardless
            const accuracy = (correctPredictions / totalPredictions) * 100
            setPredictionAccuracy(accuracy)
            updateUI()
          }


          // Wiring
          planButton.on('pointerdown', () => { if (!isAIPlaying) doPlan() })
          executeButton.on('pointerdown', () => { if (!isAIPlaying) doExecute() })
          predictButton.on('pointerdown', () => { if (!isAIPlaying) doPredict() })

          // Expose actions
          gameActionsRef.current = {
            plan: doPlan,
            execute: doExecute,
            predict: doPredict,
            getState: () => ({ currentStrategy: selectedStrategy, currentCase: cases[currentCase], optimalStrategy: cases[currentCase].optimalStrategy })
          }


          // Only auto-start if NOT in AI mode
          // In AI Mode, we wait for data upload.
          if (!isAIPlayingRef.current) {
            setIsPlaying(true)
          }
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
  }, [isMusicPlaying, musicVolume, isModeSelected])

  // AI Logic
  useEffect(() => {
    if (!isAIPlaying || !gameActionsRef.current) return

    const thinkInterval = setInterval(() => {
      // If game is not technically "playing" (e.g. waiting for start), do nothing
      if (!isPlayingRef.current) return

      const state = gameActionsRef.current!.getState()

      // --- Data-Driven Replay Logic ---
      if (activeReplayDataRef.current.length > 0) {
        const elapsedTime = Date.now() - replayStartTimeRef.current

        // Find actions to execute
        // Note: Strategy game is slower paced, actions might be sparse.
        // We iterate through actions that happened up to this point

        while (
          replayIndexRef.current < activeReplayDataRef.current.length &&
          (activeReplayDataRef.current[replayIndexRef.current].timestamp - activeReplayDataRef.current[0].timestamp) <= elapsedTime
        ) {
          const actionData = activeReplayDataRef.current[replayIndexRef.current]

          // Execute Action
          if (actionData.action === 'plan') {
            // We recorded the strategy state AFTER plan.
            // Ideally we should record the Target Strategy.
            // "gameState.strategy" holds the new strategy.
            gameActionsRef.current!.plan(actionData.gameState.strategy)
          } else if (actionData.action === 'execute') {
            gameActionsRef.current!.execute()
          } else if (actionData.action === 'predict') {
            gameActionsRef.current!.predict()
          }

          replayIndexRef.current++
        }
        return // Skip heuristic if replay is active
      }

      // --- Heuristic Fallback (Original Logic) ---

      // 1. Check Strategy
      if (state.currentStrategy !== state.optimalStrategy) {
        gameActionsRef.current!.plan(state.optimalStrategy)
        return
      }

      // 2. Predict occasionally (20% chance)
      // Don't spam predict as it can fail
      if (Math.random() > 0.8) {
        gameActionsRef.current!.predict()
      } else {
        // 3. Execute frequently
        gameActionsRef.current!.execute()
      }

    }, 100) // Run faster loop for smoother replay check (100ms instead of 500ms)

    return () => clearInterval(thinkInterval)
  }, [isAIPlaying])

  const [replayData, setReplayData] = useState<GameplayData[]>([])
  const activeReplayDataRef = useRef<GameplayData[]>([])
  const replayStartTimeRef = useRef(0)
  const replayIndexRef = useRef(0)

  // Sync ref
  useEffect(() => {
    activeReplayDataRef.current = replayData
  }, [replayData])

  // Reset replay on start
  useEffect(() => {
    // For Strategy game, "isPlaying" is true on mount usually?
    // Check line 377: setIsPlaying(true) inside create.
    // We might need to reset start time when AI is toggled ON.
    if (isAIPlaying) {
      replayStartTimeRef.current = Date.now()
      replayIndexRef.current = 0
    }
  }, [isAIPlaying])


  const handleDownloadData = () => {
    if (gameplayData.length === 0) return
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameplayData))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute("href", dataStr)
    downloadAnchorNode.setAttribute("download", "strategy_agent_data.json")
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
    toast.success('Strategy data downloaded!')
  }

  const handleUploadData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader()
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8")
      fileReader.onload = (e) => {
        try {
          if (e.target?.result) {
            const parsedData = JSON.parse(e.target.result as string) as GameplayData[]
            if (Array.isArray(parsedData) && parsedData.length > 0 && parsedData[0].action) {
              setReplayData(parsedData)
              toast.success(`Strategy Model Loaded: ${parsedData.length} decision points.`)
            } else {
              toast.error('Invalid strategy data')
            }
          }
        } catch (error) {
          toast.error('Failed to parse JSON')
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />
      <AnimatePresence>
        {!isModeSelected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0E27]/95 backdrop-blur-sm p-4"
          >
            <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Manual Mode Card */}
              <motion.button
                whileHover={{ scale: 1.02, borderColor: '#00D9FF' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsModeSelected(true)}
                className="group relative h-[400px] rounded-2xl border-2 border-[#1A1F3A] bg-[#0F1422] p-8 text-left transition-all overflow-hidden flex flex-col justify-between hover:shadow-[0_0_30px_rgba(0,217,255,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6">
                    <span className="text-3xl">♟️</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Manual Strategy</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Take command of the portfolio. Make real-time decisions on asset allocation, strategy shifts, and market predictions.
                  </p>
                </div>
                <div className="relative z-10 flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                  ENTER WAR ROOM <span className="ml-2">→</span>
                </div>
              </motion.button>

              {/* Data/AI Mode Card */}
              <motion.button
                whileHover={{ scale: 1.02, borderColor: '#9333EA' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsAIPlaying(true)
                  setIsModeSelected(true)
                }}
                className="group relative h-[400px] rounded-2xl border-2 border-[#1A1F3A] bg-[#0F1422] p-8 text-left transition-all overflow-hidden flex flex-col justify-between hover:shadow-[0_0_30px_rgba(147,51,234,0.2)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6">
                    <span className="text-3xl">🤖</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Play by Data</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Upload your strategic history. Watch the AI Agent replicate your decision-making patterns in the simulation.
                  </p>
                </div>
                <div className="relative z-10 flex items-center text-purple-400 font-bold group-hover:translate-x-2 transition-transform">
                  LOAD AGENT <span className="ml-2">→</span>
                </div>

                {/* Badge */}
                <div className="absolute top-6 right-6 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 text-xs text-purple-300 font-mono">
                  GHOST MODE
                </div>
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Waiting for Data Overlay */}
      <AnimatePresence>
        {isAIPlaying && !isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-[2px] pointer-events-none"
          >
            <div className="bg-[#0F1422] border border-[#2A2F4A] p-6 rounded-2xl flex flex-col items-center gap-4 max-w-sm text-center shadow-2xl pointer-events-auto">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold text-white">Ghost Mode Ready</h3>

              {replayData.length > 0 ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-green-400">
                    Data loaded: {replayData.length} decisions.
                  </p>
                  <button
                    onClick={() => setIsPlaying(true)}
                    className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg hover:shadow-purple-500/30 transition-all animate-bounce"
                  >
                    START SIMULATION
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-400">
                    System initialized. Upload data to begin the simulation.
                  </p>
                  <div className="text-xs text-purple-400 font-mono animate-pulse border border-purple-500/30 px-3 py-1 rounded bg-purple-500/10">
                    WAITING FOR SIGNAL...
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>


      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">StrategyMaster</h1>
              <p className="text-gray-400">Plan, execute, predict. Train your Strategy Agent!</p>
            </div>
            <div className="flex gap-3">
              {!isAIPlaying && isModeSelected && (
                <button
                  onClick={() => {
                    const newTrainingId = 'train_' + Date.now();
                    const realWorldConfig = {
                      portfolioType: ['Conservative', 'Balanced', 'Aggressive', 'Degen'][strategy] || 'Balanced',
                      riskScore: 'Medium', // Default for now
                      rebalanceFrequency: 'Daily',
                      assetAllocation: {
                        ETH: '40%',
                        USDC: '40%',
                        ARB: '20%'
                      }
                    }
                    localStorage.setItem('stylus_strategy_config', JSON.stringify({
                      id: newTrainingId,
                      timestamp: Date.now(),
                      parameters: realWorldConfig
                    }))
                    window.location.href = `/training?id=${newTrainingId}&type=strategy`
                  }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-[0_0_20px_rgba(147,51,234,0.5)] text-white font-bold rounded-lg transition-all flex items-center gap-2 animate-pulse"
                >
                  <span className="text-xl">⚡</span>
                  Train AI Agent
                </button>
              )}
              <Link href="/games">
                <motion.button
                  whileHover={{ x: -4 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-[#1A1F3A] hover:bg-[#252B45] text-gray-300 rounded-lg border border-[#2A2F4A] transition-all"
                >
                  ← Back to Games
                </motion.button>
              </Link>
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Score</div>
              <div className="text-2xl font-bold text-arbitrum-cyan">{score}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Strategy</div>
              <div className="text-2xl font-bold text-purple-400">{strategy}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Level</div>
              <div className="text-2xl font-bold text-blue-400">{level}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Prediction</div>
              <div className="text-2xl font-bold text-red-400">{predictionAccuracy.toFixed(0)}%</div>
            </div>
          </div>
        </div>

        {/* AI Banner */}
        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl border border-red-500/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            {/* Autopilot Button */}
            <button
              onClick={() => setIsAIPlaying(!isAIPlaying)}
              disabled={replayData.length === 0}
              className={`px-6 py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${isAIPlaying
                ? 'bg-green-600 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)] animate-pulse'
                : replayData.length === 0
                  ? 'bg-[#1A1F3A] text-gray-500 border border-[#2A2F4A] cursor-not-allowed'
                  : 'bg-[#1A1F3A] text-white hover:bg-[#252B45] border border-green-500/50'
                }`}
            >
              {isAIPlaying ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  AI GHOST ACTIVE
                </>
              ) : replayData.length === 0 ? (
                <>
                  <span>⚠️</span>
                  UPLOAD DATA FIRST
                </>
              ) : (
                <>
                  <span>👻</span>
                  ENABLE GHOST MODE
                </>
              )}
            </button>

            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">AI Training in Progress</h3>
              <p className="text-gray-300 mb-3">
                The AI learns:
                Strategic Planning, Prediction, and Multi-Step Decisions.
              </p>
              <p className="text-red-400 font-semibold mt-3">
                → Deploy as: <span className="text-white">Strategy Agent</span>
              </p>
            </div>
          </div>
        </div>

        {/* Game Container */}
        <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Strategy Game</h2>
            {/* Music Controls */}
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
                className="w-20 h-1 bg-[#2A2F4A] rounded-lg appearance-none cursor-pointer accent-red-500"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRestart}
                className="px-4 py-2 bg-[#1A1F3A] hover:bg-[#252B45] text-gray-300 rounded-lg border border-[#2A2F4A] transition-all text-sm ml-2"
              >
                🔄 Restart
              </motion.button>
            </div>
          </div>
          <div className="flex justify-center">
            <div ref={gameRef} className={`rounded-lg overflow-hidden border-2 ${isAIPlaying ? 'border-red-500 shadow-[0_0_30px_rgba(220,38,38,0.3)]' : 'border-[#1A1F3A]'} transition-all`} />
          </div>
        </div>

        <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white mb-2">AI Data Center</h2>
                <p className="text-sm text-gray-400">
                  {gameplayData.length > 0
                    ? `${gameplayData.length} strategic decisions recorded.`
                    : 'Play manual games to build a training dataset.'}
                </p>
              </div>

              <div className="flex gap-3">
                {/* Download Button */}
                <button
                  onClick={handleDownloadData}
                  disabled={gameplayData.length === 0}
                  className="px-4 py-3 bg-[#1A1F3A] hover:bg-[#252B45] text-white font-bold rounded-xl border border-[#2A2F4A] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                  <span className="text-sm">Download Data</span>
                </button>

                {/* Upload Button */}
                <label className="px-4 py-3 bg-[#1A1F3A] hover:bg-[#252B45] text-white font-bold rounded-xl border border-[#2A2F4A] transition-all flex items-center justify-center gap-2 cursor-pointer group">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleUploadData}
                    className="hidden"
                  />
                  <span className="text-sm">Upload & Train</span>
                </label>
              </div>
            </div>

            {replayData.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 p-3 rounded-lg flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 font-mono text-sm">
                  GHOST MODEL LOADED: {replayData.length} training points ready for AI replay.
                </span>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
