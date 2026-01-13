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

  const handleRestart = () => {
    // Reset all states
    setScore(0)
    setResources(100)
    setProduction(10)
    setEfficiency(1.0)
    setLevel(1)
    setGameplayData([])
    
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
        create: function() {
          const scene = this as Phaser.Scene
          
          const background = scene.add.rectangle(400, 300, 800, 600, 0x1A1F3A)
          
          let gameData: GameplayData[] = []
          let currentResources = 100
          let currentProduction = 10
          let currentScore = 0
          let currentEfficiency = 1.0
          let currentLevel = 1
          let upgradeCount = 0
          let lastLevelNotified = 0 // Prevent spam notifications
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
              target: 500,
              challenge: 'Reach 500 resources'
            },
            {
              name: 'Expansion Phase',
              description: 'Growing business. Balance production and upgrades.',
              initialResources: 200,
              initialProduction: 15,
              target: 1000,
              challenge: 'Reach 1000 resources'
            },
            {
              name: 'Efficiency Challenge',
              description: 'Maximize efficiency. Optimize is key.',
              initialResources: 150,
              initialProduction: 10,
              target: 2000,
              challenge: 'Reach 2000 resources with 150%+ efficiency'
            },
            {
              name: 'Crisis Management',
              description: 'Resources are low. Recover quickly!',
              initialResources: 30,
              initialProduction: 3,
              target: 800,
              challenge: 'Recover to 800 resources'
            },
            {
              name: 'Optimization Master',
              description: 'Maximize all metrics. Full optimization needed.',
              initialResources: 100,
              initialProduction: 10,
              target: 3000,
              challenge: 'Reach 3000 resources with max efficiency'
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
          const caseNameText = scene.add.text(400, 50, `Case: ${cases[currentCase].name}`, {
            fontSize: '22px',
            color: '#ffd700',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          
          const caseDescText = scene.add.text(400, 80, cases[currentCase].description, {
            fontSize: '16px',
            color: '#cccccc',
            fontFamily: 'monospace'
          }).setOrigin(0.5)
          
          const caseProgressText = scene.add.text(400, 110, `Progress: ${caseProgress}/${caseTarget}`, {
            fontSize: '18px',
            color: '#00ff00',
            fontFamily: 'monospace'
          }).setOrigin(0.5)
          
          // Progress bar for case
          const caseProgressBarBg = scene.add.rectangle(400, 140, 400, 15, 0x2A2F4A)
          const caseProgressBar = scene.add.rectangle(200, 140, 0, 15, 0x00ff00)
          caseProgressBar.setOrigin(0, 0.5)
          
          // Resource bar visualization
          const resourceBarBg = scene.add.rectangle(400, 200, 400, 30, 0x2A2F4A)
          const resourceBar = scene.add.rectangle(200, 200, 0, 30, 0x00D9FF)
          resourceBar.setOrigin(0, 0.5)
          
          // Production indicator
          const productionIndicator = scene.add.text(400, 250, 'Production: 10/s', {
            fontSize: '20px',
            color: '#00ff00',
            fontFamily: 'monospace'
          }).setOrigin(0.5)
          
          // Efficiency indicator
          const efficiencyIndicator = scene.add.text(400, 300, 'Efficiency: 100%', {
            fontSize: '20px',
            color: '#ffd700',
            fontFamily: 'monospace'
          }).setOrigin(0.5)
          
          // Buttons with animations
          const produceButton = scene.add.rectangle(200, 500, 150, 50, 0x00D9FF)
          const produceText = scene.add.text(200, 500, 'PRODUCE', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          produceButton.setInteractive({ useHandCursor: true })
          produceButton.on('pointerover', () => {
            scene.tweens.add({ targets: produceButton, scaleX: 1.1, scaleY: 1.1, duration: 100 })
          })
          produceButton.on('pointerout', () => {
            scene.tweens.add({ targets: produceButton, scaleX: 1, scaleY: 1, duration: 100 })
          })
          
          const upgradeButton = scene.add.rectangle(400, 500, 150, 50, 0xffd700)
          const upgradeText = scene.add.text(400, 500, 'UPGRADE', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          upgradeButton.setInteractive({ useHandCursor: true })
          upgradeButton.on('pointerover', () => {
            scene.tweens.add({ targets: upgradeButton, scaleX: 1.1, scaleY: 1.1, duration: 100 })
          })
          upgradeButton.on('pointerout', () => {
            scene.tweens.add({ targets: upgradeButton, scaleX: 1, scaleY: 1, duration: 100 })
          })
          
          const optimizeButton = scene.add.rectangle(600, 500, 150, 50, 0x00ff00)
          const optimizeText = scene.add.text(600, 500, 'OPTIMIZE', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          optimizeButton.setInteractive({ useHandCursor: true })
          optimizeButton.on('pointerover', () => {
            scene.tweens.add({ targets: optimizeButton, scaleX: 1.1, scaleY: 1.1, duration: 100 })
          })
          optimizeButton.on('pointerout', () => {
            scene.tweens.add({ targets: optimizeButton, scaleX: 1, scaleY: 1, duration: 100 })
          })
          
          // Particle effects
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
          
          produceButton.on('pointerdown', () => {
            // Button animation
            scene.tweens.add({
              targets: produceButton,
              scaleX: 0.9,
              scaleY: 0.9,
              duration: 100,
              yoyo: true
            })
            
            const produced = Math.floor(currentProduction * currentEfficiency)
            currentResources += produced
            currentScore += produced
            
            // Particle effect
            createParticleEffect(200, 500, 0x00D9FF, 15)
            
            // Resource number animation
            const resourceText = scene.add.text(400, 200, `+${produced}`, {
              fontSize: '24px',
              color: '#00D9FF',
              fontFamily: 'monospace',
              fontStyle: 'bold'
            }).setOrigin(0.5)
            scene.tweens.add({
              targets: resourceText,
              y: 150,
              alpha: 0,
              duration: 1000,
              onComplete: () => resourceText.destroy()
            })
            
            recordAction('produce')
            gameAudioRef.current?.playSound('coin')
            updateUI()
            toast.success(`⚡ +${produced} resources!`, { duration: 500 })
          })
          
          upgradeButton.on('pointerdown', () => {
            // Button animation
            scene.tweens.add({
              targets: upgradeButton,
              scaleX: 0.9,
              scaleY: 0.9,
              duration: 100,
              yoyo: true
            })
            
            if (currentResources >= 50) {
              currentResources -= 50
              currentProduction += 5
              upgradeCount++
              
              // Upgrade particle effect
              createParticleEffect(400, 500, 0xffd700, 20)
              
              // Production upgrade animation
              const upgradeText = scene.add.text(400, 250, 'Production +5!', {
                fontSize: '24px',
                color: '#ffd700',
                fontFamily: 'monospace',
                fontStyle: 'bold'
              }).setOrigin(0.5)
              scene.tweens.add({
                targets: upgradeText,
                scale: 1.5,
                alpha: 0,
                duration: 1000,
                onComplete: () => upgradeText.destroy()
              })
              
              recordAction('upgrade')
              gameAudioRef.current?.playSound('powerup')
              updateUI()
              
              // Level up every 3 upgrades
              if (upgradeCount % 3 === 0) {
                const newLevel = currentLevel + 1
                if (newLevel > lastLevelNotified) {
                  lastLevelNotified = newLevel
                  currentLevel = newLevel
                  setLevel(currentLevel)
                  
                  // Level up celebration
                  for (let i = 0; i < 16; i++) {
                    const particle = scene.add.circle(400, 300, 5, 0xffd700)
                    const angle = (i / 16) * Math.PI * 2
                    scene.tweens.add({
                      targets: particle,
                      x: 400 + Math.cos(angle) * 150,
                      y: 300 + Math.sin(angle) * 150,
                      alpha: 0,
                      scale: 0,
                      duration: 1000,
                      onComplete: () => particle.destroy()
                    })
                  }
                  
                  gameAudioRef.current?.playSound('levelup')
                  toast.success(`🎉 Level ${currentLevel}! Production +5`, { duration: 2000 })
                }
              } else {
                toast.success('⚙️ Production upgraded!', { duration: 1000 })
              }
            } else {
              // Shake effect
              scene.tweens.add({
                targets: upgradeButton,
                x: 395,
                duration: 50,
                yoyo: true,
                repeat: 2
              })
              gameAudioRef.current?.playSound('error')
              toast.error('Not enough resources!')
            }
          })
          
          optimizeButton.on('pointerdown', () => {
            if (currentResources >= 30) {
              currentResources -= 30
              currentEfficiency = Math.min(2.0, currentEfficiency + 0.1)
              currentProduction = Math.floor(currentProduction * 1.1)
              recordAction('optimize')
              gameAudioRef.current?.playSound('powerup')
              setEfficiency(currentEfficiency)
              updateUI()
              toast.success(`✨ Efficiency: ${(currentEfficiency * 100).toFixed(0)}%!`, { duration: 1000 })
            } else {
              gameAudioRef.current?.playSound('error')
              toast.error('Not enough resources!')
            }
          })
          
          const updateUI = () => {
            scoreText.setText(`Score: ${currentScore} | Resources: ${currentResources} | Production: ${Math.floor(currentProduction * currentEfficiency)}/s | Efficiency: ${(currentEfficiency * 100).toFixed(0)}%`)
            
            // Update resource bar with animation
            const barWidth = Math.min(400, (currentResources / 200) * 400)
            scene.tweens.add({
              targets: resourceBar,
              width: barWidth,
              duration: 300,
              ease: 'Power2'
            })
            
            // Update production indicator
            productionIndicator.setText(`Production: ${Math.floor(currentProduction * currentEfficiency)}/s`)
            
            // Update efficiency indicator
            efficiencyIndicator.setText(`Efficiency: ${(currentEfficiency * 100).toFixed(0)}%`)
            
            // Update case progress
            caseProgress = currentResources
            const progressPercent = Math.min(100, (caseProgress / caseTarget) * 100)
            caseProgressText.setText(`Progress: ${caseProgress}/${caseTarget} (${progressPercent.toFixed(0)}%)`)
            
            // Update case progress bar
            const progressBarWidth = (progressPercent / 100) * 400
            scene.tweens.add({
              targets: caseProgressBar,
              width: progressBarWidth,
              duration: 300,
              ease: 'Power2'
            })
            
            // Check if case complete
            if (caseProgress >= caseTarget) {
              // Case complete - move to next case
              currentCase = (currentCase + 1) % cases.length
              caseTarget = cases[currentCase].target
              caseProgress = 0
              
              // Reset with new case values
              currentResources = cases[currentCase].initialResources
              currentProduction = cases[currentCase].initialProduction
              
              // Update case display with animation
              scene.tweens.add({
                targets: [caseNameText, caseDescText, caseProgressText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  caseNameText.setText(`Case: ${cases[currentCase].name}`)
                  caseDescText.setText(cases[currentCase].description)
                  caseProgressText.setText(`Progress: ${caseProgress}/${caseTarget}`)
                  
                  scene.tweens.add({
                    targets: [caseNameText, caseDescText, caseProgressText],
                    alpha: 1,
                    duration: 300
                  })
                }
              })
              
              // Reset progress bar
              scene.tweens.add({
                targets: caseProgressBar,
                width: 0,
                duration: 300
              })
              
              gameAudioRef.current?.playSound('levelup')
              toast.success(`✅ Case Complete! New Case: ${cases[currentCase].name}`, { duration: 2000 })
              
              // Update UI with new values
              updateUI()
              return
            }
            
            setScore(currentScore)
            setResources(currentResources)
            setProduction(Math.floor(currentProduction * currentEfficiency))
          }
          
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
  
  // Music control
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

  const handleStartTraining = async () => {
    if (gameplayData.length === 0) {
      toast.error('Play the game first to collect training data!')
      return
    }

    setIsTraining(true)
    toast.loading('Starting AI training...', { id: 'training' })

    try {
      const playResponse = await fetch('http://localhost:8000/games/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameType: 'resource',
          gameplayData 
        })
      })

      if (!playResponse.ok) throw new Error('Failed to record gameplay data')

      const trainResponse = await fetch('http://localhost:8000/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameType: 'resource',
          gameplayData 
        })
      })

      if (!trainResponse.ok) throw new Error('Failed to start training')

      const data = await trainResponse.json()
      
      toast.dismiss('training')
      toast.success('Training started! Redirecting...')
      
      setTimeout(() => {
        window.location.href = `/training?id=${data.trainingId}`
      }, 1000)
    } catch (error: any) {
      toast.dismiss('training')
      toast.error(error.message || 'Failed to start training')
      setIsTraining(false)
    }
  }

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
        
        {/* Music Controls */}
        <div className="mb-6 flex justify-end">
          <div className="flex items-center gap-2 bg-[#1A1F3A] rounded-lg px-3 py-2 border border-[#2A2F4A]">
            <button
              onClick={() => {
                setIsMusicPlaying(!isMusicPlaying)
                if (gameAudioRef.current) {
                  if (isMusicPlaying) {
                    gameAudioRef.current.stopBackgroundMusic()
                  } else {
                    gameAudioRef.current.startBackgroundMusic(musicVolume)
                  }
                }
              }}
              className="text-gray-300 hover:text-white transition-colors"
            >
              {isMusicPlaying ? '🔊' : '🔇'}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={musicVolume}
              onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
              className="w-20 h-1 bg-[#2A2F4A] rounded-lg appearance-none cursor-pointer accent-indigo-500"
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-2xl border border-indigo-500/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">AI Training in Progress</h3>
              <p className="text-gray-300 mb-3">
                Every resource management decision teaches the AI optimization strategies. 
                The AI learns:
              </p>
              <ul className="text-gray-300 space-y-1 ml-4 list-disc">
                <li><strong>Resource Optimization:</strong> When to produce vs upgrade</li>
                <li><strong>Supply Chain:</strong> Balancing production and consumption</li>
                <li><strong>Efficiency:</strong> Maximizing output with minimal input</li>
              </ul>
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
              <div className="text-sm text-gray-400">
                Click buttons to manage resources
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
            <div ref={gameRef} className="rounded-lg overflow-hidden border-2 border-[#1A1F3A]" />
          </div>
        </div>

        <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
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

