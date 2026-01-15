'use client'

import { useEffect, useRef, useState } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GameAudio } from '../../../lib/gameAudio'
import { ZapIcon } from '../../components/Icons'
// Dynamic import Phaser to avoid SSR issues
let Phaser: any = null
if (typeof window !== 'undefined') {
  Phaser = require('phaser')
}

export default function BattleGamePage() {
  const gameRef = useRef<HTMLDivElement>(null)
  const phaserGameRef = useRef<any>(null)
  const gameAudioRef = useRef<GameAudio | null>(null)

  const [score, setScore] = useState(0)
  const [health, setHealth] = useState(100)
  const [resources, setResources] = useState(100)
  const [round, setRound] = useState(1)
  const [enemyHealth, setEnemyHealth] = useState(100)
  const [enemyMaxHealth, setEnemyMaxHealth] = useState(100)
  const [combo, setCombo] = useState(0)
  const [multiplier, setMultiplier] = useState(1)
  const [isGameOver, setIsGameOver] = useState(false)

  // AI Autopilot State
  const [isAIPlaying, setIsAIPlaying] = useState(false)

  // Use window-level functions for Phaser communication
  const handleAttack = () => {
    if ((window as any).gameAttack) (window as any).gameAttack()
  }
  const handleDefend = () => {
    if ((window as any).gameDefend) (window as any).gameDefend()
  }
  const handleUltimate = () => {
    if ((window as any).gameUltimate) (window as any).gameUltimate()
  }

  // AI Logic Loop
  useEffect(() => {
    if (!isAIPlaying || isGameOver) return

    const thinkInterval = setInterval(() => {
      if (isGameOver) {
        setIsAIPlaying(false)
        return
      }

      // Decision Tree
      // 1. Critical Health -> Defend
      if (health < 40 && resources >= 10) {
        handleDefend()
        return
      }

      // 2. Max Energy -> Ultimate
      if (resources >= 50) {
        // 20% chance to wait for better moment (simulating "strategy")
        if (Math.random() > 0.2) {
          handleUltimate()
          return
        }
      }

      // 3. Normal Attack
      if (resources >= 15) {
        handleAttack()
      }

      // 4. Low Energy -> Wait (Do nothing)

    }, 1500 + Math.random() * 1000) // Random think time 1.5s - 2.5s

    return () => clearInterval(thinkInterval)
  }, [isAIPlaying, isGameOver, health, resources])

  // Game Mode Selection
  const [isModeSelected, setIsModeSelected] = useState(false)

  useEffect(() => {
    if (!isModeSelected) return
    if (!gameRef.current) return

    if (phaserGameRef.current) {
      phaserGameRef.current.destroy(true)
      phaserGameRef.current = null
    }

    // Check if Phaser loaded
    if (!Phaser) return

    gameAudioRef.current = new GameAudio()

    const config: any = {
      type: Phaser.AUTO,
      width: 800,
      height: 500,
      parent: gameRef.current,
      backgroundColor: '#0a0e27',
      scene: {
        create: function (this: Phaser.Scene) {
          const scene = this

          // Game state
          let playerHP = 100
          let enemyHP = 100
          let maxEnemyHP = 100
          let res = 100
          let scr = 0
          let rnd = 1
          let cmb = 0
          let mult = 1
          let over = false

          // Draw arena
          scene.add.rectangle(400, 250, 700, 400, 0x0f1422)
          for (let i = 0; i < 6; i++) {
            scene.add.rectangle(150 + i * 100, 250, 1, 300, 0x1a1f3a, 0.5)
          }

          // Player
          const playerGlow = scene.add.circle(180, 250, 50, 0x00d9ff, 0.2)
          scene.add.circle(180, 250, 45, 0x00d9ff)
          scene.add.circle(180, 250, 35, 0x0066ff)
          scene.add.circle(180, 250, 20, 0x00ffff)
          scene.add.circle(170, 245, 5, 0xffffff)
          scene.add.circle(190, 245, 5, 0xffffff)
          scene.add.rectangle(180, 260, 15, 4, 0xffffff)
          scene.tweens.add({ targets: playerGlow, scale: 1.2, alpha: 0.1, duration: 1000, yoyo: true, repeat: -1 })

          // Enemy
          const enemyGlow = scene.add.circle(620, 250, 50, 0xff0044, 0.2)
          scene.add.circle(620, 250, 45, 0xff0044)
          scene.add.circle(620, 250, 35, 0x990022)
          scene.add.circle(620, 250, 20, 0xff3366)
          scene.add.rectangle(610, 245, 6, 10, 0xffffff)
          scene.add.rectangle(630, 245, 6, 10, 0xffffff)
          scene.add.rectangle(620, 265, 12, 5, 0xffffff)
          scene.tweens.add({ targets: enemyGlow, scale: 1.2, alpha: 0.1, duration: 800, yoyo: true, repeat: -1 })

          // VS
          scene.add.text(400, 250, 'VS', { fontSize: '48px', color: '#ffffff' }).setOrigin(0.5).setAlpha(0.3)

          // UI Bars - backgrounds
          scene.add.rectangle(180, 175, 102, 14, 0x1a1f3a)
          scene.add.rectangle(620, 175, 102, 14, 0x1a1f3a)
          scene.add.rectangle(400, 50, 202, 16, 0x1a1f3a)

          // Health bars with proper origin (left-aligned for correct shrinking)
          const playerBar = scene.add.rectangle(130, 175, 100, 10, 0x00ff88).setOrigin(0, 0.5)
          const enemyBar = scene.add.rectangle(570, 175, 100, 10, 0xff4444).setOrigin(0, 0.5)
          const resBar = scene.add.rectangle(300, 50, 200, 12, 0xffd700).setOrigin(0, 0.5)

          const roundText = scene.add.text(400, 25, 'ROUND 1', { fontSize: '20px', color: '#ffd700' }).setOrigin(0.5)
          const comboText = scene.add.text(400, 470, '', { fontSize: '24px', color: '#00ff88' }).setOrigin(0.5)

          scene.add.text(180, 158, 'YOU', { fontSize: '12px', color: '#00d9ff' }).setOrigin(0.5)
          scene.add.text(620, 158, 'ENEMY', { fontSize: '12px', color: '#ff4444' }).setOrigin(0.5)

          // === PROJECTILE FUNCTION using Graphics ===
          const fireProjectile = (fx: number, fy: number, tx: number, ty: number, color: number, isPlayer = true) => {
            console.log('=== PROJECTILE ===', isPlayer ? 'PLAYER' : 'ENEMY')

            // Create graphics object for projectile
            const g = scene.add.graphics()
            g.setDepth(1000)

            // Draw initial projectile
            const drawProjectile = (x: number, y: number) => {
              g.clear()
              // Outer glow
              g.fillStyle(color, 0.3)
              g.fillCircle(x, y, 25)
              // Main body
              g.fillStyle(color, 1)
              g.fillCircle(x, y, 15)
              // White core
              g.fillStyle(0xffffff, 1)
              g.fillCircle(x, y, 8)
            }

            let currentX = fx
            drawProjectile(currentX, fy)

            // Animate using tween
            const dummy = { x: fx }
            scene.tweens.add({
              targets: dummy,
              x: tx,
              duration: 350,
              ease: 'Linear',
              onUpdate: () => {
                drawProjectile(dummy.x, fy)
              },
              onComplete: () => {
                g.destroy()

                // Explosion
                for (let i = 0; i < 12; i++) {
                  const exp = scene.add.circle(tx, ty, 8, color)
                  exp.setDepth(1000)
                  const ang = (i / 12) * Math.PI * 2
                  scene.tweens.add({
                    targets: exp,
                    x: tx + Math.cos(ang) * 50,
                    y: ty + Math.sin(ang) * 50,
                    alpha: 0,
                    scale: 0,
                    duration: 350,
                    onComplete: () => exp.destroy()
                  })
                }

                // Impact flash
                const flash = scene.add.circle(tx, ty, 30, 0xffffff, 0.9)
                flash.setDepth(1001)
                scene.tweens.add({
                  targets: flash,
                  scale: 2.5,
                  alpha: 0,
                  duration: 250,
                  onComplete: () => flash.destroy()
                })
              }
            })
          }


          const showDamage = (x: number, y: number, dmg: number, crit = false) => {
            const t = scene.add.text(x, y, `-${dmg}`, {
              fontSize: crit ? '40px' : '32px',
              color: crit ? '#ff00ff' : '#ff4444',
              fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(200)

            scene.tweens.add({
              targets: t,
              y: y - 70,
              alpha: 0,
              scale: 1.4,
              duration: 800,
              onComplete: () => t.destroy()
            })
          }

          const showHeal = (x: number, y: number, amt: number) => {
            const t = scene.add.text(x, y, `+${amt}`, {
              fontSize: '32px',
              color: '#00ff88',
              fontStyle: 'bold'
            }).setOrigin(0.5).setDepth(200)

            scene.tweens.add({
              targets: t,
              y: y - 60,
              alpha: 0,
              scale: 1.3,
              duration: 700,
              onComplete: () => t.destroy()
            })
          }

          const updateUI = () => {
            // Use scaleX instead of width for left-origin bars
            playerBar.scaleX = playerHP / 100
            enemyBar.scaleX = Math.max(0.01, enemyHP / maxEnemyHP)
            resBar.scaleX = res / 100
            roundText.setText(`ROUND ${rnd}`)
            comboText.setText(cmb >= 3 ? `🔥 ${cmb}x COMBO! (${mult.toFixed(1)}x)` : '')

            setHealth(playerHP)
            setEnemyHealth(enemyHP)
            setEnemyMaxHealth(maxEnemyHP)
            setResources(res)
            setScore(scr)
            setRound(rnd)
            setCombo(cmb)
            setMultiplier(mult)

            if (enemyHP <= 0 && !over) {
              scr += 100 * rnd
              rnd++
              maxEnemyHP = 100 + rnd * 25
              enemyHP = maxEnemyHP
              playerHP = Math.min(100, playerHP + 30)
              res = 100
              gameAudioRef.current?.playSound('levelup')
              toast.success(`🎉 Round ${rnd - 1} Complete!`)
              setTimeout(() => updateUI(), 100)
            }

            if (playerHP <= 0 && !over) {
              over = true
              scene.scene.pause()
              gameAudioRef.current?.playSound('error')
              setIsGameOver(true)
              // Stop AI if game over
              setIsAIPlaying(false)
            }
          }

          // === ATTACK ===
          const doAttack = () => {
            console.log('Attack called! res:', res, 'over:', over)
            if (over) return
            if (res < 15) {
              gameAudioRef.current?.playSound('error')
              toast.error('Need 15 energy!')
              return
            }

            res -= 15
            cmb++
            mult = 1 + cmb * 0.15
            const dmg = Math.floor(25 * mult)

            gameAudioRef.current?.playSound('success')
            updateUI()

            // Fire projectile!
            fireProjectile(180, 250, 620, 250, 0x00d9ff)

            scene.time.delayedCall(280, () => {
              enemyHP = Math.max(0, enemyHP - dmg)
              showDamage(620, 200, dmg)
              scene.cameras.main.shake(120, 0.012)
              updateUI()
            })
          }

          // === DEFEND ===
          const doDefend = () => {
            console.log('Defend called!')
            if (over) return
            if (res < 10) {
              gameAudioRef.current?.playSound('error')
              toast.error('Need 10 energy!')
              return
            }

            res -= 10
            const heal = 20
            playerHP = Math.min(100, playerHP + heal)

            gameAudioRef.current?.playSound('powerup')

            // Shield effect
            const shield = scene.add.circle(180, 250, 65, 0x00ff88, 0.6)
            shield.setDepth(100)
            scene.tweens.add({
              targets: shield,
              scale: 1.6,
              alpha: 0,
              duration: 500,
              onComplete: () => shield.destroy()
            })

            showHeal(180, 200, heal)
            updateUI()
          }

          // === ULTIMATE ===
          const doUltimate = () => {
            console.log('Ultimate called!')
            if (over) return
            if (res < 50) {
              gameAudioRef.current?.playSound('error')
              toast.error('Need 50 energy!')
              return
            }

            res -= 50
            cmb += 3
            mult = 1 + cmb * 0.15
            const dmg = Math.floor(60 * mult)

            gameAudioRef.current?.playSound('combo')
            updateUI()

            // Charge effect
            const charge = scene.add.circle(180, 250, 30, 0xff00ff)
            charge.setDepth(100)
            scene.tweens.add({
              targets: charge,
              scale: 3.5,
              alpha: 0,
              duration: 250,
              onComplete: () => charge.destroy()
            })

            // Triple projectiles
            scene.time.delayedCall(150, () => {
              fireProjectile(180, 210, 620, 210, 0xff00ff)
              fireProjectile(180, 250, 620, 250, 0xff00ff)
              fireProjectile(180, 290, 620, 290, 0xff00ff)

              scene.time.delayedCall(280, () => {
                enemyHP = Math.max(0, enemyHP - dmg)
                showDamage(620, 200, dmg, true)
                scene.cameras.main.shake(200, 0.03)
                scene.cameras.main.flash(150, 255, 0, 255)
                updateUI()
              })
            })
          }

          // === ENEMY ATTACK ===
          const enemyAttack = () => {
            if (over || enemyHP <= 0) return
            cmb = 0
            mult = 1
            const dmg = 12 + rnd * 3

            fireProjectile(620, 250, 180, 250, 0xff0044, false)

            scene.time.delayedCall(280, () => {
              playerHP = Math.max(0, playerHP - dmg)
              showDamage(180, 200, dmg)
              scene.cameras.main.shake(100, 0.01)
              updateUI()
            })
          }

          // EXPOSE TO WINDOW
          (window as any).gameAttack = doAttack;
          (window as any).gameDefend = doDefend;
          (window as any).gameUltimate = doUltimate;

          // Timers
          scene.time.addEvent({ delay: 2800, callback: enemyAttack, loop: true })
          scene.time.addEvent({
            delay: 1500,
            callback: () => {
              if (!over && res < 100) {
                res = Math.min(100, res + 12)
                updateUI()
              }
            },
            loop: true
          })

          console.log('Game initialized! Functions attached to window.')
        }
      }
    }

    phaserGameRef.current = new Phaser.Game(config)

    return () => {
      phaserGameRef.current?.destroy(true)
      gameAudioRef.current?.cleanup()
      delete (window as any).gameAttack
      delete (window as any).gameDefend
      delete (window as any).gameUltimate
    }
  }, [])

  return (
    <div className="min-h-screen bg-[#0A0E27]">
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
                    <span className="text-3xl">⚔️</span>
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-2">Manual Combat</h3>
                  <p className="text-gray-400 leading-relaxed">
                    Take direct control of your hero. Manage energy, time your attacks, and defeat the enemy boss with your own skills.
                  </p>
                </div>
                <div className="relative z-10 flex items-center text-blue-400 font-bold group-hover:translate-x-2 transition-transform">
                  START BATTLE <span className="ml-2">→</span>
                </div>
              </motion.button>

              {/* Data/AI Mode Card */}
              <motion.button
                whileHover={{ scale: 1.02, borderColor: '#9333EA' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setIsModeSelected(true)
                  setIsAIPlaying(true)
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
                    Watch the AI Agent battle using simulated strategy data. (Data Upload coming soon for this module).
                  </p>
                </div>
                <div className="relative z-10 flex items-center text-purple-400 font-bold group-hover:translate-x-2 transition-transform">
                  ACTIVATE AUTO-PILOT <span className="ml-2">→</span>
                </div>

                {/* Badge */}
                <div className="absolute top-6 right-6 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30 text-xs text-purple-300 font-mono">
                  SIMULATION
                </div>
              </motion.button>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Navbar />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500">
              DEFI BATTLER
            </h1>
            <p className="text-gray-400 text-sm">Defeat enemies • Build combos • Train your AI</p>
          </div>
          <Link href="/games">
            <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 bg-[#1A1F3A] text-gray-300 rounded-xl border border-[#2A2F4A]">
              ← Back
            </motion.button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-3 mb-4">
          <div className="bg-gradient-to-br from-[#0F1422] to-[#1A1F3A] rounded-xl p-4 border border-cyan-500/20 text-center">
            <div className="text-xs text-cyan-400 font-bold">SCORE</div>
            <div className="text-2xl font-black text-white">{score}</div>
          </div>
          <div className="bg-gradient-to-br from-[#0F1422] to-[#1A1F3A] rounded-xl p-4 border border-yellow-500/20 text-center">
            <div className="text-xs text-yellow-400 font-bold">ROUND</div>
            <div className="text-2xl font-black text-white">{round}</div>
          </div>
          <div className="bg-gradient-to-br from-[#0F1422] to-[#1A1F3A] rounded-xl p-4 border border-green-500/20 text-center">
            <div className="text-xs text-green-400 font-bold">HEALTH</div>
            <div className="text-2xl font-black text-white">{health}</div>
          </div>
          <div className="bg-gradient-to-br from-[#0F1422] to-[#1A1F3A] rounded-xl p-4 border border-orange-500/20 text-center">
            <div className="text-xs text-orange-400 font-bold">COMBO</div>
            <div className="text-2xl font-black text-white">{combo}x</div>
          </div>
          <div className="bg-gradient-to-br from-[#0F1422] to-[#1A1F3A] rounded-xl p-4 border border-purple-500/20 text-center">
            <div className="text-xs text-purple-400 font-bold">MULTI</div>
            <div className="text-2xl font-black text-white">{multiplier.toFixed(1)}x</div>
          </div>
        </div>

        {/* Health Bars */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-[#0F1422] rounded-xl p-3 border border-[#1A1F3A]">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-cyan-400 font-bold">YOU</span>
              <span className="text-white">{health}/100</span>
            </div>
            <div className="h-3 bg-[#1A1F3A] rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full"
                animate={{ width: `${health}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
          <div className="bg-[#0F1422] rounded-xl p-3 border border-[#1A1F3A]">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-yellow-400 font-bold">ENERGY</span>
              <span className="text-white">{resources}/100</span>
            </div>
            <div className="h-3 bg-[#1A1F3A] rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400 rounded-full"
                animate={{ width: `${resources}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
          <div className="bg-[#0F1422] rounded-xl p-3 border border-[#1A1F3A]">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-400 font-bold">ENEMY</span>
              <span className="text-white">{enemyHealth}/{enemyMaxHealth}</span>
            </div>
            <div className="h-3 bg-[#1A1F3A] rounded-full overflow-hidden">
              <motion.div className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                animate={{ width: `${Math.max(0, (enemyHealth / enemyMaxHealth) * 100)}%` }} transition={{ duration: 0.3 }} />
            </div>
          </div>
        </div>

        {/* Game Canvas */}
        <div className="relative rounded-2xl border-2 border-[#1A1F3A] overflow-hidden mb-4 bg-[#0a0e27]">
          <div ref={gameRef} style={{ width: '800px', height: '500px', margin: '0 auto' }} />

          <AnimatePresence>
            {isAIPlaying && !isGameOver && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 w-full flex justify-center pointer-events-none"
              >
                <div className="bg-purple-600/80 backdrop-blur border border-purple-400 text-white px-6 py-2 rounded-full font-bold font-mono flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.5)]">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                  AI COMBAT MODE ENGAGED
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isGameOver && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center">
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                  className="bg-[#1A1F3A] rounded-2xl p-8 text-center">
                  <div className="text-5xl mb-4">💀</div>
                  <h2 className="text-3xl font-black text-white mb-2">GAME OVER</h2>
                  <p className="text-gray-400 mb-4">Score: {score} | Rounds: {round - 1}</p>
                  <motion.button whileHover={{ scale: 1.05 }} onClick={() => window.location.reload()}
                    className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl">
                    🔄 PLAY AGAIN
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* AI Toggle */}
        <div className="mb-4">
          <button
            onClick={() => setIsAIPlaying(!isAIPlaying)}
            disabled={isGameOver}
            className={`w-full py-3 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${isAIPlaying
              ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-pulse'
              : 'bg-[#1A1F3A] text-gray-400 hover:bg-[#252B45] border border-[#2A2F4A]'
              }`}
          >
            {isAIPlaying ? (
              <>
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                AI AUTO-PILOT ON
              </>
            ) : (
              <>
                <ZapIcon className="w-5 h-5" />
                ENABLE AI AUTO-PILOT
              </>
            )}
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <motion.button
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleAttack}
            disabled={resources < 15 || isGameOver || isAIPlaying}
            className="py-6 bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-center shadow-lg shadow-cyan-500/30 transition-all"
          >
            <div className="text-4xl mb-2">⚔️</div>
            <div className="text-xl font-black">ATTACK</div>
            <div className="text-sm opacity-80 mt-1">15 energy • 25+ dmg</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleDefend}
            disabled={resources < 10 || isGameOver || isAIPlaying}
            className="py-6 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-center shadow-lg shadow-green-500/30 transition-all"
          >
            <div className="text-4xl mb-2">🛡️</div>
            <div className="text-xl font-black">HEAL</div>
            <div className="text-sm opacity-80 mt-1">10 energy • +20 HP</div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.03, y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleUltimate}
            disabled={resources < 50 || isGameOver || isAIPlaying}
            className="py-6 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-500 hover:to-pink-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-center shadow-lg shadow-purple-500/30 transition-all"
          >
            <div className="text-4xl mb-2">💥</div>
            <div className="text-xl font-black">ULTIMATE</div>
            <div className="text-sm opacity-80 mt-1">50 energy • 60+ crit</div>
          </motion.button>
        </div>
      </main>
    </div>
  )
}
