'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '../components/Navbar'
import { motion } from 'framer-motion'
import Link from 'next/link'

interface UserProfile {
  username: string
  wallet: string
  level: number
  xp: number
  xpToNextLevel: number
  totalXP: number
  gamesPlayed: number
  agentsTrained: number
  agentsDeployed: number
  winRate: number
  achievementsUnlocked: number
  rank: number
  badges: string[]
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch from backend
    setTimeout(() => {
      setProfile({
        username: 'CryptoGamer',
        wallet: '0x1234...5678',
        level: 15,
        xp: 3250,
        xpToNextLevel: 500,
        totalXP: 15250,
        gamesPlayed: 89,
        agentsTrained: 7,
        agentsDeployed: 4,
        winRate: 0.72,
        achievementsUnlocked: 12,
        rank: 42,
        badges: ['🥇', '⭐', '🎯', '🚀', '💎']
      })
      setIsLoading(false)
    }, 1000)
  }, [])

  if (isLoading || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0E27]">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <div className="w-16 h-16 border-4 border-arbitrum-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const levelProgress = (profile.xp / (profile.xp + profile.xpToNextLevel)) * 100

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">👤 Profile</h1>
          <p className="text-gray-400">Your stats and achievements</p>
        </div>

        {/* Profile Card */}
        <div className="bg-gradient-to-r from-arbitrum-cyan/10 to-blue-500/10 rounded-2xl border border-arbitrum-cyan/30 p-8 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-arbitrum-cyan to-blue-500 flex items-center justify-center text-4xl font-bold text-white">
                {profile.username[0]}
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">{profile.username}</h2>
                <p className="text-gray-400 mb-4">{profile.wallet}</p>
                <div className="flex items-center gap-4">
                  <div className="px-4 py-2 bg-[#1A1F3A] rounded-lg border border-[#2A2F4A]">
                    <div className="text-xs text-gray-400 mb-1">Level</div>
                    <div className="text-2xl font-bold text-arbitrum-cyan">{profile.level}</div>
                  </div>
                  <div className="px-4 py-2 bg-[#1A1F3A] rounded-lg border border-[#2A2F4A]">
                    <div className="text-xs text-gray-400 mb-1">Rank</div>
                    <div className="text-2xl font-bold text-yellow-400">#{profile.rank}</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              {profile.badges.map((badge, i) => (
                <div key={i} className="text-3xl">{badge}</div>
              ))}
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>XP Progress</span>
              <span>{profile.xp} / {profile.xp + profile.xpToNextLevel} XP</span>
            </div>
            <div className="w-full bg-[#1A1F3A] rounded-full h-4 border border-[#2A2F4A] overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${levelProgress}%` }}
                className="h-full bg-gradient-to-r from-arbitrum-cyan to-blue-500"
              />
            </div>
            <div className="text-xs text-gray-500 mt-2">
              {profile.xpToNextLevel} XP until Level {profile.level + 1}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] p-6">
            <div className="text-sm text-gray-400 mb-2">Games Played</div>
            <div className="text-3xl font-bold text-arbitrum-cyan">{profile.gamesPlayed}</div>
          </div>
          <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] p-6">
            <div className="text-sm text-gray-400 mb-2">Agents Trained</div>
            <div className="text-3xl font-bold text-purple-400">{profile.agentsTrained}</div>
          </div>
          <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] p-6">
            <div className="text-sm text-gray-400 mb-2">Agents Deployed</div>
            <div className="text-3xl font-bold text-green-400">{profile.agentsDeployed}</div>
          </div>
          <div className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] p-6">
            <div className="text-sm text-gray-400 mb-2">Win Rate</div>
            <div className="text-3xl font-bold text-yellow-400">{(profile.winRate * 100).toFixed(0)}%</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/games">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] p-6 hover:border-arbitrum-cyan/50 transition-all cursor-pointer"
            >
              <div className="text-3xl mb-3">🎮</div>
              <h3 className="text-lg font-bold text-white mb-2">Play Games</h3>
              <p className="text-gray-400 text-sm">Start playing to earn XP</p>
            </motion.div>
          </Link>
          <Link href="/achievements">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] p-6 hover:border-purple-500/50 transition-all cursor-pointer"
            >
              <div className="text-3xl mb-3">🏅</div>
              <h3 className="text-lg font-bold text-white mb-2">Achievements</h3>
              <p className="text-gray-400 text-sm">{profile.achievementsUnlocked} unlocked</p>
            </motion.div>
          </Link>
          <Link href="/leaderboard">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-[#0F1422] rounded-xl border border-[#1A1F3A] p-6 hover:border-yellow-500/50 transition-all cursor-pointer"
            >
              <div className="text-3xl mb-3">🏆</div>
              <h3 className="text-lg font-bold text-white mb-2">Leaderboard</h3>
              <p className="text-gray-400 text-sm">Rank #{profile.rank}</p>
            </motion.div>
          </Link>
        </div>
      </main>
    </div>
  )
}


