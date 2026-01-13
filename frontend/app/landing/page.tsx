'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SafeConnectButton } from '../components/SafeConnectButton'
import {
  SparklesIcon,
  CodeIcon,
  RocketIcon,
  GithubIcon
} from '../components/Icons'

export default function LandingPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-arbitrum-cyan/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0A0E27]/80 backdrop-blur-xl border-b border-[#1A1F3A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-arbitrum-cyan/20">
                <img src="/images/logo.png" alt="StylusArena" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight">StylusArena</h1>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/games" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Games
              </Link>
              <Link href="/marketplace" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Marketplace
              </Link>
              <div className="relative z-50">
                <SafeConnectButton />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1A1F3A] border border-[#2A2F4A] mb-8">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Arbitrum Stylus Enabled</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                Train AI Agents <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-arbitrum-cyan to-blue-500">
                  By Playing Games
                </span>
              </h1>

              <p className="text-xl text-gray-400 mb-8 leading-relaxed max-w-lg">
                Your gameplay becomes training data. Create autonomous DeFi agents that live on-chain and earn rewards for you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/games">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white text-[#0A0E27] font-bold rounded-xl text-lg shadow-xl shadow-white/10 hover:bg-gray-100 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    <RocketIcon className="w-5 h-5" />
                    Start Training
                  </motion.button>
                </Link>
                <Link href="/marketplace">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-[#1A1F3A] border border-[#2A2F4A] text-white font-semibold rounded-xl text-lg hover:border-arbitrum-cyan/50 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                  >
                    Explore Market
                  </motion.button>
                </Link>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="relative z-10 rounded-3xl overflow-hidden border border-[#2A2F4A] shadow-2xl shadow-arbitrum-cyan/20">
                <Image
                  src="/images/hero.png"
                  alt="AI Training Arena"
                  width={800}
                  height={800}
                  className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                />

                {/* Floating UI Card Overlay */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute bottom-6 left-6 right-6 bg-[#0A0E27]/90 backdrop-blur-md p-4 rounded-xl border border-[#2A2F4A]"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">Current Status</div>
                      <div className="text-white font-bold flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-500 rounded-full" />
                        Neural Network Active
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono text-arbitrum-cyan">98.4%</div>
                      <div className="text-xs text-gray-400">Model Accuracy</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-[#0F1422]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-white mb-4">Complete Agent Ecosystem</h2>
            <p className="text-gray-400 max-w-2xl mx-auto">From training to deployment, every step is gamified and verified on-chain.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -10 }}
              className="group bg-[#1A1F3A] rounded-2xl border border-[#2A2F4A] overflow-hidden hover:border-arbitrum-cyan/50 transition-all"
            >
              <div className="h-48 overflow-hidden relative">
                <Image src="/images/feature-training.png" alt="Training" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F3A] to-transparent" />
              </div>
              <div className="p-8 relative">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 border border-purple-500/30">
                  <SparklesIcon className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Visual Learning</h3>
                <p className="text-gray-400 leading-relaxed">
                  Watch your agent's neural network evolve in real-time as you play. Our visualizer shows exactly how your decisions shape the AI's behavior.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -10 }}
              className="group bg-[#1A1F3A] rounded-2xl border border-[#2A2F4A] overflow-hidden hover:border-arbitrum-cyan/50 transition-all"
            >
              <div className="h-48 overflow-hidden relative">
                <Image src="/images/feature-battle.png" alt="Battle" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F3A] to-transparent" />
              </div>
              <div className="p-8 relative">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center mb-6 border border-red-500/30">
                  <RocketIcon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Arena Battles</h3>
                <p className="text-gray-400 leading-relaxed">
                  Proven agents can enter the arena. PVP battles determine the strongest models, with winners earning tournament rewards.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -10 }}
              className="group bg-[#1A1F3A] rounded-2xl border border-[#2A2F4A] overflow-hidden hover:border-arbitrum-cyan/50 transition-all"
            >
              <div className="h-48 overflow-hidden relative">
                <Image src="/images/feature-marketplace.png" alt="Marketplace" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1F3A] to-transparent" />
              </div>
              <div className="p-8 relative">
                <div className="w-12 h-12 rounded-xl overflow-hidden mb-6 border border-cyan-500/30">
                  <img src="/images/logo.png" alt="StylusArena" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Agent Marketplace</h3>
                <p className="text-gray-400 leading-relaxed">
                  Rent out your high-performing agents or sell them as NFTs. The decentralized marketplace allows permissionless agent exchange.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-[#1A1F3A] bg-[#0A0E27] relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-800">
              <img src="/images/logo.png" alt="StylusArena" className="w-full h-full object-contain opacity-60" />
            </div>
            <span className="text-gray-400 font-semibold">StylusArena</span>
          </div>

          <div className="flex items-center gap-8">
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Documentation</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors">Contracts</a>
            <a href="#" className="text-gray-500 hover:text-white transition-colors flex items-center gap-2">
              <GithubIcon className="w-4 h-4" />
              GitHub
            </a>
          </div>

          <p className="text-gray-600 text-sm">
            © 2024 Arbitrum Hackathon Project
          </p>
        </div>
      </footer>
    </div>
  )
}

