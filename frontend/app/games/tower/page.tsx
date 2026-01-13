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
  action: 'build' | 'upgrade' | 'defend' | 'position'
  gameState: {
    towers: number
    resources: number
    enemies: number
    score: number
    wave: number
  }
}

export default function TowerGamePage() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<Phaser.Game | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [score, setScore] = useState(0)
  const [towers, setTowers] = useState(0)
  const [resources, setResources] = useState(500)
  const [wave, setWave] = useState(1)
  const [gameplayData, setGameplayData] = useState<GameplayData[]>([])
  const [isTraining, setIsTraining] = useState(false)
  const [isMusicPlaying, setIsMusicPlaying] = useState(true)
  const [musicVolume, setMusicVolume] = useState(0.5)
  const [towerLevel, setTowerLevel] = useState(1)
  const gameAudioRef = useRef<any>(null)

  const handleRestart = () => {
    // Reset all states
    setScore(0)
    setTowers(0)
    setResources(500)
    setWave(1)
    setTowerLevel(1)
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
          
          // Path for enemies
          const path = scene.add.rectangle(400, 300, 600, 50, 0x2A2F4A)
          
          let gameData: GameplayData[] = []
          let currentTowers = 0
          let currentResources = 500
          let currentScore = 0
          let currentWave = 1
          let enemiesKilled = 0
          let lastWaveNotified = 0 // Prevent spam notifications
          
          const towersList: Phaser.GameObjects.Rectangle[] = []
          const enemiesList: Phaser.GameObjects.Rectangle[] = []
          
          const scoreText = scene.add.text(20, 20, 'Score: 0 | Resources: 500 | Wave: 1', {
            fontSize: '20px',
            color: '#ffffff',
            fontFamily: 'monospace'
          })
          
          const buildButton = scene.add.rectangle(200, 550, 120, 50, 0x00D9FF)
          scene.add.text(200, 550, 'BUILD', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          buildButton.setInteractive()
          
          const upgradeButton = scene.add.rectangle(400, 550, 120, 50, 0xffd700)
          scene.add.text(400, 550, 'UPGRADE', {
            fontSize: '18px',
            color: '#000000',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          upgradeButton.setInteractive()
          
          const defendButton = scene.add.rectangle(600, 550, 120, 50, 0xff0000)
          scene.add.text(600, 550, 'DEFEND', {
            fontSize: '18px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontStyle: 'bold'
          }).setOrigin(0.5)
          defendButton.setInteractive()
          
          const recordAction = (action: GameplayData['action']) => {
            const data: GameplayData = {
              timestamp: Date.now(),
              action,
              gameState: {
                towers: currentTowers,
                resources: currentResources,
                enemies: enemiesList.length,
                score: currentScore,
                wave: currentWave
              }
            }
            gameData.push(data)
            setGameplayData([...gameData])
          }
          
          let towerLevels: { [key: number]: number } = {}
          
          buildButton.on('pointerdown', () => {
            if (currentResources >= 100) {
              currentResources -= 100
              currentTowers++
              const tower = scene.add.rectangle(
                Phaser.Math.Between(100, 700),
                Phaser.Math.Between(100, 500),
                30, 30, 0x00D9FF
              )
              const towerIndex = towersList.length
              towersList.push(tower)
              towerLevels[towerIndex] = 1
              recordAction('build')
              gameAudioRef.current?.playSound('success')
              updateUI()
              toast.success('🏗️ Tower built!', { duration: 500 })
            } else {
              gameAudioRef.current?.playSound('error')
              toast.error('Not enough resources!')
            }
          })
          
          upgradeButton.on('pointerdown', () => {
            if (currentTowers > 0 && currentResources >= 50) {
              currentResources -= 50
              // Upgrade random tower
              const randomTower = Phaser.Math.Between(0, towersList.length - 1)
              if (towerLevels[randomTower]) {
                towerLevels[randomTower]++
                towersList[randomTower].setFillStyle(0x00ff00) // Green for upgraded
              }
              recordAction('upgrade')
              gameAudioRef.current?.playSound('powerup')
              updateUI()
              toast.success('⚙️ Tower upgraded!', { duration: 1000 })
            } else {
              gameAudioRef.current?.playSound('error')
              toast.error('No towers or not enough resources!')
            }
          })
          
          defendButton.on('pointerdown', () => {
            recordAction('defend')
            // Spawn enemy
            const enemy = scene.add.rectangle(50, 300, 20, 20, 0xff0000)
            enemiesList.push(enemy)
            
            // Move enemy
            scene.tweens.add({
              targets: enemy,
              x: 750,
              duration: 3000,
              onComplete: () => {
                enemiesList.splice(enemiesList.indexOf(enemy), 1)
                enemy.destroy()
                currentScore -= 10
                updateUI()
              }
            })
            
            // Check collision with towers
            scene.time.addEvent({
              delay: 100,
              callback: () => {
                enemiesList.forEach((enemy, idx) => {
                  towersList.forEach((tower) => {
                    if (Phaser.Geom.Rectangle.Overlaps(
                      enemy.getBounds(),
                      tower.getBounds()
                    )) {
                      enemiesList.splice(idx, 1)
                      enemy.destroy()
                      enemiesKilled++
                      const baseReward = 50
                      const waveBonus = currentWave * 10
                      const totalReward = baseReward + waveBonus
                      currentScore += totalReward
                      currentResources += 25 + (currentWave * 5)
                      recordAction('defend')
                      gameAudioRef.current?.playSound('coin')
                      updateUI()
                      toast.success(`💀 Enemy defeated! +${totalReward}`, { duration: 500 })
                    }
                  })
                })
              },
              loop: true
            })
          })
          
          const updateUI = () => {
            scoreText.setText(`Score: ${currentScore} | Resources: ${currentResources} | Wave: ${currentWave} | Towers: ${currentTowers}`)
            setScore(currentScore)
            setTowers(currentTowers)
            setResources(currentResources)
            setWave(currentWave)
            
            if (enemiesKilled >= currentWave * 5 && currentWave > lastWaveNotified) {
              lastWaveNotified = currentWave
              currentWave++
              setWave(currentWave)
              gameAudioRef.current?.playSound('levelup')
              toast.success(`🌊 Wave ${currentWave}!`, { duration: 2000 })
              enemiesKilled = 0
              // Wave bonus
              currentResources += currentWave * 20
              currentScore += currentWave * 100
            }
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
          gameType: 'tower',
          gameplayData 
        })
      })

      if (!playResponse.ok) throw new Error('Failed to record gameplay data')

      const trainResponse = await fetch('http://localhost:8000/training/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameType: 'tower',
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
              <h1 className="text-4xl font-bold text-white mb-2">TowerDefense</h1>
              <p className="text-gray-400">Build towers, defend base. Train your Liquidity Manager!</p>
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
              <div className="text-sm text-gray-400 mb-1">Towers</div>
              <div className="text-2xl font-bold text-blue-400">{towers}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Resources</div>
              <div className="text-2xl font-bold text-yellow-400">{resources}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Wave</div>
              <div className="text-2xl font-bold text-amber-400">{wave}</div>
            </div>
            <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] px-6 py-4">
              <div className="text-sm text-gray-400 mb-1">Tower Level</div>
              <div className="text-2xl font-bold text-yellow-400">{towerLevel}</div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 rounded-2xl border border-amber-500/30 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="text-4xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">AI Training in Progress</h3>
              <p className="text-gray-300 mb-3">
                Every tower placement and defense decision teaches the AI resource allocation and positioning. 
                The AI learns:
              </p>
              <ul className="text-gray-300 space-y-1 ml-4 list-disc">
                <li><strong>Resource Allocation:</strong> When to build vs upgrade vs save</li>
                <li><strong>Defense Strategy:</strong> Optimal tower positioning and timing</li>
                <li><strong>Positioning:</strong> Strategic placement for maximum coverage</li>
              </ul>
              <p className="text-amber-400 font-semibold mt-3">
                → Deploy as: <span className="text-white">Liquidity Manager</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Tower Defense</h2>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Build towers, upgrade them, defend against enemies
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
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2"
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

