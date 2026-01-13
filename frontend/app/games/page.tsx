'use client'

import { useState } from 'react'
import { Navbar } from '../components/Navbar'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  CodeIcon,
  CubeIcon,
  ShareIcon,
  ZapIcon,
  RocketIcon,
  SparklesIcon,
  TerminalIcon
} from '../components/Icons'

const games = [
  {
    id: 'racing',
    name: 'Cyber Velocity',
    description: 'High-speed autonomous racing. Train neural networks to optimize racing lines and braking points.',
    image: '/images/cover-racing.png',
    deployAs: 'Trading Agent',
    difficulty: 'Medium',
    users: '12.5k',
    features: ['Risk Management', 'Timing', 'Reaction Speed']
  },
  {
    id: 'battle',
    name: 'Steel Colosseum',
    description: 'Turn-based mech combat. Teach your agent to manage energy, choose counters, and predict enemy moves.',
    image: '/images/cover-battle.png',
    deployAs: 'Yield Farming Agent',
    difficulty: 'Hard',
    users: '8.2k',
    features: ['Resource Allocation', 'Strategy', 'Prediction']
  },
  {
    id: 'puzzle',
    name: 'Crypto Clicker',
    description: 'Addictive idle mining game. Click to earn, upgrade to multiply. Train AI on optimal resource allocation patterns.',
    image: '/images/cover-clicker.png',
    deployAs: 'Portfolio Manager',
    difficulty: 'Easy',
    users: '45k',
    features: ['Resource Management', 'Timing', 'Optimization']
  },
  {
    id: 'trading',
    name: 'New Eden Trading',
    description: 'Simulate high-frequency trading in a volatile market. Train AI to read holographic charts and execute swaps.',
    image: '/images/cover-trading.png',
    deployAs: 'Automated Trader',
    difficulty: 'Expert',
    users: '18.4k',
    features: ['Market Analysis', 'Portfolio', 'Execution']
  },
  {
    id: 'memory',
    name: 'Memory Matrix',
    description: 'Cyberpunk sequence recall. Enhance agent memory for time-series analysis and historical data tracking.',
    image: '/images/cover-memory.png',
    deployAs: 'Analysis Agent',
    difficulty: 'Easy',
    users: '22k',
    features: ['Sequence Learning', 'Memory', 'Focus']
  },
  {
    id: 'card',
    name: 'Cyber Hold\'em',
    description: 'High-stakes probability calculation. Train agents to assess risk and make calculated bets under uncertainty.',
    image: '/images/cover-card.png',
    deployAs: 'Risk Assessment Agent',
    difficulty: 'Medium',
    users: '32k',
    features: ['Probability', 'Risk Calc', 'Game Theory']
  }
]

export default function GamesPage() {
  const [hoveredGame, setHoveredGame] = useState<string | null>(null)

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[20%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[40%] bg-arbitrum-cyan/10 rounded-full blur-[120px]" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <motion.h1
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-tight"
            >
              Game Library
            </motion.h1>
            <motion.p
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-400 max-w-2xl"
            >
              Select a simulation to train your specific AI architecture.
              Gameplay data directly impacts agent performance on-chain.
            </motion.p>
          </div>

          <div className="flex gap-2">
            {['All', 'Strategy', 'Action', 'Puzzle'].map((filter, i) => (
              <button
                key={filter}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${i === 0 ? 'bg-arbitrum-cyan text-[#0A0E27]' : 'bg-[#1A1F3A] text-gray-400 hover:bg-[#252B45]'}`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Game (First Item) */}
        <div className="mb-16">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="relative rounded-3xl overflow-hidden border border-[#2A2F4A] group cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E27] via-[#0A0E27]/80 to-transparent z-10" />
            <div className="absolute inset-0 z-0">
              <Image src={games[0].image} alt={games[0].name} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
            </div>

            <div className="relative z-20 p-8 md:p-12 flex flex-col justify-center h-[500px] max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/20 border border-yellow-500/40 rounded-lg text-yellow-400 text-sm font-bold mb-6 w-fit">
                <SparklesIcon className="w-4 h-4" />
                Featured Simulation
              </div>
              <h2 className="text-5xl font-bold text-white mb-4">{games[0].name}</h2>
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                {games[0].description} Using cutting-edge physical simulation to train agents in risk management and high-speed decision making.
              </p>
              <div className="flex items-center gap-4">
                <Link href={`/games/${games[0].id}`}>
                  <button className="px-8 py-4 bg-white text-[#0A0E27] font-bold rounded-xl text-lg hover:bg-gray-100 transition-all flex items-center gap-2">
                    <RocketIcon className="w-5 h-5" />
                    Start Training
                  </button>
                </Link>
                <div className="px-6 py-4 bg-[#1A1F3A]/80 backdrop-blur-md rounded-xl border border-[#2A2F4A] text-gray-300">
                  <span className="text-xs uppercase tracking-wider text-gray-500 block">Deployable As</span>
                  <span className="font-semibold text-arbitrum-cyan">{games[0].deployAs}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {games.slice(1).map((game, idx) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              onMouseEnter={() => setHoveredGame(game.id)}
              onMouseLeave={() => setHoveredGame(null)}
              className="group relative bg-[#151a30] rounded-2xl border border-[#2A2F4A] overflow-hidden hover:border-arbitrum-cyan/50 hover:shadow-2xl hover:shadow-arbitrum-cyan/10 transition-all duration-300"
            >
              {/* Image Header */}
              <div className="h-48 relative overflow-hidden">
                <Image
                  src={game.image}
                  alt={game.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#151a30] to-transparent" />

                {/* Overlay Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-black/60 backdrop-blur-md rounded-lg border border-white/10 text-xs font-semibold text-white">
                  {game.users} Active
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-arbitrum-cyan transition-colors">{game.name}</h3>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                      {game.difficulty}
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-[#1A1F3A] flex items-center justify-center border border-[#2A2F4A] group-hover:border-arbitrum-cyan group-hover:bg-arbitrum-cyan/10 transition-all">
                    <RocketIcon className="w-5 h-5 text-gray-400 group-hover:text-arbitrum-cyan" />
                  </div>
                </div>

                <p className="text-gray-400 text-sm mb-6 line-clamp-2 h-10">
                  {game.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {game.features.slice(0, 2).map((feature, i) => (
                    <span key={i} className="text-xs text-gray-500 bg-[#0A0E27] px-2 py-1 rounded border border-[#1A1F3A]">
                      {feature}
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 bg-[#0A0E27] px-2 py-1 rounded border border-[#1A1F3A]">+1</span>
                </div>

                {/* Footer Action */}
                <div className="pt-4 border-t border-[#2A2F4A] flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase text-gray-500 tracking-wider font-semibold">Rewards</span>
                    <span className="text-sm font-bold text-white">Stylus Agents</span>
                  </div>
                  <Link href={`/games/${game.id}`}>
                    <button className="px-4 py-2 bg-white text-[#0A0E27] text-sm font-bold rounded-lg hover:bg-gray-200 transition-colors">
                      Play Now
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  )
}

