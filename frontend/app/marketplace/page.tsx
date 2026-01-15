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
  realWorldTraits?: { label: string; value: string; color?: string }[]
}

// Wagmi V1
import { usePublicClient } from 'wagmi'
import { STYLUS_ARENA_ADDRESS, stylusArenaABI } from '../../lib/contracts'
import { formatEther } from 'viem'

function MarketplaceContent() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const publicClient = usePublicClient()

  useEffect(() => {
    const fetchMarketplace = async () => {
      try {
        setIsLoading(true)

        // 1. Get Listings Count
        const count = await publicClient.readContract({
          address: STYLUS_ARENA_ADDRESS,
          abi: stylusArenaABI,
          functionName: 'listingCount',
        }) as bigint

        const totalListings = Number(count)
        console.log("Total Listings:", totalListings)

        const loadedAgents: Agent[] = []

        // 2. Fetch all listings
        for (let i = 0; i < totalListings; i++) {
          try {
            const listing = await publicClient.readContract({
              address: STYLUS_ARENA_ADDRESS,
              abi: stylusArenaABI,
              functionName: 'getListing',
              args: [BigInt(i)]
            }) as any

            if (!listing.isActive) continue

            // 3. Get Agent Info
            const agentInfo = await publicClient.readContract({
              address: STYLUS_ARENA_ADDRESS,
              abi: stylusArenaABI,
              functionName: 'getAgentInfo',
              args: [listing.agent]
            }) as any

            // 4. Map to Agent Interface
            loadedAgents.push({
              id: listing.agent,
              name: agentInfo.name || `Agent #${i + 1}`,
              gameType: ['racing', 'battle', 'puzzle', 'trading', 'memory', 'card', 'tower', 'resource', 'strategy'][agentInfo.gameType] || 'racing',
              performance: {
                accuracy: Number(agentInfo.accuracy) / 10000,
                winRate: Number(agentInfo.winRate) / 10000,
                avgScore: 0 // Not in struct
              },
              price: Number(formatEther(listing.price)),
              owner: listing.seller.slice(0, 6) + '...' + listing.seller.slice(-4),
              deployed: true,
              contractAddress: listing.agent,
              rarity: Math.random() > 0.8 ? 'legendary' : Math.random() > 0.5 ? 'rare' : 'common',
              likes: Math.floor(Math.random() * 100),
              realWorldTraits: [] // Fetch from local storage if possible or leave empty
            })

          } catch (err) {
            console.error("Error fetching listing", i, err)
          }
        }

        // 5. Fetch Local Listings (Hybrid)
        const localListings = JSON.parse(localStorage.getItem('stylus_marketplace_listings') || '[]')
        const localAgents = JSON.parse(localStorage.getItem('stylus_deployed_agents') || '[]')

        localListings.forEach((listing: any) => {
          const agentInfo = localAgents.find((a: any) => a.contractAddress === listing.agent)

          // Always show listing, use fallback values if agentInfo not found
          loadedAgents.push({
            id: listing.agent || listing.id,
            name: agentInfo ? `Agent ${agentInfo.gameType.toUpperCase()}` : 'Local Agent',
            gameType: agentInfo?.gameType || 'racing',
            performance: {
              accuracy: agentInfo?.accuracy || 0.85,
              winRate: (agentInfo?.accuracy || 0.85) * 0.9,
              avgScore: 0
            },
            price: 0.1,
            owner: listing.seller ? (listing.seller.slice(0, 6) + '...' + listing.seller.slice(-4)) : 'You',
            deployed: true,
            contractAddress: listing.agent || listing.id,
            rarity: 'rare',
            likes: 0,
            realWorldTraits: []
          })
        })

        setAgents(loadedAgents)

      } catch (error) {
        console.error("Marketplace fetch error:", error)
        // Fallback to empty or error state
      } finally {
        setIsLoading(false)
      }
    }

    if (publicClient) {
      fetchMarketplace()
    }
  }, [publicClient])

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
            {['all', 'racing', 'battle', 'puzzle', 'trading', 'tower', 'resource', 'strategy'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${filter === f
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
                  className={`group relative bg-[#0F1422] rounded-3xl border overflow-hidden hover:-translate-y-2 transition-transform duration-300 ${agent.rarity === 'legendary' ? 'border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.1)]' :
                    agent.rarity === 'rare' ? 'border-purple-500/30' :
                      'border-[#1A1F3A]'
                    }`}
                >
                  {/* Image Placeholder / Gradient */}
                  <div className={`h-48 relative overflow-hidden ${agent.rarity === 'legendary' ? 'bg-gradient-to-br from-amber-900/40 to-[#0A0E27]' :
                    agent.rarity === 'rare' ? 'bg-gradient-to-br from-purple-900/40 to-[#0A0E27]' :
                      'bg-gradient-to-br from-blue-900/40 to-[#0A0E27]'
                    }`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl opacity-50 grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-500">
                        {agent.gameType === 'racing' ? '🏎️' :
                          agent.gameType === 'battle' ? '⚔️' :
                            agent.gameType === 'trading' ? '📈' :
                              agent.gameType === 'tower' ? '🏰' :
                                agent.gameType === 'resource' ? '⛏️' :
                                  agent.gameType === 'strategy' ? '🏛️' : '🧩'}
                      </div>
                    </div>

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border ${agent.rarity === 'legendary' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                        agent.rarity === 'rare' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' :
                          'bg-blue-500/20 text-blue-300 border-blue-500/50'
                        }`}>
                        {agent.rarity}
                      </span>
                      {agent.realWorldTraits && agent.realWorldTraits.length > 0 && (
                        <span className="px-2 py-1 rounded-lg text-xs font-bold uppercase tracking-wider backdrop-blur-md border bg-green-500/20 text-green-300 border-green-500/50">
                          REAL WORLD
                        </span>
                      )}
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
                    {agent.realWorldTraits && agent.realWorldTraits.length > 0 ? (
                      <div className="bg-[#1A1F3A]/50 p-3 rounded-xl mb-6 border border-[#2A2F4A]">
                        <div className="text-[10px] text-gray-400 uppercase font-bold mb-2">Strategy Configuration</div>
                        <div className="flex justify-between items-center">
                          {agent.realWorldTraits.map((trait, i) => (
                            <div key={i} className="text-center">
                              <div className="text-[10px] text-gray-500">{trait.label}</div>
                              <div className={`text-sm font-bold ${trait.color || 'text-white'}`}>{trait.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
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
                    )}

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


