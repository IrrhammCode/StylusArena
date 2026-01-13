'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GameAudio } from '../../../lib/gameAudio'

// Card suits and values
const SUITS = ['♠', '♥', '♦', '♣']
const SUIT_COLORS: Record<string, string> = { '♠': '#1a1a2e', '♥': '#e63946', '♦': '#e63946', '♣': '#1a1a2e' }
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

interface Card {
  suit: string
  value: string
  numValue: number
}

interface HandResult {
  name: string
  rank: number
  score: number
}

export default function PokerGamePage() {
  const gameAudioRef = useRef<GameAudio | null>(null)
  const [playerHand, setPlayerHand] = useState<Card[]>([])
  const [dealerHand, setDealerHand] = useState<Card[]>([])
  const [communityCards, setCommunityCards] = useState<Card[]>([])
  const [chips, setChips] = useState(1000)
  const [currentBet, setCurrentBet] = useState(0)
  const [pot, setPot] = useState(0)
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState<'betting' | 'flop' | 'turn' | 'river' | 'showdown' | 'result'>('betting')
  const [wins, setWins] = useState(0)
  const [losses, setLosses] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [result, setResult] = useState<{ winner: 'player' | 'dealer' | 'tie', message: string } | null>(null)
  const [playerHandResult, setPlayerHandResult] = useState<HandResult | null>(null)
  const [dealerHandResult, setDealerHandResult] = useState<HandResult | null>(null)
  const [showDealerCards, setShowDealerCards] = useState(false)

  // Training data
  interface TrainingData {
    timestamp: number
    action: 'bet' | 'fold' | 'call' | 'raise' | 'check'
    handStrength: number
    potOdds: number
    phase: string
    result?: string
  }
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [isTraining, setIsTraining] = useState(false)

  // Initialize audio
  useEffect(() => {
    gameAudioRef.current = new GameAudio()
    return () => { gameAudioRef.current?.cleanup() }
  }, [])

  // Create deck
  const createDeck = useCallback((): Card[] => {
    const deck: Card[] = []
    SUITS.forEach(suit => {
      VALUES.forEach((value, i) => {
        deck.push({ suit, value, numValue: i + 2 })
      })
    })
    // Shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]]
    }
    return deck
  }, [])

  // Evaluate hand (simplified)
  const evaluateHand = (cards: Card[]): HandResult => {
    const values = cards.map(c => c.numValue).sort((a, b) => b - a)
    const suits = cards.map(c => c.suit)

    const valueCounts: Record<number, number> = {}
    values.forEach(v => { valueCounts[v] = (valueCounts[v] || 0) + 1 })
    const counts = Object.values(valueCounts).sort((a, b) => b - a)

    const isFlush = suits.every(s => s === suits[0])
    const isStraight = values.every((v, i) => i === 0 || values[i - 1] - v === 1)

    // Determine hand rank
    if (isFlush && isStraight && values[0] === 14) return { name: 'Royal Flush', rank: 10, score: 1000 }
    if (isFlush && isStraight) return { name: 'Straight Flush', rank: 9, score: 900 }
    if (counts[0] === 4) return { name: 'Four of a Kind', rank: 8, score: 800 }
    if (counts[0] === 3 && counts[1] === 2) return { name: 'Full House', rank: 7, score: 700 }
    if (isFlush) return { name: 'Flush', rank: 6, score: 600 }
    if (isStraight) return { name: 'Straight', rank: 5, score: 500 }
    if (counts[0] === 3) return { name: 'Three of a Kind', rank: 4, score: 400 }
    if (counts[0] === 2 && counts[1] === 2) return { name: 'Two Pair', rank: 3, score: 300 }
    if (counts[0] === 2) return { name: 'One Pair', rank: 2, score: 200 }
    return { name: 'High Card', rank: 1, score: values[0] * 10 }
  }

  // Start new hand
  const startNewHand = useCallback(() => {
    const deck = createDeck()
    setPlayerHand([deck[0], deck[1]])
    setDealerHand([deck[2], deck[3]])
    setCommunityCards([deck[4], deck[5], deck[6], deck[7], deck[8]])
    setPhase('betting')
    setCurrentBet(0)
    setPot(0)
    setResult(null)
    setPlayerHandResult(null)
    setDealerHandResult(null)
    setShowDealerCards(false)
  }, [createDeck])

  // Initialize
  useEffect(() => {
    startNewHand()
  }, [startNewHand])

  // Place bet
  const placeBet = (amount: number) => {
    if (chips < amount) {
      toast.error('Not enough chips!')
      return
    }
    setChips(c => c - amount)
    setCurrentBet(b => b + amount)
    setPot(p => p + amount * 2) // Dealer matches
    gameAudioRef.current?.playSound('coin')

    setTrainingData(prev => [...prev, {
      timestamp: Date.now(),
      action: 'bet',
      handStrength: evaluateHand([...playerHand]).rank,
      potOdds: pot > 0 ? amount / pot : 0,
      phase
    }])
  }

  // Advance phase
  const advancePhase = () => {
    if (phase === 'betting') {
      setPhase('flop')
      gameAudioRef.current?.playSound('success')
    } else if (phase === 'flop') {
      setPhase('turn')
      gameAudioRef.current?.playSound('success')
    } else if (phase === 'turn') {
      setPhase('river')
      gameAudioRef.current?.playSound('success')
    } else if (phase === 'river') {
      setPhase('showdown')
      setShowDealerCards(true)

      // Evaluate final hands
      const playerFinal = [...playerHand, ...communityCards]
      const dealerFinal = [...dealerHand, ...communityCards]

      const playerResult = evaluateHand(playerFinal)
      const dealerResult = evaluateHand(dealerFinal)

      setPlayerHandResult(playerResult)
      setDealerHandResult(dealerResult)

      setTimeout(() => {
        if (playerResult.score > dealerResult.score) {
          setChips(c => c + pot)
          setWins(w => w + 1)
          setStreak(s => {
            const newStreak = s + 1
            if (newStreak > bestStreak) setBestStreak(newStreak)
            return newStreak
          })
          setResult({ winner: 'player', message: `You win with ${playerResult.name}!` })
          gameAudioRef.current?.playSound('levelup')
          toast.success(`🎉 You win $${pot}!`)
        } else if (dealerResult.score > playerResult.score) {
          setLosses(l => l + 1)
          setStreak(0)
          setResult({ winner: 'dealer', message: `Dealer wins with ${dealerResult.name}` })
          gameAudioRef.current?.playSound('error')
          toast.error(`Dealer wins with ${dealerResult.name}`)
        } else {
          setChips(c => c + pot / 2)
          setResult({ winner: 'tie', message: 'Tie!' })
          toast('🤝 Tie game!')
        }
        setPhase('result')
        setRound(r => r + 1)
      }, 1500)
    }
  }

  // Fold
  const fold = () => {
    setLosses(l => l + 1)
    setStreak(0)
    setResult({ winner: 'dealer', message: 'You folded' })
    setPhase('result')
    setRound(r => r + 1)
    gameAudioRef.current?.playSound('error')
    toast('🏳️ Folded')

    setTrainingData(prev => [...prev, {
      timestamp: Date.now(),
      action: 'fold',
      handStrength: evaluateHand([...playerHand]).rank,
      potOdds: pot > 0 ? currentBet / pot : 0,
      phase
    }])
  }

  // Card component
  const CardDisplay = ({ card, hidden = false, delay = 0 }: { card: Card; hidden?: boolean; delay?: number }) => (
    <motion.div
      initial={{ rotateY: 180, scale: 0.8 }}
      animate={{ rotateY: hidden ? 180 : 0, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      className={`w-16 h-24 rounded-xl flex flex-col items-center justify-center font-bold relative overflow-hidden ${hidden
          ? 'bg-gradient-to-br from-indigo-600 to-purple-700'
          : 'bg-gradient-to-br from-white to-gray-100'
        } shadow-xl border-2 border-gray-300`}
    >
      {hidden ? (
        <div className="text-2xl text-white/50">🃏</div>
      ) : (
        <>
          <span className="text-xl" style={{ color: SUIT_COLORS[card.suit] }}>{card.value}</span>
          <span className="text-2xl" style={{ color: SUIT_COLORS[card.suit] }}>{card.suit}</span>
        </>
      )}
    </motion.div>
  )

  const getVisibleCommunityCards = () => {
    if (phase === 'betting') return 0
    if (phase === 'flop') return 3
    if (phase === 'turn') return 4
    return 5
  }

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-purple-500">
              Cyber Hold'em
            </h1>
            <p className="text-gray-400 text-sm">Texas Hold'em Poker • Train Risk AI</p>
          </div>
          <Link href="/games">
            <motion.button whileHover={{ scale: 1.05 }} className="px-4 py-2 bg-[#1A1F3A] text-gray-300 rounded-lg text-sm">
              ← Back
            </motion.button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[
            { label: 'CHIPS', value: `$${chips}`, color: 'yellow', icon: '💰' },
            { label: 'POT', value: `$${pot}`, color: 'green', icon: '🎰' },
            { label: 'ROUND', value: round, color: 'blue', icon: '🎲' },
            { label: 'WINS', value: wins, color: 'emerald', icon: '✓' },
            { label: 'LOSSES', value: losses, color: 'red', icon: '✗' },
            { label: 'STREAK', value: streak, color: 'orange', icon: '🔥' },
            { label: 'PHASE', value: phase.toUpperCase(), color: 'purple', icon: '📍' },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/5 rounded-xl p-2 border border-${stat.color}-500/30 text-center`}>
              <div className="text-xs text-gray-400">{stat.icon} {stat.label}</div>
              <div className="text-lg font-black text-white">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Game Table */}
        <div className="bg-gradient-to-br from-[#0d4f32] via-[#0a3d28] to-[#072a1c] rounded-3xl p-8 mb-4 border-4 border-[#1a6b47] relative overflow-hidden">
          {/* Felt texture overlay */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, transparent 0%, rgba(0,0,0,0.3) 100%)' }} />

          {/* Dealer Area */}
          <div className="text-center mb-8 relative z-10">
            <div className="text-sm text-green-300 mb-2 font-bold">DEALER</div>
            <div className="flex justify-center gap-2">
              {dealerHand.map((card, i) => (
                <CardDisplay key={i} card={card} hidden={!showDealerCards} delay={i * 0.1} />
              ))}
            </div>
            {dealerHandResult && showDealerCards && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 px-3 py-1 bg-red-500/80 rounded-lg text-white text-sm inline-block"
              >
                {dealerHandResult.name}
              </motion.div>
            )}
          </div>

          {/* Community Cards */}
          <div className="flex justify-center gap-3 mb-8">
            {communityCards.slice(0, getVisibleCommunityCards()).map((card, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15 }}
              >
                <CardDisplay card={card} delay={i * 0.1} />
              </motion.div>
            ))}
            {[...Array(5 - getVisibleCommunityCards())].map((_, i) => (
              <div key={`empty-${i}`} className="w-16 h-24 rounded-xl bg-[#0a3d28] border-2 border-dashed border-green-700/50" />
            ))}
          </div>

          {/* Pot Display */}
          <div className="text-center mb-8">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="inline-block px-6 py-2 bg-black/40 rounded-full border border-yellow-500/50"
            >
              <span className="text-yellow-400 font-black text-xl">💰 POT: ${pot}</span>
            </motion.div>
          </div>

          {/* Player Area */}
          <div className="text-center relative z-10">
            <div className="flex justify-center gap-2 mb-2">
              {playerHand.map((card, i) => (
                <CardDisplay key={i} card={card} delay={i * 0.1} />
              ))}
            </div>
            {playerHandResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 px-3 py-1 bg-green-500/80 rounded-lg text-white text-sm inline-block"
              >
                {playerHandResult.name}
              </motion.div>
            )}
            <div className="text-sm text-green-300 mt-2 font-bold">YOUR HAND</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mb-4">
          {phase !== 'result' && phase !== 'showdown' && (
            <>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fold}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-bold rounded-xl shadow-lg"
              >
                FOLD
              </motion.button>

              {phase === 'betting' ? (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { placeBet(10); advancePhase() }}
                    className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-xl shadow-lg"
                  >
                    BET $10
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { placeBet(50); advancePhase() }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-xl shadow-lg"
                  >
                    BET $50
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { placeBet(100); advancePhase() }}
                    className="px-8 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold rounded-xl shadow-lg"
                  >
                    BET $100
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={advancePhase}
                    className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg"
                  >
                    CHECK
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { placeBet(currentBet || 10); advancePhase() }}
                    className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-lg"
                  >
                    RAISE
                  </motion.button>
                </>
              )}
            </>
          )}

          {phase === 'result' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={startNewHand}
              className="px-12 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-xl rounded-xl shadow-lg"
            >
              🃏 DEAL NEW HAND
            </motion.button>
          )}
        </div>

        {/* Result Banner */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-center py-4 rounded-xl mb-4 ${result.winner === 'player' ? 'bg-green-500/20 border border-green-500/50' :
                  result.winner === 'dealer' ? 'bg-red-500/20 border border-red-500/50' :
                    'bg-yellow-500/20 border border-yellow-500/50'
                }`}
            >
              <span className="text-2xl font-black text-white">{result.message}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Training */}
        <div className="bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-2xl border border-pink-500/30 p-4">
          <div className="flex items-center gap-4">
            <div className="text-3xl">🤖</div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white">AI Training: {trainingData.length} decisions recorded</h3>
              <div className="flex gap-4 text-xs text-gray-400 mt-1">
                <span>Bets: {trainingData.filter(t => t.action === 'bet').length}</span>
                <span>Folds: {trainingData.filter(t => t.action === 'fold').length}</span>
                <span className="text-yellow-400">Win Rate: {wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0}%</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              disabled={trainingData.length < 5 || isTraining}
              onClick={async () => {
                setIsTraining(true)
                toast.loading('Starting AI training...', { id: 'train' })
                try {
                  await fetch('http://localhost:8000/training/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ gameType: 'poker', gameplayData: trainingData })
                  })
                  toast.dismiss('train')
                  toast.success('Training started!')
                } catch {
                  toast.dismiss('train')
                  toast.error('Backend not connected')
                  setIsTraining(false)
                }
              }}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-red-500 disabled:opacity-50 text-white font-bold rounded-xl"
            >
              {trainingData.length < 5 ? `${trainingData.length}/5 hands` : '🚀 Train AI'}
            </motion.button>
          </div>
        </div>
      </main>
    </div>
  )
}
