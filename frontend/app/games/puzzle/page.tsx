'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GameAudio } from '../../../lib/gameAudio'

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_click', name: 'First Click', desc: 'Make your first click', icon: '👆', requirement: 1, type: 'clicks' },
  { id: 'clicker_100', name: 'Dedicated Clicker', desc: 'Click 100 times', icon: '🖱️', requirement: 100, type: 'clicks' },
  { id: 'clicker_1000', name: 'Click Master', desc: 'Click 1,000 times', icon: '⚡', requirement: 1000, type: 'clicks' },
  { id: 'clicker_10000', name: 'Click Legend', desc: 'Click 10,000 times', icon: '🏆', requirement: 10000, type: 'clicks' },
  { id: 'coins_1k', name: 'First Thousand', desc: 'Earn 1,000 coins', icon: '💰', requirement: 1000, type: 'coins' },
  { id: 'coins_100k', name: 'Wealthy', desc: 'Earn 100,000 coins', icon: '💎', requirement: 100000, type: 'coins' },
  { id: 'coins_1m', name: 'Millionaire', desc: 'Earn 1,000,000 coins', icon: '👑', requirement: 1000000, type: 'coins' },
  { id: 'combo_10', name: 'Combo Starter', desc: 'Reach 10x combo', icon: '🔥', requirement: 10, type: 'combo' },
  { id: 'combo_25', name: 'Combo Master', desc: 'Reach 25x combo', icon: '💥', requirement: 25, type: 'combo' },
  { id: 'combo_50', name: 'Combo God', desc: 'Reach 50x combo', icon: '☄️', requirement: 50, type: 'combo' },
  { id: 'crit_10', name: 'Lucky', desc: 'Get 10 critical hits', icon: '🎯', requirement: 10, type: 'crits' },
  { id: 'upgrade_first', name: 'Investor', desc: 'Buy your first upgrade', icon: '📈', requirement: 1, type: 'upgrades' },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5', icon: '⭐', requirement: 5, type: 'level' },
  { id: 'level_10', name: 'Elite', desc: 'Reach level 10', icon: '🌟', requirement: 10, type: 'level' },
  { id: 'golden_1', name: 'Golden Touch', desc: 'Get a golden click', icon: '✨', requirement: 1, type: 'golden' },
]

export default function ClickerGamePage() {
  const gameAudioRef = useRef<GameAudio | null>(null)
  const [coins, setCoins] = useState(0)
  const [totalCoins, setTotalCoins] = useState(0)
  const [coinsPerClick, setCoinsPerClick] = useState(1)
  const [coinsPerSecond, setCoinsPerSecond] = useState(0)
  const [clickCount, setClickCount] = useState(0)
  const [level, setLevel] = useState(1)
  const [multiplier, setMultiplier] = useState(1)
  const [floatingNumbers, setFloatingNumbers] = useState<{ id: number, value: number, x: number, y: number, type: string }[]>([])
  const [isShaking, setIsShaking] = useState(false)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [lastClickTime, setLastClickTime] = useState(0)
  const [critCount, setCritCount] = useState(0)
  const [goldenCount, setGoldenCount] = useState(0)
  const [isGoldenActive, setIsGoldenActive] = useState(false)
  const [goldenTimer, setGoldenTimer] = useState(0)
  const [particles, setParticles] = useState<{ id: number, x: number, y: number, color: string }[]>([])
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([])
  const [showAchievement, setShowAchievement] = useState<typeof ACHIEVEMENTS[0] | null>(null)

  // Upgrades with more options
  const [upgrades, setUpgrades] = useState({
    clickPower: { level: 0, cost: 10, effect: 1, name: '💪 Click Power', desc: '+1 coins per click' },
    autoMiner: { level: 0, cost: 50, effect: 0.5, name: '⛏️ Auto Miner', desc: '+0.5 coins/sec' },
    multiplier: { level: 0, cost: 200, effect: 0.1, name: '✨ Multiplier', desc: '+10% all earnings' },
    critChance: { level: 0, cost: 500, effect: 5, name: '🎯 Crit Chance', desc: '+5% crit (3x dmg)' },
    comboBoost: { level: 0, cost: 300, effect: 0.5, name: '🔥 Combo Boost', desc: '+0.5% per combo' },
    goldenChance: { level: 0, cost: 1000, effect: 1, name: '🌟 Golden Luck', desc: '+1% golden click' },
    autoClicker: { level: 0, cost: 2000, effect: 1, name: '🤖 Auto Clicker', desc: '+1 auto click/sec' },
  })

  // Training data
  interface TrainingData {
    timestamp: number
    action: 'click' | 'upgrade' | 'combo' | 'crit' | 'golden' | 'achievement'
    details: any
  }
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [isTraining, setIsTraining] = useState(false)

  // Initialize audio
  useEffect(() => {
    gameAudioRef.current = new GameAudio()
    return () => { gameAudioRef.current?.cleanup() }
  }, [])

  // Auto miner
  useEffect(() => {
    if (coinsPerSecond <= 0) return
    const interval = setInterval(() => {
      const earned = coinsPerSecond * multiplier
      setCoins(c => c + earned)
      setTotalCoins(t => t + earned)
    }, 1000)
    return () => clearInterval(interval)
  }, [coinsPerSecond, multiplier])

  // Auto clicker
  useEffect(() => {
    if (upgrades.autoClicker.level <= 0) return
    const cps = upgrades.autoClicker.level
    const interval = setInterval(() => {
      const earned = coinsPerClick * multiplier * 0.5
      setCoins(c => c + earned)
      setTotalCoins(t => t + earned)
      setClickCount(c => c + 1)
    }, 1000 / cps)
    return () => clearInterval(interval)
  }, [upgrades.autoClicker.level, coinsPerClick, multiplier])

  // Golden click timer
  useEffect(() => {
    if (!isGoldenActive) return
    const interval = setInterval(() => {
      setGoldenTimer(t => {
        if (t <= 1) {
          setIsGoldenActive(false)
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [isGoldenActive])

  // Level up
  useEffect(() => {
    const newLevel = Math.floor(totalCoins / 1000) + 1
    if (newLevel > level) {
      setLevel(newLevel)
      gameAudioRef.current?.playSound('levelup')
      toast.success(`🎉 Level ${newLevel}! Bonus x${(1 + newLevel * 0.1).toFixed(1)}`)
      checkAchievement('level', newLevel)
    }
  }, [totalCoins, level])

  // Check achievements
  const checkAchievement = useCallback((type: string, value: number) => {
    ACHIEVEMENTS.filter(a => a.type === type && value >= a.requirement && !unlockedAchievements.includes(a.id))
      .forEach(achievement => {
        setUnlockedAchievements(prev => [...prev, achievement.id])
        setShowAchievement(achievement)
        gameAudioRef.current?.playSound('powerup')
        setTimeout(() => setShowAchievement(null), 3000)
        setTrainingData(prev => [...prev, { timestamp: Date.now(), action: 'achievement', details: { achievement: achievement.id } }])
      })
  }, [unlockedAchievements])

  // Create particle explosion
  const createParticles = (x: number, y: number, color: string, count: number = 8) => {
    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x, y, color
    }))
    setParticles(prev => [...prev, ...newParticles])
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)))
    }, 600)
  }

  // Handle main click
  const handleClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now()
    const timeSinceLast = now - lastClickTime
    setLastClickTime(now)

    // Combo
    if (timeSinceLast < 500) {
      setCombo(c => {
        const newCombo = Math.min(c + 1, 50)
        if (newCombo > maxCombo) setMaxCombo(newCombo)
        checkAchievement('combo', newCombo)
        return newCombo
      })
    } else if (timeSinceLast > 2000) {
      setCombo(0)
    }

    // Golden click check
    const goldenChance = upgrades.goldenChance.level
    const isGolden = Math.random() * 100 < goldenChance && !isGoldenActive
    if (isGolden) {
      setIsGoldenActive(true)
      setGoldenTimer(10)
      setGoldenCount(g => g + 1)
      toast.success('🌟 GOLDEN CLICK! 10x earnings for 10 seconds!')
      gameAudioRef.current?.playSound('combo')
      checkAchievement('golden', goldenCount + 1)
    }

    // Crit check
    const critChance = 5 + (upgrades.critChance.level * 5)
    const isCrit = Math.random() * 100 < critChance
    if (isCrit) setCritCount(c => { checkAchievement('crits', c + 1); return c + 1 })

    // Calculate earnings
    const comboBonus = 1 + (combo * (0.02 + upgrades.comboBoost.level * 0.005))
    const levelBonus = 1 + (level * 0.1)
    const goldenBonus = isGoldenActive ? 10 : 1
    let earned = coinsPerClick * multiplier * comboBonus * levelBonus * goldenBonus
    if (isCrit) earned *= 3
    earned = Math.floor(earned)

    setCoins(c => c + earned)
    setTotalCoins(t => { checkAchievement('coins', t + earned); return t + earned })
    setClickCount(c => { checkAchievement('clicks', c + 1); return c + 1 })

    // Visual effects
    setIsShaking(true)
    setTimeout(() => setIsShaking(false), 50)

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Floating number
    setFloatingNumbers(prev => [...prev, {
      id: now, value: earned, x, y,
      type: isGolden ? 'golden' : isCrit ? 'crit' : combo >= 10 ? 'combo' : 'normal'
    }])
    setTimeout(() => setFloatingNumbers(prev => prev.filter(n => n.id !== now)), 1000)

    // Particles
    const color = isGolden ? '#FFD700' : isCrit ? '#FF4444' : combo >= 10 ? '#FF8800' : '#00D9FF'
    createParticles(x + 150, y + 100, color, isGolden ? 20 : isCrit ? 12 : 6)

    // Sound
    gameAudioRef.current?.playSound(isCrit ? 'combo' : 'coin')

    // Training data
    setTrainingData(prev => [...prev, {
      timestamp: now,
      action: isGolden ? 'golden' : isCrit ? 'crit' : combo >= 5 ? 'combo' : 'click',
      details: { earned, combo, multiplier, level, timeSinceLast }
    }])
  }, [coinsPerClick, multiplier, combo, level, lastClickTime, upgrades, isGoldenActive, maxCombo, goldenCount, checkAchievement])

  // Buy upgrade
  const buyUpgrade = (key: keyof typeof upgrades) => {
    const upgrade = upgrades[key]
    if (coins < upgrade.cost) {
      toast.error('Not enough coins!')
      gameAudioRef.current?.playSound('error')
      return
    }

    setCoins(c => c - upgrade.cost)
    const newLevel = upgrade.level + 1
    setUpgrades(prev => ({
      ...prev,
      [key]: { ...upgrade, level: newLevel, cost: Math.floor(upgrade.cost * 1.5) }
    }))

    if (key === 'clickPower') setCoinsPerClick(c => c + upgrade.effect)
    if (key === 'autoMiner') setCoinsPerSecond(c => c + upgrade.effect)
    if (key === 'multiplier') setMultiplier(m => m + upgrade.effect)

    gameAudioRef.current?.playSound('powerup')
    toast.success(`Upgraded ${upgrade.name}!`)
    checkAchievement('upgrades', Object.values(upgrades).reduce((a, u) => a + u.level, 0) + 1)
    setTrainingData(prev => [...prev, { timestamp: Date.now(), action: 'upgrade', details: { upgrade: key } }])
  }

  const formatNumber = (n: number) => {
    if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B'
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
    return Math.floor(n).toString()
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] overflow-hidden">
      <Navbar />

      {/* Achievement popup */}
      <AnimatePresence>
        {showAchievement && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4"
          >
            <span className="text-4xl">{showAchievement.icon}</span>
            <div>
              <div className="text-white font-black text-lg">🏆 Achievement Unlocked!</div>
              <div className="text-white/80">{showAchievement.name}: {showAchievement.desc}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500">
              Crypto Clicker
            </h1>
            <p className="text-gray-400 text-sm">Click • Upgrade • Dominate</p>
          </div>
          <Link href="/games">
            <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 bg-[#1A1F3A] text-gray-300 rounded-lg border border-[#2A2F4A]">
              ← Back
            </motion.button>
          </Link>
        </div>

        {/* Golden indicator */}
        {isGoldenActive && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="mb-4 p-3 bg-gradient-to-r from-yellow-500/30 to-orange-500/30 border border-yellow-500 rounded-xl text-center"
          >
            <span className="text-yellow-400 font-black text-xl">🌟 GOLDEN MODE: {goldenTimer}s - 10x EARNINGS! 🌟</span>
          </motion.div>
        )}

        {/* Stats Bar */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[
            { label: 'COINS', value: formatNumber(coins), color: 'yellow', icon: '💰' },
            { label: 'PER CLICK', value: formatNumber(coinsPerClick * multiplier * (isGoldenActive ? 10 : 1)), color: 'green', icon: '👆' },
            { label: 'PER SEC', value: formatNumber(coinsPerSecond * multiplier), color: 'blue', icon: '⏱️' },
            { label: 'LEVEL', value: level, color: 'purple', icon: '⭐' },
            { label: 'COMBO', value: combo + 'x', color: 'orange', icon: '🔥' },
            { label: 'CRITS', value: critCount, color: 'red', icon: '🎯' },
            { label: 'CLICKS', value: formatNumber(clickCount), color: 'cyan', icon: '🖱️' },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/10 rounded-xl p-3 border border-${stat.color}-500/30 text-center`}>
              <div className="text-xs text-gray-400 font-bold">{stat.icon} {stat.label}</div>
              <div className="text-xl font-black text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Main Click Area */}
          <div className="col-span-5">
            <div className={`bg-[#0F1422] rounded-2xl border-2 ${isGoldenActive ? 'border-yellow-500' : 'border-[#1A1F3A]'} p-6 h-[420px] flex flex-col items-center justify-center relative overflow-hidden`}>
              {/* Background particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(15)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`absolute w-2 h-2 ${isGoldenActive ? 'bg-yellow-500' : 'bg-cyan-500'} rounded-full opacity-30`}
                    animate={{
                      y: [400, -50],
                      x: [Math.random() * 300, Math.random() * 300],
                    }}
                    transition={{ duration: 3 + Math.random() * 2, repeat: Infinity, delay: Math.random() * 2 }}
                  />
                ))}
              </div>

              {/* Combo indicator */}
              {combo >= 5 && (
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full text-white font-black">
                  🔥 {combo}x COMBO!
                </motion.div>
              )}

              {/* Coin button */}
              <motion.button
                onClick={handleClick}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                animate={isShaking ? { rotate: [-2, 2, -2, 0] } : { rotate: 0 }}
                className={`relative w-44 h-44 rounded-full ${isGoldenActive ? 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500' : 'bg-gradient-to-br from-yellow-400 via-yellow-500 to-orange-500'} shadow-2xl ${isGoldenActive ? 'shadow-yellow-500/70' : 'shadow-yellow-500/50'} flex items-center justify-center cursor-pointer group`}
              >
                <div className={`absolute inset-0 rounded-full ${isGoldenActive ? 'bg-yellow-300' : 'bg-yellow-400'} blur-xl opacity-50 group-hover:opacity-80`} />
                <div className="relative w-36 h-36 rounded-full bg-gradient-to-br from-yellow-300 to-yellow-500 flex items-center justify-center border-4 border-yellow-200/50">
                  <span className="text-5xl">{isGoldenActive ? '👑' : '💰'}</span>
                </div>
              </motion.button>

              {/* Floating numbers */}
              <AnimatePresence>
                {floatingNumbers.map(num => (
                  <motion.div
                    key={num.id}
                    initial={{ opacity: 1, y: 0, scale: 1 }}
                    animate={{ opacity: 0, y: -80, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    className={`absolute pointer-events-none font-black text-xl ${num.type === 'golden' ? 'text-yellow-300' :
                        num.type === 'crit' ? 'text-red-400' :
                          num.type === 'combo' ? 'text-orange-400' : 'text-green-400'
                      }`}
                    style={{ left: num.x - 20, top: num.y + 50 }}
                  >
                    +{formatNumber(num.value)}
                    {num.type === 'crit' && ' CRIT!'}
                    {num.type === 'golden' && ' 🌟'}
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Particles */}
              <AnimatePresence>
                {particles.map(p => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 1, scale: 1, x: p.x, y: p.y }}
                    animate={{
                      opacity: 0,
                      scale: 0,
                      x: p.x + (Math.random() - 0.5) * 100,
                      y: p.y + (Math.random() - 0.5) * 100,
                    }}
                    transition={{ duration: 0.6 }}
                    className="absolute w-3 h-3 rounded-full"
                    style={{ backgroundColor: p.color }}
                  />
                ))}
              </AnimatePresence>

              <p className="mt-6 text-gray-400 text-sm">Click fast for combos! 🔥</p>
            </div>
          </div>

          {/* Upgrades Panel */}
          <div className="col-span-4 space-y-2 overflow-y-auto max-h-[420px] pr-2">
            <h2 className="text-lg font-bold text-white mb-2">⚡ Upgrades</h2>
            {Object.entries(upgrades).map(([key, upgrade]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => buyUpgrade(key as keyof typeof upgrades)}
                disabled={coins < upgrade.cost}
                className={`w-full p-3 rounded-xl border text-left transition-all ${coins >= upgrade.cost
                    ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/10 border-purple-500/50 hover:border-purple-400'
                    : 'bg-[#0F1422] border-[#1A1F3A] opacity-50'
                  }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold text-white">{upgrade.name}</span>
                  <span className="text-xs text-gray-400 bg-[#1A1F3A] px-2 py-1 rounded">Lv.{upgrade.level}</span>
                </div>
                <div className="text-xs text-gray-400">{upgrade.desc}</div>
                <div className="text-yellow-400 font-bold text-sm mt-1">{formatNumber(upgrade.cost)} 💰</div>
              </motion.button>
            ))}
          </div>

          {/* Achievements Panel */}
          <div className="col-span-3 bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-4 max-h-[420px] overflow-y-auto">
            <h2 className="text-lg font-bold text-white mb-3">🏆 Achievements</h2>
            <div className="text-sm text-gray-400 mb-3">{unlockedAchievements.length}/{ACHIEVEMENTS.length} unlocked</div>
            <div className="space-y-2">
              {ACHIEVEMENTS.map(ach => (
                <div key={ach.id} className={`p-2 rounded-lg border ${unlockedAchievements.includes(ach.id)
                    ? 'bg-yellow-500/20 border-yellow-500/50'
                    : 'bg-[#1A1F3A]/50 border-[#2A2F4A] opacity-50'
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{ach.icon}</span>
                    <div>
                      <div className="text-white text-sm font-bold">{ach.name}</div>
                      <div className="text-gray-400 text-xs">{ach.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Training Section */}
        <div className="mt-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/30 p-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">AI Training: {trainingData.length} actions recorded</h3>
              <div className="flex gap-4 text-xs text-gray-400 mt-1">
                <span>Clicks: {trainingData.filter(d => d.action === 'click').length}</span>
                <span className="text-orange-400">Combos: {trainingData.filter(d => d.action === 'combo').length}</span>
                <span className="text-red-400">Crits: {trainingData.filter(d => d.action === 'crit').length}</span>
                <span className="text-yellow-400">Golden: {trainingData.filter(d => d.action === 'golden').length}</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              disabled={trainingData.length < 50 || isTraining}
              onClick={async () => {
                setIsTraining(true)
                toast.loading('Starting AI training...', { id: 'train' })
                try {
                  await fetch('http://localhost:8000/training/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameType: 'clicker', gameplayData: trainingData })
                  })
                  toast.dismiss('train')
                  toast.success('Training started!')
                } catch {
                  toast.dismiss('train')
                  toast.error('Backend not connected')
                  setIsTraining(false)
                }
              }}
              className="px-5 py-2 bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl"
            >
              {trainingData.length < 50 ? `${trainingData.length}/50` : '🚀 Train AI'}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  )
}
