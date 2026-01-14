'use client'

import { useEffect, useRef, useState } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
// Dynamic import Phaser to avoid SSR issues
let Phaser: any = null
if (typeof window !== 'undefined') {
  Phaser = require('phaser')
}
import Link from 'next/link'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { GameAudio } from '../../../lib/gameAudio'
import { TrophyIcon, ZapIcon, SparklesIcon, CheckCircleIcon } from '../../components/Icons'

// Gameplay data for AI training
interface GameplayData {
  timestamp: number
  action: 'move_left' | 'move_right' | 'collect' | 'avoid'
  gameState: {
    position: number
    score: number
    speed: number
    obstacles: number
  }
}

export default function RacingGamePage() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [gameplayData, setGameplayData] = useState<GameplayData[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(true)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [combo, setCombo] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [streak, setStreak] = useState(0)
  const [powerUp, setPowerUp] = useState<string | null>(null)
  const [isGameOver, setIsGameOver] = useState(false)
  const gameAudioRef = useRef<any>(null)

  // AI Autopilot State
  const [isAIPlaying, setIsAIPlaying] = useState(false)

  // Ref to access current state inside Phaser closure
  const isAIPlayingRef = useRef(isAIPlaying)
  useEffect(() => {
    isAIPlayingRef.current = isAIPlaying
  }, [isAIPlaying])

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) return

    // Check if Phaser is loaded
    if (!Phaser) {
      console.error('Phaser not loaded')
      return
    }

    // Initialize audio
    try {
      gameAudioRef.current = new GameAudio()
      if (isMusicPlaying) {
        gameAudioRef.current.startBackgroundMusic(musicVolume)
      }
    } catch (error) {
      console.error('Failed to initialize audio:', error)
    }

    // Phaser game configuration
    const config: any = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      backgroundColor: '#0A0E27',
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      },
      scene: {
        preload: function (this: Phaser.Scene) {
          this.load.image('road', '/images/game-assets/racing-road.png')
          this.load.image('player', '/images/game-assets/racing-player.png')
          this.load.image('enemy', '/images/game-assets/racing-enemy.png')
        },
        create: function (this: Phaser.Scene) {
          const scene = this

          // Create scrolling road background
          const road = scene.add.tileSprite(400, 300, 800, 600, 'road')

          // Create player car (neon rectangle)
          const player = scene.add.rectangle(400, 500, 50, 80, 0x00D9FF)
          player.setStrokeStyle(3, 0x00ffff)
          scene.physics.add.existing(player)
            ; (player.body as any).setCollideWorldBounds(true)

          // Game variables
          let score = 0
          let speed = 5
          let level = 1
          let obstacles: Phaser.GameObjects.Rectangle[] = []
          let coins: Phaser.GameObjects.Arc[] = []
          let powerUps: Phaser.GameObjects.Rectangle[] = []
          let gameData: GameplayData[] = []
          let combo = 0
          let multiplier = 1
          let streak = 0
          let activePowerUp: string | null = null
          let lastLevelNotified = 0

          // Controls
          const cursors = scene.input.keyboard?.createCursorKeys()
          const wasd = scene.input.keyboard?.addKeys('W,S,A,D')

          // Update score display
          const updateScore = (points: number) => {
            const pointsWithMultiplier = Math.floor(points * multiplier)
            score += pointsWithMultiplier
            combo++
            streak++

            // Streak bonuses
            if (streak % 10 === 0) {
              multiplier = Math.min(5, multiplier + 0.5)
              setMultiplier(multiplier)
              gameAudioRef.current?.playSound('combo')
              toast.success(`🔥 ${streak} STREAK! ${multiplier}x Multiplier!`)
            }

            setScore(score)
            setCombo(combo)
            setStreak(streak)
          }

          // Record gameplay data
          const recordAction = (action: GameplayData['action']) => {
            const data: GameplayData = {
              timestamp: Date.now(),
              action,
              gameState: {
                position: player.x,
                score,
                speed,
                obstacles: obstacles.length
              }
            }
            gameData.push(data)
            setGameplayData([...gameData])
          }

          // Spawn obstacles (neon barriers)
          const spawnObstacle = () => {
            const x = Phaser.Math.Between(150, 650)
            const obstacle = scene.add.rectangle(x, -50, 60, 60, 0xff0044)
            obstacle.setStrokeStyle(3, 0xff0088)
            scene.physics.add.existing(obstacle)
            obstacles.push(obstacle as any)
          }

          // Spawn coins (glowing orbs)
          const spawnCoin = () => {
            const x = Phaser.Math.Between(150, 650)
            const coin = scene.add.circle(x, -50, 15, 0xffd700)
            const glow = scene.add.circle(x, -50, 25, 0xffd700, 0.3)
              ; (coin as any).glow = glow
            scene.physics.add.existing(coin)
            coins.push(coin)
          }

          // Spawn power-ups
          const spawnPowerUp = () => {
            if (Math.random() < 0.3) { // 30% chance
              const x = Phaser.Math.Between(300, 500)
              const powerUp = scene.add.rectangle(x, -30, 35, 35, 0xff00ff)
              powerUps.push(powerUp)
            }
          }

          // Spawn obstacles and coins periodically
          scene.time.addEvent({
            delay: 1500,
            callback: spawnObstacle,
            loop: true
          })

          scene.time.addEvent({
            delay: 2000,
            callback: spawnCoin,
            loop: true
          })

          scene.time.addEvent({
            delay: 5000,
            callback: spawnPowerUp,
            loop: true
          })

          // Game update loop - register as scene method
          scene.update = function () {
            // Scroll road for motion effect
            road.tilePositionY -= speed * 2

            // AI Logic
            const aiActive = isAIPlayingRef.current;
            let aiMove = 0;

            if (aiActive) {
              // Find closest threat
              let closestObstacle: any = null
              let minDist = 1000

              obstacles.forEach((obs: any) => {
                const dist = player.y - obs.y
                // dist is positive if player is below obstacle (normal)
                // We want obstacles ABOVE player, so obs.y < player.y.
                // Wait, player Y is 500. Obstacles start at -50 and go UP to 600+. 
                // So we want obstacles with Y < 500, but closest to 500.

                // Phaser coordinates: 0 is top. 600 is bottom.
                // Player is at 500.
                // Obstacles spawn at -50 (top) and move down (increment Y).
                // So we look for obstacles with Y < 500.

                const diff = player.y - obs.y // Positive means obstacle is above player
                if (diff > 0 && diff < minDist) {
                  minDist = diff
                  closestObstacle = obs
                }
              })

              if (closestObstacle && minDist < 250) { // React when obstacle is within 250px
                // Avoidance logic
                const dx = player.x - closestObstacle.x
                if (Math.abs(dx) < 80) { // If horizontally overlapping
                  // Too close! Move away
                  if (dx > 0) aiMove = 1 // Player is to the right of obstacle, move right
                  else aiMove = -1       // Player is to the left, move left
                } else {
                  // Safe from immediate threat.
                  // Simple centering behavior to avoid hugging walls
                  if (player.x < 300) aiMove = 0.3
                  else if (player.x > 500) aiMove = -0.3
                }
              } else {
                // No immediate threat, slightly drift to center
                if (player.x < 380) aiMove = 0.2
                else if (player.x > 420) aiMove = -0.2
              }
            }

            // Move player with tilt effect
            if ((cursors?.left.isDown || wasd?.A.isDown || aiMove < 0)) {
              player.x -= aiActive ? 4 : 6 // AI moves slightly smoother
              player.setAngle(-10)
              if (!aiActive) recordAction('move_left')
            } else if ((cursors?.right.isDown || wasd?.D.isDown || aiMove > 0)) {
              player.x += aiActive ? 4 : 6
              player.setAngle(10)
              if (!aiActive) recordAction('move_right')
            } else {
              player.setAngle(0)
            }
            player.x = Phaser.Math.Clamp(player.x, 100, 700)

            // Move obstacles
            obstacles.forEach((obstacle, index) => {
              obstacle.y += speed * 2

              // Check collision with player
              if (Phaser.Geom.Rectangle.Overlaps(
                player.getBounds(),
                obstacle.getBounds()
              )) {
                // Check if shield is active
                if (activePowerUp === 'shield') {
                  obstacle.destroy()
                  obstacles.splice(index, 1)
                  activePowerUp = null
                  setPowerUp(null)
                  gameAudioRef.current?.playSound('success')
                  toast.success('Shield blocked obstacle!')
                  return
                }

                // Game over
                scene.scene.pause()
                gameAudioRef.current?.playSound('error')
                gameAudioRef.current?.stopBackgroundMusic()
                // toast.error(`Game Over! Final Score: ${score} | Streak: ${streak}`)
                setIsPlaying(false)
                setIsGameOver(true)
              }

              // Remove if off screen
              if (obstacle.y > 650) {
                obstacle.destroy()
                obstacles.splice(index, 1)
              }
            })

            // Move coins
            coins.forEach((coin: any, index) => {
              coin.y += speed * 2
              if (coin.glow) coin.glow.y = coin.y

              // Check collision with player
              if (Phaser.Geom.Intersects.RectangleToRectangle(
                player.getBounds(),
                coin.getBounds()
              )) {
                if (coin.glow) coin.glow.destroy()
                coin.destroy()
                coins.splice(index, 1)
                updateScore(100)
                recordAction('collect')
                gameAudioRef.current?.playSound('coin')

                // Particle effect - simple circle particles
                for (let i = 0; i < 5; i++) {
                  const particle = scene.add.circle(coin.x, coin.y, 5, 0xffd700)
                  scene.tweens.add({
                    targets: particle,
                    x: coin.x + Phaser.Math.Between(-50, 50),
                    y: coin.y + Phaser.Math.Between(-50, 50),
                    alpha: 0,
                    scale: 0,
                    duration: 500,
                    onComplete: () => particle.destroy()
                  })
                }
              }

              // Remove if off screen
              if (coin.y > 650) {
                if (coin.glow) coin.glow.destroy()
                coin.destroy()
                coins.splice(index, 1)
                recordAction('avoid')
                combo = 0
                setCombo(0)
              }
            })

            // Move power-ups
            powerUps.forEach((powerUp, index) => {
              powerUp.y += speed

              // Check collision with player
              if (Phaser.Geom.Rectangle.Overlaps(
                player.getBounds(),
                powerUp.getBounds()
              )) {
                powerUp.destroy()
                powerUps.splice(index, 1)

                // Random power-up effect
                const powerUpType = Phaser.Math.Between(0, 2)
                if (powerUpType === 0) {
                  // Speed boost
                  speed = Math.max(2, speed - 0.5)
                  activePowerUp = 'speed'
                  gameAudioRef.current?.playSound('powerup')
                  toast.success('⚡ Speed Boost!', { duration: 1000 })
                } else if (powerUpType === 1) {
                  // Score multiplier
                  multiplier = Math.min(5, multiplier + 1)
                  activePowerUp = 'multiplier'
                  gameAudioRef.current?.playSound('powerup')
                  toast.success(`⭐ ${multiplier}x Multiplier!`, { duration: 1000 })
                } else {
                  // Shield
                  activePowerUp = 'shield'
                  gameAudioRef.current?.playSound('powerup')
                  toast.success('🛡️ Shield!', { duration: 1000 })
                }

                setPowerUp(activePowerUp)
                setMultiplier(multiplier)

                // Power-up expires after 10 seconds
                setTimeout(() => {
                  if (activePowerUp === 'speed') speed = 2
                  activePowerUp = null
                  setPowerUp(null)
                }, 10000)
              }

              // Remove if off screen
              if (powerUp.y > 650) {
                powerUp.destroy()
                powerUps.splice(index, 1)
              }
            })

            // Increase speed over time
            speed += 0.001

            // Level up every 500 points
            const newLevel = Math.floor(score / 500) + 1
            if (newLevel > lastLevelNotified) {
              lastLevelNotified = newLevel
              level = newLevel
              gameAudioRef.current?.playSound('levelup')
              toast.success(`🎉 LEVEL ${newLevel}!`, { duration: 2000 })
            }
          }

          setIsPlaying(true)
        }
      }
    }

    // Create Phaser game
    try {
      if (Phaser && gameRef.current) {
        phaserGameRef.current = new Phaser.Game(config)
        console.log('Phaser game created successfully')
      }
    } catch (error) {
      console.error('Failed to create Phaser game:', error)
    }

    // Cleanup on unmount
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

  const [currentTime, setCurrentTime] = useState<string>('')

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString())
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Music control effect
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

  const handleRestart = () => {
    // Reset all states
    setScore(0)
    setCombo(0)
    setMultiplier(1)
    setStreak(0)
    setPowerUp(null)
    setIsGameOver(false)
    setIsPlaying(false)
    setGameplayData([])

    // Also reset AI mode
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

  const handleStartTraining = async () => {
    if (gameplayData.length === 0) {
      toast.error('Play the game first to collect training data!')
      return
    }

    setIsTraining(true)
    toast.loading('Starting AI training...', { id: 'training' })

    try {
      // Direct simulation of backend call for now (since we removed backend)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const mockTrainingId = 'train_' + Date.now();

      toast.dismiss('training')
      toast.success('Training started! Redirecting to training page...')

      // Redirect to training page with training ID
      setTimeout(() => {
        window.location.href = `/training?id=${mockTrainingId}`
      }, 1000)
    } catch (error: any) {
      toast.dismiss('training')
      toast.error(error.message || 'Failed to start training')
      setIsTraining(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-[250px] w-full border-b border-[#1A1F3A] overflow-hidden group mb-8">
        <Image
          src="/images/racing-game-hero.png"
          alt="Cyber Race"
          fill
          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] to-transparent" />
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-7xl mx-auto px-6 w-full pb-8">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-arbitrum-cyan font-mono text-sm tracking-widest mb-2 block">ARCADE SIMULATION</span>
                <h1 className="text-5xl font-bold tracking-tight drop-shadow-2xl flex items-center gap-3">
                  CryptoRacer <span className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 font-extrabold italic">GT</span>
                </h1>
              </div>
              <Link href="/games">
                <button className="px-4 py-2 bg-[#0A0E27]/50 backdrop-blur-md border border-[#2A2F4A] hover:bg-[#1A1F3A] rounded-lg text-sm text-gray-300 transition-all">
                  Exit to Library [ESC]
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 pb-20">

        {/* Game Area Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Game & HUD */}
          <div className="lg:col-span-2 space-y-6">

            {/* HUD Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-[#0F1422]/90 backdrop-blur border border-[#1A1F3A] rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Score</span>
                <span className="text-2xl font-bold font-mono text-white">{score.toLocaleString()}</span>
              </div>
              <div className="bg-[#0F1422]/90 backdrop-blur border border-[#1A1F3A] rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Streak</span>
                <span className="text-2xl font-bold font-mono text-yellow-400 flex items-center gap-1">
                  <SparklesIcon className="w-4 h-4" /> {streak}
                </span>
              </div>
              <div className="bg-[#0F1422]/90 backdrop-blur border border-[#1A1F3A] rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Multiplier</span>
                <span className="text-2xl font-bold font-mono text-green-400">x{multiplier}</span>
              </div>
              <div className="bg-[#0F1422]/90 backdrop-blur border border-[#1A1F3A] rounded-xl p-3 flex flex-col items-center">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Combo</span>
                <span className="text-2xl font-bold font-mono text-purple-400">{combo}</span>
              </div>
            </div>

            {/* Game Frame */}
            <div className="relative rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-4 border-[#1A1F3A] bg-black">
              {/* Top Bar Decoration */}
              <div className="h-6 bg-[#1A1F3A] flex items-center px-4 justify-between border-b border-[#2A2F4A]">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500/50" />
                  <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                  <div className="w-2 h-2 rounded-full bg-green-500/50" />
                </div>
                <div className="text-[10px] font-mono text-gray-500">LIVE SESSION: {currentTime}</div>
              </div>

              {/* Canvas Container */}
              <div className="flex justify-center bg-[#050816]">
                <div ref={gameRef} className="shadow-2xl" />
              </div>

              {/* AI Active Indicator */}
              <AnimatePresence>
                {isAIPlaying && !isGameOver && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-10 w-full flex justify-center pointer-events-none"
                  >
                    <div className="bg-purple-600/80 backdrop-blur border border-purple-400 text-white px-6 py-2 rounded-full font-bold font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.5)]">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                      AI AUTOPILOT ENGAGED
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Game Over Overlay */}
              <AnimatePresence>
                {isGameOver && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="bg-[#0F1422] rounded-3xl border border-[#2A2F4A] p-10 text-center max-w-md w-full shadow-2xl relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-[50px]" />

                      <h2 className="text-4xl font-bold text-white mb-2 italic">GAME OVER</h2>
                      <div className="w-16 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent mx-auto mb-6" />

                      <div className="space-y-4 mb-8">
                        <div className="flex justify-between items-center bg-[#1A1F3A] p-4 rounded-xl">
                          <span className="text-gray-400">Final Score</span>
                          <span className="text-2xl font-bold text-white">{score.toLocaleString()}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#1A1F3A] p-3 rounded-xl">
                            <div className="text-xs text-gray-500 uppercase">Streak</div>
                            <div className="text-lg font-bold text-yellow-400">{streak}</div>
                          </div>
                          <div className="bg-[#1A1F3A] p-3 rounded-xl">
                            <div className="text-xs text-gray-500 uppercase">Best Combo</div>
                            <div className="text-lg font-bold text-purple-400">{combo}</div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={handleRestart}
                        className="w-full py-4 bg-white text-[#0A0E27] font-bold rounded-xl hover:bg-gray-200 hover:scale-[1.02] transition-all shadow-lg"
                      >
                        Play Again
                      </button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls Hint */}
            <div className="flex justify-between items-center text-sm text-gray-500 bg-[#1A1F3A]/30 p-3 rounded-lg border border-[#2A2F4A]/50">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1"><span className="px-1.5 py-0.5 border border-gray-600 rounded bg-[#1A1F3A]">←</span><span className="px-1.5 py-0.5 border border-gray-600 rounded bg-[#1A1F3A]">→</span> Move</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Music Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={musicVolume}
                  onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                  className="w-24 h-1 bg-[#2A2F4A] rounded-lg appearance-none cursor-pointer accent-arbitrum-cyan"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Training Telemetry */}
          <div className="space-y-6">

            {/* Context Card */}
            <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/20 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <ZapIcon className="w-24 h-24 rotate-12" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                AI Context
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-sm mb-4">
                This simulation trains decision-making for high-frequency trading.
                <br /><br />
                <strong className="text-white">Obstacles</strong> = Market Crushes<br />
                <strong className="text-white">Coins</strong> = Profit Opportunities<br />
                <strong className="text-white">Movement</strong> = Position Adjustments
              </p>
              <div className="flex gap-2 text-xs">
                <span className="px-2 py-1 bg-[#0A0E27]/50 rounded text-indigo-300 border border-indigo-500/30">Reinforcement Learning</span>
                <span className="px-2 py-1 bg-[#0A0E27]/50 rounded text-indigo-300 border border-indigo-500/30">Stylus Compatible</span>
              </div>
            </div>

            {/* Telemetry Log */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] flex flex-col h-[400px]">
              <div className="p-4 border-b border-[#1A1F3A] flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                  Data Telemetry
                  <span className="text-xs font-normal text-gray-500 bg-[#1A1F3A] px-2 py-0.5 rounded-full">{gameplayData.length} pts</span>
                </h3>
                {isTraining ? (
                  <div className="text-xs text-green-400 animate-pulse">UPLOADING...</div>
                ) : (
                  <div className="text-xs text-yellow-500">BUFFERING</div>
                )}
              </div>

              <div className="flex-1 p-4 overflow-y-auto font-mono text-xs space-y-1 custom-scrollbar bg-[#0A0E27] m-2 rounded-lg border border-[#1A1F3A] inner-shadow">
                {gameplayData.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-600">
                    <div className="mb-2 opacity-50"><CheckCircleIcon className="w-8 h-8" /></div>
                    <p>Waiting for input...</p>
                  </div>
                ) : (
                  [...gameplayData].reverse().map((data: any, i) => (
                    <div key={i} className="flex gap-2 text-gray-400 border-l-2 border-transparent hover:border-arbitrum-cyan pl-2">
                      <span className="text-gray-600">{new Date(data.timestamp).toLocaleTimeString().split(' ')[0]}</span>
                      <span className={
                        data.action === 'collect' ? 'text-yellow-400' :
                          data.action === 'avoid' ? 'text-red-400' : 'text-blue-400'
                      }>
                        {data.action.toUpperCase()}
                      </span>
                      <span className="text-gray-600">pos:{Math.round(data.gameState.position)}</span>
                    </div>
                  ))
                )}
              </div>

              <div className="p-4 border-t border-[#1A1F3A] space-y-3">
                {/* AI Autopilot Toggle */}
                <button
                  onClick={() => setIsAIPlaying(!isAIPlaying)}
                  disabled={!isPlaying}
                  className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${isAIPlaying
                      ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-pulse'
                      : 'bg-[#1A1F3A] text-gray-400 hover:bg-[#252B45] border border-[#2A2F4A]'
                    }`}
                >
                  {isAIPlaying ? (
                    <>
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      AI DRIVING...
                    </>
                  ) : (
                    <>
                      <span>🤖</span>
                      Watch AI Play
                    </>
                  )}
                </button>

                <button
                  onClick={handleStartTraining}
                  disabled={gameplayData.length === 0 || isTraining}
                  className="w-full py-3 bg-gradient-to-r from-arbitrum-cyan to-blue-600 text-[#0A0E27] font-bold rounded-xl hover:shadow-[0_0_20px_rgba(0,217,255,0.3)] disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center gap-2"
                >
                  {isTraining ? (
                    <>
                      <div className="w-4 h-4 border-2 border-[#0A0E27] border-t-transparent rounded-full animate-spin" />
                      Training Neural Net...
                    </>
                  ) : (
                    <>
                      <ZapIcon className="w-5 h-5" />
                      Train Agent Now
                    </>
                  )}
                </button>
                {gameplayData.length > 0 && !isTraining && (
                  <p className="text-[10px] text-center text-gray-500 mt-2">
                    Ready to export {gameplayData.length} data points to Stylus VM
                  </p>
                )}
              </div>
            </div>

          </div>

        </div>

      </main>
    </div>
  )
}
