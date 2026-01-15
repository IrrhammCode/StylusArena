'use client'

import { useEffect, useRef, useState } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { GameAudio } from '../../../lib/gameAudio'

// Crypto assets
const ASSETS = [
  { id: 'BTC', name: 'Bitcoin', icon: '₿', color: '#F7931A', basePrice: 45000 },
  { id: 'ETH', name: 'Ethereum', icon: 'Ξ', color: '#627EEA', basePrice: 2500 },
  { id: 'ARB', name: 'Arbitrum', icon: '◆', color: '#28A0F0', basePrice: 1.5 },
]

interface Trade {
  asset: string
  type: 'buy' | 'sell'
  price: number
  amount: number
  timestamp: number
  profit?: number
}

interface Position {
  asset: string
  amount: number
  avgPrice: number
}

export default function TradingGamePage() {
  const gameAudioRef = useRef<GameAudio | null>(null)
  const [cash, setCash] = useState(10000)
  const [startingCash] = useState(10000)
  const [selectedAsset, setSelectedAsset] = useState(ASSETS[0])
  const [prices, setPrices] = useState<Record<string, number[]>>({
    BTC: [45000],
    ETH: [2500],
    ARB: [1.5],
  })
  const [positions, setPositions] = useState<Position[]>([])
  const [trades, setTrades] = useState<Trade[]>([])
  const [tradeAmount, setTradeAmount] = useState(1)
  const [totalPnL, setTotalPnL] = useState(0)
  const [winRate, setWinRate] = useState(0)
  const [bestTrade, setBestTrade] = useState(0)
  const [worstTrade, setWorstTrade] = useState(0)
  const [streak, setStreak] = useState(0)
  const [level, setLevel] = useState(1)
  const [xp, setXp] = useState(0)

  // Market indicators
  const [trend, setTrend] = useState<'bull' | 'bear' | 'neutral'>('neutral')
  const [volatility, setVolatility] = useState<'low' | 'medium' | 'high'>('medium')
  const [sentiment, setSentiment] = useState(50)

  // Training data
  interface TrainingData {
    timestamp: number
    action: 'buy' | 'sell' | 'hold'
    asset: string
    price: number
    indicators: { trend: string; volatility: string; sentiment: number }
    portfolio: { cash: number; positions: Position[] }
    result?: { profit: number }
  }
  const [trainingData, setTrainingData] = useState<TrainingData[]>([])
  const [isTraining, setIsTraining] = useState(false)

  // AI Autopilot State
  const [isAIPlaying, setIsAIPlaying] = useState(false)

  // Initialize
  useEffect(() => {
    gameAudioRef.current = new GameAudio()
    return () => { gameAudioRef.current?.cleanup() }
  }, [])

  // Price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const newPrices = { ...prev }

        ASSETS.forEach(asset => {
          const currentPrices = prev[asset.id]
          const lastPrice = currentPrices[currentPrices.length - 1]

          // Calculate new price with trend influence
          const trendFactor = trend === 'bull' ? 0.002 : trend === 'bear' ? -0.002 : 0
          const volFactor = volatility === 'high' ? 0.05 : volatility === 'low' ? 0.01 : 0.025
          const change = (Math.random() - 0.5) * volFactor + trendFactor
          const newPrice = Math.max(lastPrice * 0.5, lastPrice * (1 + change))

          newPrices[asset.id] = [...currentPrices.slice(-59), newPrice]
        })

        return newPrices
      })

      // Random market events
      if (Math.random() < 0.05) {
        const events = [
          { msg: '📰 Positive news! Market sentiment rising', effect: () => { setTrend('bull'); setSentiment(s => Math.min(100, s + 20)) } },
          { msg: '📉 Whale selling! Market dipping', effect: () => { setTrend('bear'); setSentiment(s => Math.max(0, s - 20)) } },
          { msg: '⚡ High volatility detected!', effect: () => setVolatility('high') },
          { msg: '😴 Low volatility period', effect: () => setVolatility('low') },
        ]
        const event = events[Math.floor(Math.random() * events.length)]
        toast(event.msg, { icon: '📊' })
        event.effect()
        setTimeout(() => {
          setTrend('neutral')
          setVolatility('medium')
        }, 10000)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [trend, volatility])

  // Get current price helper
  const getCurrentPrice = (assetId: string) => {
    const assetPrices = prices[assetId]
    return assetPrices ? assetPrices[assetPrices.length - 1] : 0
  }

  // Calculate portfolio value and PnL
  useEffect(() => {
    let portfolioValue = cash
    positions.forEach(pos => {
      const currentPrice = prices[pos.asset]?.[prices[pos.asset].length - 1] || 0
      portfolioValue += pos.amount * currentPrice
    })
    setTotalPnL(portfolioValue - startingCash)

    // Level up
    const newLevel = Math.floor(totalPnL / 1000) + 1
    if (newLevel > level && newLevel > 0) {
      setLevel(newLevel)
      gameAudioRef.current?.playSound('levelup')
      toast.success(`🎉 Level ${newLevel}! Trading mastery increased!`)
    }
  }, [cash, positions, prices, startingCash, level, totalPnL]) // Removed getCurrentPrice from dep array as it's a function

  // Execute trade
  const executeTrade = (type: 'buy' | 'sell') => {
    const price = getCurrentPrice(selectedAsset.id)
    const cost = price * tradeAmount

    if (type === 'buy') {
      if (cash < cost) {
        if (!isAIPlaying) {
          toast.error('Insufficient funds!')
          gameAudioRef.current?.playSound('error')
        }
        return
      }

      setCash(c => c - cost)
      setPositions(prev => {
        const existing = prev.find(p => p.asset === selectedAsset.id)
        if (existing) {
          const newAmount = existing.amount + tradeAmount
          const newAvgPrice = (existing.avgPrice * existing.amount + price * tradeAmount) / newAmount
          return prev.map(p => p.asset === selectedAsset.id ? { ...p, amount: newAmount, avgPrice: newAvgPrice } : p)
        }
        return [...prev, { asset: selectedAsset.id, amount: tradeAmount, avgPrice: price }]
      })

      setTrades(prev => [...prev, { asset: selectedAsset.id, type: 'buy', price, amount: tradeAmount, timestamp: Date.now() }])
      gameAudioRef.current?.playSound('success')
      if (!isAIPlaying) toast.success(`Bought ${tradeAmount} ${selectedAsset.id} @ $${price.toFixed(2)}`)
      setXp(x => x + 10)

    } else {
      const position = positions.find(p => p.asset === selectedAsset.id)
      if (!position || position.amount < tradeAmount) {
        if (!isAIPlaying) {
          toast.error('Insufficient holdings!')
          gameAudioRef.current?.playSound('error')
        }
        return
      }

      const profit = (price - position.avgPrice) * tradeAmount
      setCash(c => c + cost)

      setPositions(prev => {
        return prev.map(p => {
          if (p.asset === selectedAsset.id) {
            const newAmount = p.amount - tradeAmount
            return newAmount <= 0 ? null : { ...p, amount: newAmount }
          }
          return p
        }).filter(Boolean) as Position[]
      })

      setTrades(prev => [...prev, { asset: selectedAsset.id, type: 'sell', price, amount: tradeAmount, timestamp: Date.now(), profit }])

      if (profit > 0) {
        setStreak(s => s + 1)
        if (profit > bestTrade) setBestTrade(profit)
        gameAudioRef.current?.playSound('coin')
        if (!isAIPlaying) toast.success(`Sold for +$${profit.toFixed(2)} profit! 🎉`)
        setXp(x => x + 25)
      } else {
        setStreak(0)
        if (profit < worstTrade) setWorstTrade(profit)
        gameAudioRef.current?.playSound('error')
        if (!isAIPlaying) toast.error(`Sold at -$${Math.abs(profit).toFixed(2)} loss`)
        setXp(x => x + 5)
      }

      // Update win rate
      const profitableTrades = trades.filter(t => t.profit && t.profit > 0).length + (profit > 0 ? 1 : 0)
      const totalSells = trades.filter(t => t.type === 'sell').length + 1
      setWinRate(totalSells > 0 ? (profitableTrades / totalSells) * 100 : 0)
    }

    // Record training data
    setTrainingData(prev => [...prev, {
      timestamp: Date.now(),
      action: type,
      asset: selectedAsset.id,
      price,
      indicators: { trend, volatility, sentiment },
      portfolio: { cash, positions: [...positions] },
    }])
  }

  // AI Logic Loop
  useEffect(() => {
    if (!isAIPlaying) return

    const thinkInterval = setInterval(() => {
      // Randomly pick an asset
      const asset = ASSETS[Math.floor(Math.random() * ASSETS.length)]
      setSelectedAsset(asset)

      // Decision based on Trend & Sentiment
      const r = Math.random()
      const currentPrice = prices[asset.id]?.[prices[asset.id].length - 1] || 0

      if (trend === 'bull') {
        // 70% buy, 30% sell (take profit)
        if (r > 0.3) executeTrade('buy')
        else executeTrade('sell')
      } else if (trend === 'bear') {
        // 70% sell, 30% buy (dip buy)
        if (r > 0.3) executeTrade('sell')
        else executeTrade('buy')
      } else {
        // Neutral - Scalping
        if (r > 0.5) executeTrade('buy')
        else executeTrade('sell')
      }

    }, 1500) // Trade every 1.5 seconds

    return () => clearInterval(thinkInterval)
  }, [isAIPlaying, trend, volatility, cash, positions]) // Removed prices to avoid too frequent re-runs, let it use latest closure or stale is ok for "AI" variability

  // Draw mini chart
  const MiniChart = ({ assetId, height = 60 }: { assetId: string; height?: number }) => {
    const assetPrices = prices[assetId] || []
    if (assetPrices.length < 2) return null

    const min = Math.min(...assetPrices)
    const max = Math.max(...assetPrices)
    const range = max - min || 1

    const points = assetPrices.map((p, i) => {
      const x = (i / (assetPrices.length - 1)) * 100
      const y = ((max - p) / range) * height
      return `${x},${y}`
    }).join(' ')

    const lastPrice = assetPrices[assetPrices.length - 1]
    const firstPrice = assetPrices[0]
    const isUp = lastPrice >= firstPrice

    return (
      <svg width="100%" height={height} className="overflow-visible">
        <defs>
          <linearGradient id={`gradient-${assetId}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity="0.3" />
            <stop offset="100%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon
          points={`0,${height} ${points} 100,${height}`}
          fill={`url(#gradient-${assetId})`}
        />
        <polyline
          points={points}
          fill="none"
          stroke={isUp ? '#10B981' : '#EF4444'}
          strokeWidth="2"
        />
      </svg>
    )
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${(price / 1000).toFixed(1)}K`
    if (price >= 1) return `$${price.toFixed(2)}`
    return `$${price.toFixed(4)}`
  }

  const getPriceChange = (assetId: string) => {
    const assetPrices = prices[assetId] || []
    if (assetPrices.length < 2) return 0
    const first = assetPrices[0]
    const last = assetPrices[assetPrices.length - 1]
    return ((last - first) / first) * 100
  }

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              New Eden Trading
            </h1>
            <p className="text-gray-400 text-sm">Master the markets • Train your AI</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-lg">
              <span className="text-purple-400 text-sm font-bold">Level {level}</span>
              <span className="text-gray-500 text-xs ml-2">{xp} XP</span>
            </div>
            <Link href="/games">
              <motion.button whileHover={{ scale: 1.05 }} className="px-3 py-1 bg-[#1A1F3A] text-gray-300 rounded-lg text-sm">
                ← Back
              </motion.button>
            </Link>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {[
            { label: 'PORTFOLIO', value: `$${(cash + positions.reduce((a, p) => a + p.amount * getCurrentPrice(p.asset), 0)).toFixed(0)}`, color: 'cyan', icon: '💼' },
            { label: 'CASH', value: `$${cash.toFixed(0)}`, color: 'green', icon: '💵' },
            { label: 'P&L', value: `${totalPnL >= 0 ? '+' : ''}$${totalPnL.toFixed(0)}`, color: totalPnL >= 0 ? 'green' : 'red', icon: '📈' },
            { label: 'WIN RATE', value: `${winRate.toFixed(0)}%`, color: 'yellow', icon: '🎯' },
            { label: 'STREAK', value: streak, color: 'orange', icon: '🔥' },
            { label: 'BEST', value: `+$${bestTrade.toFixed(0)}`, color: 'emerald', icon: '🏆' },
            { label: 'TRADES', value: trades.length, color: 'purple', icon: '📊' },
          ].map((stat, i) => (
            <div key={i} className={`bg-gradient-to-br from-${stat.color}-500/20 to-${stat.color}-600/5 rounded-xl p-3 border border-${stat.color}-500/30`}>
              <div className="text-xs text-gray-400">{stat.icon} {stat.label}</div>
              <div className={`text-lg font-black ${stat.color === 'red' ? 'text-red-400' : 'text-white'}`}>{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Market Indicators */}
        <div className="flex gap-3 mb-4">
          <div className={`flex-1 p-3 rounded-xl border ${trend === 'bull' ? 'bg-green-500/10 border-green-500/50' : trend === 'bear' ? 'bg-red-500/10 border-red-500/50' : 'bg-gray-500/10 border-gray-500/30'}`}>
            <div className="text-xs text-gray-400 mb-1">📊 TREND</div>
            <div className={`font-bold ${trend === 'bull' ? 'text-green-400' : trend === 'bear' ? 'text-red-400' : 'text-gray-400'}`}>
              {trend === 'bull' ? '🐂 BULLISH' : trend === 'bear' ? '🐻 BEARISH' : '➡️ NEUTRAL'}
            </div>
          </div>
          <div className={`flex-1 p-3 rounded-xl border ${volatility === 'high' ? 'bg-red-500/10 border-red-500/50' : volatility === 'low' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
            <div className="text-xs text-gray-400 mb-1">⚡ VOLATILITY</div>
            <div className={`font-bold ${volatility === 'high' ? 'text-red-400' : volatility === 'low' ? 'text-blue-400' : 'text-yellow-400'}`}>
              {volatility.toUpperCase()}
            </div>
          </div>
          <div className="flex-1 p-3 rounded-xl border border-purple-500/30 bg-purple-500/10">
            <div className="text-xs text-gray-400 mb-1">💭 SENTIMENT</div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                  animate={{ width: `${sentiment}%` }}
                />
              </div>
              <span className="text-white font-bold text-sm">{sentiment}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Asset Selection & Chart */}
          <div className="col-span-8">
            {/* Asset Tabs */}
            <div className="flex gap-2 mb-3">
              {ASSETS.map(asset => {
                const change = getPriceChange(asset.id)
                return (
                  <motion.button
                    key={asset.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedAsset(asset)}
                    className={`flex-1 p-3 rounded-xl border transition-all ${selectedAsset.id === asset.id
                      ? 'bg-gradient-to-br from-blue-500/20 to-purple-500/10 border-blue-500/50'
                      : 'bg-[#0F1422] border-[#1A1F3A] hover:border-gray-500'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl" style={{ color: asset.color }}>{asset.icon}</span>
                      <span className={`text-sm font-bold ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                      </span>
                    </div>
                    <div className="text-white font-bold">{asset.id}</div>
                    <div className="text-gray-400 text-sm">{formatPrice(getCurrentPrice(asset.id))}</div>
                  </motion.button>
                )
              })}
            </div>

            {/* Main Chart */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-2xl mr-2" style={{ color: selectedAsset.color }}>{selectedAsset.icon}</span>
                  <span className="text-xl font-bold text-white">{selectedAsset.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-white">{formatPrice(getCurrentPrice(selectedAsset.id))}</div>
                  <div className={`text-sm font-bold ${getPriceChange(selectedAsset.id) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {getPriceChange(selectedAsset.id) >= 0 ? '▲' : '▼'} {Math.abs(getPriceChange(selectedAsset.id)).toFixed(2)}%
                  </div>
                </div>
              </div>
              <div className="h-48">
                <MiniChart assetId={selectedAsset.id} height={180} />
              </div>
            </div>

            {/* Trade Panel */}
            <div className="mt-4 bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Amount</label>
                  <input
                    type="number"
                    value={tradeAmount}
                    onChange={(e) => setTradeAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
                    className="w-full bg-[#1A1F3A] border border-[#2A2F4A] rounded-lg px-4 py-2 text-white font-bold focus:border-blue-500 outline-none"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 mb-1 block">Total Cost</label>
                  <div className="bg-[#1A1F3A] border border-[#2A2F4A] rounded-lg px-4 py-2 text-yellow-400 font-bold">
                    {formatPrice(getCurrentPrice(selectedAsset.id) * tradeAmount)}
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => executeTrade('buy')}
                  disabled={isAIPlaying}
                  className="px-8 py-3 bg-gradient-to-r from-green-500 to-emerald-500 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-green-500/30"
                >
                  BUY
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => executeTrade('sell')}
                  disabled={isAIPlaying}
                  className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 disabled:opacity-50 text-white font-black rounded-xl shadow-lg shadow-red-500/30"
                >
                  SELL
                </motion.button>
              </div>
            </div>
          </div>

          {/* Right Panel */}
          <div className="col-span-4 space-y-4">
            {/* Positions */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-4">
              <h3 className="text-lg font-bold text-white mb-3">📊 Positions</h3>
              {positions.length === 0 ? (
                <div className="text-gray-500 text-center py-4">No open positions</div>
              ) : (
                <div className="space-y-2">
                  {positions.map(pos => {
                    const currentPrice = getCurrentPrice(pos.asset)
                    const pnl = (currentPrice - pos.avgPrice) * pos.amount
                    const pnlPct = ((currentPrice - pos.avgPrice) / pos.avgPrice) * 100
                    return (
                      <div key={pos.asset} className="p-3 bg-[#1A1F3A] rounded-xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-white">{pos.asset}</span>
                          <span className={`font-bold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{formatPrice(pnl)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-400">
                          <span>{pos.amount.toFixed(2)} units @ {formatPrice(pos.avgPrice)}</span>
                          <span className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
                            {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Recent Trades */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-4 max-h-48 overflow-y-auto">
              <h3 className="text-lg font-bold text-white mb-3">📜 Recent Trades</h3>
              <div className="space-y-2">
                {trades.slice(-5).reverse().map((trade, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className={`font-bold ${trade.type === 'buy' ? 'text-green-400' : 'text-red-400'}`}>
                      {trade.type.toUpperCase()} {trade.amount} {trade.asset}
                    </span>
                    {trade.profit !== undefined && (
                      <span className={trade.profit >= 0 ? 'text-green-400' : 'text-red-400'}>
                        {trade.profit >= 0 ? '+' : ''}{formatPrice(trade.profit)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* AI Training & Autopilot */}
            <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl border border-purple-500/30 p-4 space-y-3">
              <h3 className="text-lg font-bold text-white mb-2">🤖 AI Capabilities</h3>

              {/* Autopilot Button */}
              <button
                onClick={() => setIsAIPlaying(!isAIPlaying)}
                className={`w-full py-2 font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${isAIPlaying
                  ? 'bg-purple-600 text-white shadow-[0_0_20px_rgba(147,51,234,0.5)] animate-pulse'
                  : 'bg-[#1A1F3A] text-gray-400 hover:bg-[#252B45] border border-[#2A2F4A]'
                  }`}
              >
                {isAIPlaying ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    AI TRADING (RECORDING...)
                  </>
                ) : (
                  <>
                    <span>🤖</span>
                    ENABLE AI AUTO-PILOT
                  </>
                )}
              </button>

              <div className="flex gap-2 text-xs mb-1">
                <span className="text-green-400">Buys: {trainingData.filter(t => t.action === 'buy').length}</span>
                <span className="text-red-400">Sells: {trainingData.filter(t => t.action === 'sell').length}</span>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                disabled={trainingData.length < 5 || isTraining}
                onClick={async () => {
                  setIsTraining(true)
                  toast.loading('Analyzing trading style...', { id: 'train' })
                  await new Promise(resolve => setTimeout(resolve, 1000));

                  // --- Real World Strategy Derivation ---
                  // 1. Calculate Metrics
                  const avgTradeSize = trainingData.reduce((sum, t) => sum + (t.price * (t.portfolio.positions.find(p => p.asset === t.asset)?.amount || 1)), 0) / trainingData.length
                  const riskScore = Math.min(10, Math.ceil((avgTradeSize / cash) * 100)) // 1-10 based on % of portfolio

                  // 2. Identify Strategy Type
                  let momentumScore = 0
                  let reversionScore = 0

                  trainingData.forEach(t => {
                    if (t.action === 'buy' && t.indicators.trend === 'bull') momentumScore++
                    if (t.action === 'sell' && t.indicators.trend === 'bear') momentumScore++

                    if (t.action === 'buy' && t.indicators.trend === 'bear') reversionScore++
                    if (t.action === 'sell' && t.indicators.trend === 'bull') reversionScore++
                  })

                  const strategyType = momentumScore > reversionScore ? 'Momentum Trend Follower' : 'Mean Reversion Scalper'

                  // 3. Generate Config
                  const realWorldConfig = {
                    agentName: "AlphaHunter Gen 1",
                    description: `Generated from ${trainingData.length} trades`,
                    parameters: {
                      riskTolerance: riskScore > 7 ? "High" : riskScore > 3 ? "Medium" : "Low",
                      strategy: strategyType,
                      rebalanceFrequency: trainingData.length > 20 ? "High (HFT)" : "Medium (Swing)",
                      assets: Array.from(new Set(trainingData.map(t => t.asset))),
                      stopLoss: riskScore > 7 ? "5%" : "2%",
                      takeProfit: riskScore > 7 ? "15%" : "5%"
                    },
                    timestamp: Date.now()
                  }

                  // 4. Save to LocalStorage for "Real World" deployment
                  localStorage.setItem('stylus_trading_strategy', JSON.stringify(realWorldConfig))

                  toast.dismiss('train')
                  const newTrainingId = 'train_' + Date.now();
                  // Save initial strategy config
                  localStorage.setItem('stylus_trading_strategy', JSON.stringify({
                    id: newTrainingId,
                    timestamp: Date.now(),
                    parameters: realWorldConfig.parameters // Use parameters from the generated realWorldConfig
                  }))

                  toast.success(`Strategy Generated: ${strategyType}`)

                  setTimeout(() => {
                    window.location.href = `/training?id=${newTrainingId}&type=trading`
                  }, 1000)
                }}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm"
              >
                {trainingData.length < 5 ? `${trainingData.length}/5 trades` : '🚀 Train AI Agent'}
              </motion.button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
