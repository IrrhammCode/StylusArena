'use client'

import { useState, useEffect, Suspense } from 'react'
import { Navbar } from '../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { 
  SearchIcon, 
  FilterIcon, 
  SparklesIcon, 
  ZapIcon, 
  TrophyIcon,
  CartIcon
} from '../components/Icons'

interface Agent {
  id: string
  name: string
  gameType: string
  performance: {
    accuracy: number
    winRate: number
    avgScore: number
  }
  price: number
  owner: string
  deployed: boolean
  contractAddress?: string
  rarity?: 'common' | 'rare' | 'legendary'
  likes?: number
}

function MarketplaceContent() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    // Fetch from localStorage
    const deployed = JSON.parse(localStorage.getItem('stylus_deployed_agents') || '[]')

    const getRandomRarity = () => {
       const r = Math.random();
       if (r > 0.9) return 'legendary';
       if (r > 0.6) return 'rare';
       return 'common';
    }

    // Map to Agent interface
    const formattedAgents = deployed.map((d: any) => ({
      id: d.id,
      name: d.gameType === 'racing' ? 'Cyber Racer X' : 'Logic Core v9',
      gameType: d.gameType,
      performance: {
        accuracy: d.accuracy || 0.9,
        winRate: 0.85, 
        avgScore: 1250 
      },
      price: 0.1 + (Math.random() * 0.5), 
      owner: d.contractAddress.slice(0, 8) + '...',
      deployed: true,
      contractAddress: d.contractAddress,
      rarity: getRandomRarity(),
      likes: Math.floor(Math.random() * 200)
    }))

    // Merge with some "demo" agents if list is empty
    if (formattedAgents.length === 0) {
      setAgents([
        {
          id: '1',
          name: 'Apex Predator V1',
          gameType: 'battle',
          performance: { accuracy: 0.98, winRate: 0.92, avgScore: 2400 },
          price: 1.5,
          owner: '0xAlice',
          deployed: true,
          contractAddress: '0xABCD...EFGH',
          rarity: 'legendary',
          likes: 342
        },
        {
          id: '2',
          name: 'Grid Runner 77',
          gameType: 'racing',
          performance: { accuracy: 0.92, winRate: 0.85, avgScore: 1100 },
          price: 0.45,
          owner: '0xBob',
          deployed: true,
          contractAddress: '0x1234...5678',
          rarity: 'rare',
          likes: 89
        },
        {
          id: '3',
          name: 'Logic Master',
          gameType: 'puzzle',
          performance: { accuracy: 0.88, winRate: 0.75, avgScore: 850 },
          price: 0.15,
          owner: '0xCharlie',
          deployed: true,
          contractAddress: '0x9999...8888',
          rarity: 'common',
          likes: 42
        },
      ])
    } else {
      setAgents(formattedAgents)
    }
    setIsLoading(false)
  }, [])

  const filteredAgents = filter === 'all' ? agents : agents.filter(a => a.gameType === filter || a.rarity === filter)

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-[400px] w-full border-b border-[#1A1F3A] overflow-hidden group">
        <Image 
          src="/images/marketplace-hero.png" 
          alt="Digital Marketplace" 
          fill 
          className="object-cover opacity-60 group-hover:scale-105 transition-transform duration-[2s]"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0E27] via-[#0A0E27]/70 to-transparent" />
        
        <div className="absolute inset-0 flex items-center">
           <div className="max-w-7xl mx-auto px-6 w-full">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-xl"
              >
                 <div className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-purple-300 text-sm font-semibold mb-6 backdrop-blur-md">
                    Now Live: Season 1 Agents
                 </div>
                 <h1 className="text-6xl font-bold mb-6 tracking-tight drop-shadow-2xl">
                    The Premier <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">AI Exchange</span>
                 </h1>
                 <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                    Discover, trade, and rent autonomous Stylus agents. 
                    Verified on-chain performance records.
                 </p>
                 <div className="flex gap-4">
                    <button className="px-8 py-3 bg-white text-[#0A0E27] font-bold rounded-xl hover:bg-gray-200 transition-all shadow-xl">
                       Explore Top Rated
                    </button>
                    <button className="px-8 py-3 bg-[#1A1F3A]/80 backdrop-blur-md text-white font-bold rounded-xl border border-[#2A2F4A] hover:bg-[#252B45] transition-all">
                       Sell Your Agent
                    </button>
                 </div>
              </motion.div>
           </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
           <div className="flex gap-2 bg-[#0F1422] p-1.5 rounded-xl border border-[#1A1F3A]">
              {['all', 'racing', 'battle', 'puzzle', 'legendary'].map((f) => (
                 <button 
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${
                     filter === f 
                     ? 'bg-[#1A1F3A] text-white shadow-lg border border-[#2A2F4A]' 
                     : 'text-gray-400 hover:text-white hover:bg-[#1A1F3A]/50'
                  }`}
                 >
                    {f}
                 </button>
              ))}
           </div>

           <div className="relative w-full md:w-96">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search by name, contract, or strategy..." 
                className="w-full bg-[#0F1422] border border-[#1A1F3A] rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-arbitrum-cyan/50 transition-colors"
              />
           </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-gray-400">Loading marketplace data...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-32 bg-[#0F1422]/50 rounded-3xl border border-[#1A1F3A]">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1A1F3A] flex items-center justify-center">
              <span className="text-4xl">🛍️</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">No Listings Found</h3>
            <p className="text-gray-400 mb-6">Try adjusting your filters or listings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
            {filteredAgents.map((agent, idx) => (
              <motion.div
                key={agent.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`group relative bg-[#0F1422] rounded-3xl border overflow-hidden hover:-translate-y-2 transition-transform duration-300 ${
                   agent.rarity === 'legendary' ? 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 
                   agent.rarity === 'rare' ? 'border-purple-500/30' : 
                   'border-[#1A1F3A]'
                }`}
              >
                {/* Image Placeholder / Gradient */}
                <div className={`h-48 relative overflow-hidden ${
                   agent.rarity === 'legendary' ? 'bg-gradient-to-br from-amber-900/40 to-[#0A0E27]' :
                   agent.rarity === 'rare' ? 'bg-gradient-to-br from-purple-900/40 to-[#0A0E27]' :
                   'bg-gradient-to-br from-blue-900/40 to-[#0A0E27]'
                }`}>
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500">
                         {agent.gameType === 'racing' ? '🏎️' : agent.gameType === 'battle' ? '⚔️' : '🧩'}
                      </div>
                   </div>
                   
                   {/* Badges */}
                   <div className="absolute top-4 left-4 flex gap-2">
                       <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${
                          agent.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                          agent.rarity === 'rare' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/50'
                       }`}>
                          {agent.rarity}
                       </span>
                   </div>
                   <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md rounded-lg px-2 py-1 flex items-center gap-1 text-xs text-white border border-white/10">
                      <span className="text-red-400">♥</span> {agent.likes}
                   </div>
                </div>

                {/* Content */}
                <div className="p-6">
                   <div className="flex justify-between items-start mb-4">
                      <div>
                         <h3 className="text-xl font-bold text-white mb-1 group-hover:text-arbitrum-cyan transition-colors">{agent.name}</h3>
                         <p className="text-xs text-gray-500 font-mono">{agent.owner}</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#1A1F3A] flex items-center justify-center border border-[#2A2F4A]">
                         <span className="text-xs">👤</span>
                      </div>
                   </div>

                   {/* Stats Grid */}
                   <div className="grid grid-cols-3 gap-2 mb-6">
                      <div className="bg-[#1A1F3A]/50 p-2 rounded-lg text-center">
                         <div className="text-[10px] text-gray-500 uppercase font-bold">ACC</div>
                         <div className="text-white font-bold">{(agent.performance.accuracy * 100).toFixed(0)}%</div>
                      </div>
                      <div className="bg-[#1A1F3A]/50 p-2 rounded-lg text-center">
                         <div className="text-[10px] text-gray-500 uppercase font-bold">WIN</div>
                         <div className="text-white font-bold">{(agent.performance.winRate * 100).toFixed(0)}%</div>
                      </div>
                      <div className="bg-[#1A1F3A]/50 p-2 rounded-lg text-center">
                         <div className="text-[10px] text-gray-500 uppercase font-bold">ELO</div>
                         <div className="text-white font-bold">{agent.performance.avgScore}</div>
                      </div>
                   </div>

                   <div className="flex items-center justify-between pt-4 border-t border-[#1A1F3A]">
                      <div>
                         <div className="text-xs text-gray-400 mb-0.5">Current Price</div>
                         <div className="text-xl font-bold text-white">{agent.price.toFixed(3)} ETH</div>
                      </div>
                      <button className="px-6 py-2 bg-white text-[#0A0E27] font-bold rounded-xl hover:bg-arbitrum-cyan transition-colors shadow-lg flex items-center gap-2">
                         <CartIcon className="w-4 h-4" />
                         Buy
                      </button>
                   </div>
                </div>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  )
}


