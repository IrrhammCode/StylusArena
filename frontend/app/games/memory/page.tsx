'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GameAudio } from '../../../lib/gameAudio'

// Card icons (crypto/tech themed)
const CARD_ICONS = ['₿', 'Ξ', '◆', '⬡', '◎', '✦', '⚡', '🔷', '💎', '🌟', '🔮', '🎯']
const CARD_COLORS = ['#F7931A', '#627EEA', '#28A0F0', '#00D9FF', '#9945FF', '#FFD700', '#FF6B6B', '#4ECDC4', '#A855F7', '#10B981', '#EC4899', '#F59E0B']

interface Card {
  id: number
  icon: string
  color: string
  isFlipped: boolean
  isMatched: boolean
}

export default function MemoryGamePage() {
  const gameAudioRef = useRef<GameAudio | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [flippedCards, setFlippedCards] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const [moves, setMoves] = useState(0)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [timer, setTimer] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameComplete, setGameComplete] = useState(false)
  const [gridSize, setGridSize] = useState(4) // 4x4 = 16 cards = 8 pairs
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy')

  // Combo system
  const [combo, setCombo] = useState(0)
  const [lastMatchTime, setLastMatchTime] = useState(0)

  // Training data
  interface TrainingData {
    timestamp: number
    action: 'flip' | 'match' | 'miss'
    cardPosition: number
    timeSinceLast: number
    currentStreak: number
    memoryAccuracy: number
  }
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [isTraining, setIsTraining] = useState(false)

  // Initialize game
  const initGame = useCallback(() => {
    const pairCount = (gridSize * gridSize) / 2
    const selectedIcons = CARD_ICONS.slice(0, pairCount)
    const selectedColors = CARD_COLORS.slice(0, pairCount)

    let newCards: Card[] = []
    for (let i = 0; i < pairCount; i++) {
      newCards.push({ id: i * 2, icon: selectedIcons[i], color: selectedColors[i], isFlipped: false, isMatched: false })
      newCards.push({ id: i * 2 + 1, icon: selectedIcons[i], color: selectedColors[i], isFlipped: false, isMatched: false })
    }

    // Shuffle
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]]
    }

    setCards(newCards)
    setFlippedCards([])
    setMatches(0)
    setMoves(0)
    setScore(0)
    setStreak(0)
    setCombo(0)
    setTimer(0)
    setIsPlaying(true)
    setGameComplete(false)
    setTrainingData([])
  }, [gridSize])

  // Initialize audio and game
  useEffect(() => {
    gameAudioRef.current = new GameAudio()
    initGame()
    return () => { gameAudioRef.current?.cleanup() }
  }, [initGame])

  // Timer
  useEffect(() => {
    if (!isPlaying || gameComplete) return
    const interval = setInterval(() => setTimer(t => t + 1), 1000)
    return () => clearInterval(interval)
  }, [isPlaying, gameComplete])

  // Handle card click
  const handleCardClick = (index: number) => {
    if (flippedCards.length >= 2) return
    if (cards[index].isFlipped || cards[index].isMatched) return

    const now = Date.now()
    gameAudioRef.current?.playSound('coin')

    // Flip card
    const newCards = [...cards]
    newCards[index].isFlipped = true
    setCards(newCards)

    const newFlipped = [...flippedCards, index]
    setFlippedCards(newFlipped)

    // Record training data
    setTrainingData(prev => [...prev, {
      timestamp: now,
      action: 'flip',
      cardPosition: index,
      timeSinceLast: now - lastMatchTime,
      currentStreak: streak,
      memoryAccuracy: matches > 0 ? (matches / moves) * 100 : 0
    }])

    // Check for match
    if (newFlipped.length === 2) {
      setMoves(m => m + 1)
      const [first, second] = newFlipped

      if (cards[first].icon === cards[second].icon) {
        // Match!
        setTimeout(() => {
          const matchedCards = [...cards]
          matchedCards[first].isMatched = true
          matchedCards[second].isMatched = true
          setCards(matchedCards)
          setFlippedCards([])

          const newMatches = matches + 1
          setMatches(newMatches)

          // Combo system
          const timeDiff = now - lastMatchTime
          let newCombo = timeDiff < 3000 ? combo + 1 : 1
          setCombo(newCombo)
          setLastMatchTime(now)

          // Score calculation
          const baseScore = 100
          const speedBonus = Math.max(0, 50 - Math.floor(timeDiff / 100))
          const comboBonus = newCombo * 25
          const streakBonus = (streak + 1) * 10
          const totalScore = baseScore + speedBonus + comboBonus + streakBonus

          setScore(s => s + totalScore)
          setStreak(s => {
            const newStreak = s + 1
            if (newStreak > bestStreak) setBestStreak(newStreak)
            return newStreak
          })

          gameAudioRef.current?.playSound('powerup')
          toast.success(`🎯 Match! +${totalScore} pts ${newCombo > 1 ? `(${newCombo}x Combo!)` : ''}`, { duration: 1000 })

          setTrainingData(prev => [...prev, { ...prev[prev.length - 1], action: 'match' }])

          // Check win
          if (newMatches === (gridSize * gridSize) / 2) {
            setGameComplete(true)
            setIsPlaying(false)
            const levelBonus = 500 * level
            setScore(s => s + levelBonus)
            gameAudioRef.current?.playSound('levelup')
            toast.success(`🎉 Level Complete! +${levelBonus} bonus!`)
          }
        }, 500)
      } else {
        // No match
        setStreak(0)
        setCombo(0)
        setTimeout(() => {
          const resetCards = [...cards]
          resetCards[first].isFlipped = false
          resetCards[second].isFlipped = false
          setCards(resetCards)
          setFlippedCards([])
          gameAudioRef.current?.playSound('error')
        }, 1000)

        setTrainingData(prev => [...prev, { ...prev[prev.length - 1], action: 'miss' }])
      }
    }
  }

  // Next level
  const nextLevel = () => {
    setLevel(l => l + 1)
    if (gridSize < 6) setGridSize(g => g + (level % 2 === 0 ? 2 : 0))
    initGame()
  }

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
              Memory Matrix
            </h1>
            <p className="text-gray-400 text-sm">Match pairs • Train your memory AI</p>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={initGame}
              className="px-4 py-2 bg-purple-500/20 border border-purple-500/50 text-purple-400 rounded-lg text-sm font-bold"
            >
              🔄 Restart
            </motion.button>
            <Link href="/games">
              <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 bg-[#1A1F3A] text-gray-300 rounded-lg text-sm">
                ← Back
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[
            { label: 'SCORE', value: score.toLocaleString(), color: 'yellow', icon: '⭐' },
            { label: 'MATCHES', value: `${matches}/${(gridSize * gridSize) / 2}`, color: 'green', icon: '✓' },
            { label: 'MOVES', value: moves, color: 'blue', icon: '👆' },
            { label: 'TIME', value: formatTime(timer), color: 'cyan', icon: '⏱️' },
            { label: 'STREAK', value: streak, color: 'orange', icon: '🔥' },
            { label: 'COMBO', value: `${combo}x`, color: 'pink', icon: '💥' },
            { label: 'LEVEL', value: level, color: 'purple', icon: '📊' },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/5 rounded-xl p-2 border border-${stat.color}-500/30 text-center`}>
              <div className="text-xs text-gray-400">{stat.icon} {stat.label}</div>
              <div className="text-lg font-black text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Game Complete Overlay */}
        <AnimatePresence>
          {gameComplete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-gradient-to-br from-purple-900 to-pink-900 p-8 rounded-3xl border-2 border-purple-500 text-center max-w-md"
              >
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-3xl font-black text-white mb-2">Level Complete!</h2>
                <p className="text-purple-300 mb-4">Amazing memory skills!</p>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-black/30 p-3 rounded-xl">
                    <div className="text-gray-400 text-sm">Score</div>
                    <div className="text-2xl font-black text-yellow-400">{score.toLocaleString()}</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl">
                    <div className="text-gray-400 text-sm">Time</div>
                    <div className="text-2xl font-black text-cyan-400">{formatTime(timer)}</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl">
                    <div className="text-gray-400 text-sm">Moves</div>
                    <div className="text-2xl font-black text-blue-400">{moves}</div>
                  </div>
                  <div className="bg-black/30 p-3 rounded-xl">
                    <div className="text-gray-400 text-sm">Best Streak</div>
                    <div className="text-2xl font-black text-orange-400">{bestStreak}</div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={nextLevel}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl"
                  >
                    Next Level →
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    onClick={initGame}
                    className="flex-1 py-3 bg-gray-700 text-white font-bold rounded-xl"
                  >
                    Replay
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-12 gap-4">
          {/* Card Grid */}
          <div className="col-span-8">
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <div
                className="grid gap-3 mx-auto"
                style={{
                  gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
                  maxWidth: gridSize * 85 + (gridSize - 1) * 12
                }}
              >
                {cards.map((card, index) => (
                  <motion.button
                    key={card.id}
                    onClick={() => handleCardClick(index)}
                    whileHover={{ scale: card.isMatched ? 1 : 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      rotateY: card.isFlipped || card.isMatched ? 180 : 0,
                      opacity: card.isMatched ? 0.3 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                    disabled={card.isMatched}
                    className={`aspect-square rounded-xl relative overflow-hidden transition-all ${card.isMatched
                        ? 'bg-green-500/20 border-2 border-green-500/50'
                        : card.isFlipped
                          ? 'border-2'
                          : 'bg-gradient-to-br from-[#1A1F3A] to-[#252B45] border-2 border-[#2A2F4A] hover:border-purple-500/50'
                      }`}
                    style={{
                      borderColor: card.isFlipped && !card.isMatched ? card.color : undefined,
                      boxShadow: card.isFlipped && !card.isMatched ? `0 0 20px ${card.color}40` : undefined
                    }}
                  >
                    {/* Card Back */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${card.isFlipped || card.isMatched ? 'opacity-0' : 'opacity-100'
                        }`}
                    >
                      <div className="text-3xl text-gray-600">?</div>
                    </div>

                    {/* Card Front */}
                    <div
                      className={`absolute inset-0 flex items-center justify-center transition-opacity ${card.isFlipped || card.isMatched ? 'opacity-100' : 'opacity-0'
                        }`}
                      style={{ transform: 'rotateY(180deg)' }}
                    >
                      <span className="text-4xl" style={{ color: card.color }}>{card.icon}</span>
                    </div>

                    {/* Match glow effect */}
                    {card.isMatched && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 rounded-xl border-2 border-green-400"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Side Panel */}
          <div className="col-span-4 space-y-4">
            {/* Performance */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-4">
              <h3 className="text-lg font-bold text-white mb-3">📊 Performance</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Accuracy</span>
                    <span className="text-white font-bold">{moves > 0 ? Math.round((matches / moves) * 100) : 0}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                      animate={{ width: `${moves > 0 ? (matches / moves) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">Progress</span>
                    <span className="text-white font-bold">{Math.round((matches / ((gridSize * gridSize) / 2)) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      animate={{ width: `${(matches / ((gridSize * gridSize) / 2)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/30 p-4">
              <h3 className="text-lg font-bold text-white mb-2">💡 Tips</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Match quickly for combo bonus!</li>
                <li>• Streak bonus increases each match</li>
                <li>• Remember card positions carefully</li>
              </ul>
            </div>

            {/* AI Training */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/30 p-4">
              <h3 className="text-lg font-bold text-white mb-2">🤖 AI Training</h3>
              <p className="text-gray-400 text-xs mb-3">{trainingData.length} actions recorded</p>
              <div className="flex gap-2 text-xs mb-3">
                <span className="text-green-400">Matches: {trainingData.filter(t => t.action === 'match').length}</span>
                <span className="text-red-400">Misses: {trainingData.filter(t => t.action === 'miss').length}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                disabled={trainingData.length < 10 || isTraining}
                onClick={async () => {
                  setIsTraining(true)
                  toast.loading('Starting AI training...', { id: 'train' })
                  try {
                    await fetch('http://localhost:8000/training/start', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ gameType: 'memory', gameplayData: trainingData })
                    })
                    toast.dismiss('train')
                    toast.success('Training started!')
                  } catch {
                    toast.dismiss('train')
                    toast.error('Backend not connected')
                    setIsTraining(false)
                  }
                }}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm"
              >
                {trainingData.length < 10 ? `${trainingData.length}/10 actions` : '🚀 Train AI'}
              </motion.button>
            </div>

            {/* Difficulty */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-4">
              <h3 className="text-sm font-bold text-gray-400 mb-2">🎮 DIFFICULTY</h3>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button
                    key={d}
                    onClick={() => {
                      setDifficulty(d)
                      setGridSize(d === 'easy' ? 4 : d === 'medium' ? 6 : 6)
                      initGame()
                    }}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${difficulty === d
                        ? 'bg-purple-500 text-white'
                        : 'bg-[#1A1F3A] text-gray-400 hover:bg-[#252B45]'
                      }`}
                  >
                    {d.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
