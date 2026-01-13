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

  const handleRestart = () => {
    // Reset all states
    setScore(0)
    setStrategy(0)
    setLevel(1)
    setPredictionAccuracy(0)
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
          let currentStrategy = 0
          let currentScore = 0
          let currentLevel = 1
          let lastLevelNotified = 0 // Prevent spam notifications
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
          
          const caseScoreText = scene.add.text(400, 110, `Case Score: ${caseScore}`, {
            fontSize: '18px',
            color: '#00ff00',
            fontFamily: 'monospace'
          }).setOrigin(0.5)
          
          // Strategy options with visual indicators
          const strategies = ['Aggressive', 'Balanced', 'Defensive']
          const strategyColors = [0xff0000, 0x00D9FF, 0x00ff00]
          let selectedStrategy = 0
          
          // Strategy visualization circle (outer and inner for stroke effect)
          const strategyCircleOuter = scene.add.circle(400, 150, 55, strategyColors[selectedStrategy], 0.2)
          const strategyCircle = scene.add.circle(400, 150, 50, strategyColors[selectedStrategy], 0.3)
          
          const strategyText = scene.add.text(400, 150, strategies[selectedStrategy], {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          
          // Prediction meter
          const predictionMeterBg = scene.add.rectangle(400, 250, 300, 20, 0x2A2F4A)
          const predictionMeter = scene.add.rectangle(250, 250, 0, 20, 0xffd700)
          predictionMeter.setOrigin(0, 0.5)
          
          const predictionText = scene.add.text(400, 280, 'Prediction Accuracy: 0%', {
            fontSize: '16px',
            color: '#ffd700',
            fontFamily: 'monospace'
          }).setOrigin(0.5)
          
          // Buttons with animations
          const planButton = scene.add.rectangle(200, 400, 150, 50, 0x00D9FF)
          const planText = scene.add.text(200, 400, 'PLAN', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          planButton.setInteractive({ useHandCursor: true })
          planButton.on('pointerover', () => {
            scene.tweens.add({ targets: planButton, scaleX: 1.1, scaleY: 1.1, duration: 100 })
          })
          planButton.on('pointerout', () => {
            scene.tweens.add({ targets: planButton, scaleX: 1, scaleY: 1, duration: 100 })
          })
          
          const executeButton = scene.add.rectangle(400, 400, 150, 50, 0x00ff00)
          const executeText = scene.add.text(400, 400, 'EXECUTE', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          executeButton.setInteractive({ useHandCursor: true })
          executeButton.on('pointerover', () => {
            scene.tweens.add({ targets: executeButton, scaleX: 1.1, scaleY: 1.1, duration: 100 })
          })
          executeButton.on('pointerout', () => {
            scene.tweens.add({ targets: executeButton, scaleX: 1, scaleY: 1, duration: 100 })
          })
          
          const predictButton = scene.add.rectangle(600, 400, 150, 50, 0xffd700)
          const predictText = scene.add.text(600, 400, 'PREDICT', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          predictButton.setInteractive({ useHandCursor: true })
          predictButton.on('pointerover', () => {
            scene.tweens.add({ targets: predictButton, scaleX: 1.1, scaleY: 1.1, duration: 100 })
          })
          predictButton.on('pointerout', () => {
            scene.tweens.add({ targets: predictButton, scaleX: 1, scaleY: 1, duration: 100 })
          })
          
          // Particle effects
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
          
          planButton.on('pointerdown', () => {
            // Button animation
            scene.tweens.add({
              targets: planButton,
              scaleX: 0.9,
              scaleY: 0.9,
              duration: 100,
              yoyo: true
            })
            
            selectedStrategy = (selectedStrategy + 1) % strategies.length
            
            // Animate strategy circle change
            scene.tweens.add({
              targets: [strategyCircle, strategyCircleOuter],
              scaleX: 1.2,
              scaleY: 1.2,
              duration: 200,
              yoyo: true,
              onComplete: () => {
                strategyCircle.setFillStyle(strategyColors[selectedStrategy], 0.3)
                strategyCircleOuter.setFillStyle(strategyColors[selectedStrategy], 0.2)
              }
            })
            
            strategyText.setText(strategies[selectedStrategy])
            
            // Particle effect
            createParticleEffect(400, 150, strategyColors[selectedStrategy], 12)
            
            recordAction('plan')
            setStrategy(selectedStrategy)
            toast.info(`Strategy: ${strategies[selectedStrategy]}`)
          })
          
          let correctPredictions = 0
          let totalPredictions = 0
          
          executeButton.on('pointerdown', () => {
            // Button animation
            scene.tweens.add({
              targets: executeButton,
              scaleX: 0.9,
              scaleY: 0.9,
              duration: 100,
              yoyo: true
            })
            
            const basePoints = [50, 75, 100][selectedStrategy]
            const bonus = currentLevel * 10
            
            // Case bonus - if using optimal strategy
            let caseBonus = 1.0
            if (selectedStrategy === cases[currentCase].optimalStrategy) {
              caseBonus = cases[currentCase].bonus
              toast.success(`🎯 Optimal strategy! ${(caseBonus * 100).toFixed(0)}% bonus!`, { duration: 1500 })
            }
            
            const points = Math.floor((basePoints + bonus) * caseBonus)
            currentScore += points
            caseScore += points
            currentStrategy++
            
            // Update case score
            caseScoreText.setText(`Case Score: ${caseScore}`)
            
            // Check if case complete (reach target score)
            const caseTarget = cases[currentCase].difficulty * 500
            if (caseScore >= caseTarget) {
              // Case complete - move to next case
              currentCase = (currentCase + 1) % cases.length
              caseScore = 0
              
              // Update case display with animation
              scene.tweens.add({
                targets: [caseNameText, caseDescText, caseScoreText],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                  caseNameText.setText(`Case: ${cases[currentCase].name}`)
                  caseDescText.setText(cases[currentCase].description)
                  caseScoreText.setText(`Case Score: ${caseScore}`)
                  
                  scene.tweens.add({
                    targets: [caseNameText, caseDescText, caseScoreText],
                    alpha: 1,
                    duration: 300
                  })
                }
              })
              
              gameAudioRef.current?.playSound('levelup')
              toast.success(`✅ Case Complete! New Case: ${cases[currentCase].name}`, { duration: 2000 })
            }
            
            // Execution particle effect
            createParticleEffect(400, 400, 0x00ff00, 20)
            
            // Points indicator
            const pointsText = scene.add.text(400, 350, `+${points}`, {
              fontSize: '28px',
              color: '#00ff00',
              fontFamily: 'monospace',
              fontStyle: 'bold'
            }).setOrigin(0.5)
            scene.tweens.add({
              targets: pointsText,
              y: 300,
              scale: 1.3,
              alpha: 0,
              duration: 1200,
              onComplete: () => pointsText.destroy()
            })
            
            recordAction('execute')
            gameAudioRef.current?.playSound('success')
            updateUI()
            toast.success(`⚔️ +${points} points!`, { duration: 1000 })
            
            if (currentScore >= currentLevel * 200) {
              const newLevel = currentLevel + 1
              if (newLevel > lastLevelNotified) {
                lastLevelNotified = newLevel
                currentLevel = newLevel
                setLevel(currentLevel)
                
                // Level up celebration
                for (let i = 0; i < 20; i++) {
                  const particle = scene.add.circle(400, 300, 5, 0x00ff00)
                  const angle = (i / 20) * Math.PI * 2
                  scene.tweens.add({
                    targets: particle,
                    x: 400 + Math.cos(angle) * 200,
                    y: 300 + Math.sin(angle) * 200,
                    alpha: 0,
                    scale: 0,
                    duration: 1000,
                    onComplete: () => particle.destroy()
                  })
                }
                
                gameAudioRef.current?.playSound('levelup')
                toast.success(`🎉 Level ${currentLevel}!`, { duration: 2000 })
              }
            }
          })
          
          predictButton.on('pointerdown', () => {
            // Button animation
            scene.tweens.add({
              targets: predictButton,
              scaleX: 0.9,
              scaleY: 0.9,
              duration: 100,
              yoyo: true
            })
            
            totalPredictions++
            const prediction = Math.random() * 100
            const threshold = 50 + (currentLevel * 5) // Gets harder
            
            // Prediction animation
            const predictionValue = scene.add.text(400, 250, `${prediction.toFixed(0)}%`, {
              fontSize: '32px',
              color: '#ffd700',
              fontFamily: 'monospace',
              fontStyle: 'bold'
            }).setOrigin(0.5)
            
            scene.tweens.add({
              targets: predictionValue,
              scale: 1.5,
              alpha: 0,
              duration: 800,
              onComplete: () => predictionValue.destroy()
            })
            
            if (prediction > threshold) {
              // Correct prediction
              correctPredictions++
              const accuracy = (correctPredictions / totalPredictions) * 100
              setPredictionAccuracy(accuracy)
              currentScore += 30 + (currentLevel * 5)
              
              // Success particles
              createParticleEffect(600, 400, 0xffd700, 20)
              
              // Success indicator
              const successText = scene.add.text(400, 250, '✓ CORRECT', {
                fontSize: '24px',
                color: '#00ff00',
                fontFamily: 'monospace',
                fontStyle: 'bold'
              }).setOrigin(0.5)
              scene.tweens.add({
                targets: successText,
                y: 200,
                alpha: 0,
                duration: 1000,
                onComplete: () => successText.destroy()
              })
              
              recordAction('predict')
              gameAudioRef.current?.playSound('success')
              updateUI()
              toast.success(`🎯 Prediction correct! +${30 + (currentLevel * 5)}`, { duration: 1000 })
            } else {
              // Wrong prediction
              recordAction('predict')
              gameAudioRef.current?.playSound('error')
              const accuracy = (correctPredictions / totalPredictions) * 100
              setPredictionAccuracy(accuracy)
              
              // Error indicator
              const errorText = scene.add.text(400, 250, '✗ WRONG', {
                fontSize: '24px',
                color: '#ff0000',
                fontFamily: 'monospace',
                fontStyle: 'bold'
              }).setOrigin(0.5)
              scene.tweens.add({
                targets: errorText,
                y: 200,
                alpha: 0,
                duration: 1000,
                onComplete: () => errorText.destroy()
              })
              
              // Shake effect
              scene.tweens.add({
                targets: predictButton,
                x: 595,
                duration: 50,
                yoyo: true,
                repeat: 2
              })
              
              toast.error('❌ Prediction wrong!')
            }
          })
          
          const updateUI = () => {
            scoreText.setText(`Score: ${currentScore} | Strategy: ${currentStrategy} | Level: ${currentLevel}`)
            
            // Update prediction meter
            const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0
            const meterWidth = (accuracy / 100) * 300
            scene.tweens.add({
              targets: predictionMeter,
              width: meterWidth,
              duration: 300,
              ease: 'Power2'
            })
            
            predictionText.setText(`Prediction Accuracy: ${accuracy.toFixed(0)}%`)
            
            setScore(currentScore)
          }
          
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
          gameType: 'strategy',
          gameplayData 
        })
      })

      if (!playResponse.ok) throw new Error('Failed to record gameplay data')

      const trainResponse = await fetch('http://localhost:8000/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameType: 'strategy',
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
              <h1 className="text-4xl font-bold text-white mb-2">StrategyMaster</h1>
              <p className="text-gray-400">Plan, execute, predict. Train your Strategy Agent!</p>
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
              className="w-20 h-1 bg-[#2A2F4A] rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-2xl border border-red-500/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">AI Training in Progress</h3>
              <p className="text-gray-300 mb-3">
                Every strategic decision teaches the AI complex multi-step planning. 
                The AI learns:
              </p>
              <ul className="text-gray-300 space-y-1 ml-4 list-disc">
                <li><strong>Strategic Planning:</strong> Long-term thinking and multi-step planning</li>
                <li><strong>Prediction:</strong> Forecasting outcomes and making informed decisions</li>
                <li><strong>Multi-Step Decisions:</strong> Complex decision trees and optimization</li>
              </ul>
              <p className="text-red-400 font-semibold mt-3">
                → Deploy as: <span className="text-white">Strategy Agent</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Strategy Game</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Click buttons to plan, execute, and predict
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
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2"
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

