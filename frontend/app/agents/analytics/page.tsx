'use client'

import { useState, useEffect, Suspense } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { TerminalIcon, ZapIcon, SparklesIcon, ShareIcon } from '../../components/Icons'

interface AgentMetrics {
  accuracy: number
  winRate: number
  totalActions: number
  profit: number
  loss: number
  avgScore: number
  uptime: number
  lastActive: string
}

interface ActivityLog {
  timestamp: string
  action: string
  result: 'success' | 'warning' | 'error'
  details: string
}

function AnalyticsContent() {
  const searchParams = useSearchParams()
  const contractAddress = searchParams.get('address')
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null)
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([])
  const [performanceHistory, setPerformanceHistory] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (contractAddress) {
      fetchAnalytics()
      // Simulate real-time updates
      const interval = setInterval(fetchAnalytics, 5000)
      return () => clearInterval(interval)
    } else {
      setIsLoading(false)
    }
  }, [contractAddress])

  const fetchAnalytics = async () => {
    try {
      // Fetch from localStorage
      const deployedAgents = JSON.parse(localStorage.getItem('stylus_deployed_agents') || '[]')
      const agent = deployedAgents.find((a: any) => a.contractAddress === contractAddress)

      if (agent) {
        setMetrics({
          accuracy: agent.accuracy || 0.92,
          winRate: 0.85, // Mocked for now
          totalActions: 150 + Math.floor(Math.random() * 1000),
          profit: 0.45 + (Math.random() * 0.1),
          loss: 0.12,
          avgScore: 1250,
          uptime: 99.8,
          lastActive: new Date().toISOString(),
        })
      } else {
        // Fallback mock data if not found (or for demo url)
        setMetrics({
          accuracy: 0.92,
          winRate: 0.85 + (Math.random() * 0.05 - 0.025),
          totalActions: 1250 + Math.floor(Math.random() * 50),
          profit: 0.45 + (Math.random() * 0.01),
          loss: 0.12,
          avgScore: 1250,
          uptime: 99.8,
          lastActive: new Date().toISOString(),
        })
      }

      setActivityLog([
        { timestamp: new Date(Date.now() - 60000).toISOString(), action: 'Trade executed', result: 'success', details: 'Buy 100 tokens @ $1.50' },
        { timestamp: new Date(Date.now() - 120000).toISOString(), action: 'Trade executed', result: 'success', details: 'Sell 50 tokens @ $1.75' },
        { timestamp: new Date(Date.now() - 180000).toISOString(), action: 'Risk check', result: 'warning', details: 'High volatility detected' },
        { timestamp: new Date(Date.now() - 240000).toISOString(), action: 'Trade executed', result: 'success', details: 'Buy 200 tokens @ $1.45' },
      ])

      // Generate performance history (last 30 days)
      const history = Array.from({ length: 30 }, (_, i) => {
        const base = 0.85
        const variation = (Math.random() - 0.5) * 0.1
        return Math.max(0, Math.min(1, base + variation))
      })
      setPerformanceHistory(history)

      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-[350px] w-full border-b border-[#1A1F3A] overflow-hidden">
        <Image 
          src="/images/analytics-hero.png" 
          alt="Analytics Command Center" 
          fill 
          className="object-cover opacity-50"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0E27] via-[#0A0E27]/80 to-[#0A0E27]/30" />
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center max-w-4xl px-6 relative z-10 pt-12">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
            >
               <h1 className="text-5xl font-bold mb-4 tracking-tight drop-shadow-2xl">
                 Agent <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Command Center</span>
               </h1>
               <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                 Real-time telemetry and performance monitoring for your autonomous Stylus agents.
               </p>
               {contractAddress && (
                 <div className="mt-4 px-4 py-2 bg-[#1A1F3A]/80 backdrop-blur-md rounded-full border border-[#2A2F4A] inline-flex items-center gap-2 font-mono text-sm text-arbitrum-cyan">
                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                   {contractAddress}
                 </div>
               )}
            </motion.div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-20 relative z-20 pb-20">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 bg-[#0F1422]/80 backdrop-blur-xl rounded-3xl border border-[#2A2F4A]">
             <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mb-4 shadow-[0_0_20px_rgba(234,179,8,0.3)]" />
             <p className="text-gray-400 text-lg animate-pulse">Establishing Secure Uplink...</p>
          </div>
        ) : !metrics ? (
           <div className="flex flex-col items-center justify-center py-32 bg-[#0F1422]/90 backdrop-blur-xl rounded-3xl border border-[#2A2F4A] shadow-2xl">
             <div className="w-24 h-24 rounded-full bg-[#1A1F3A] flex items-center justify-center mb-6 border border-[#2A2F4A] shadow-lg">
                <span className="text-4xl">📡</span>
             </div>
             <h3 className="text-3xl font-bold text-white mb-2">No Active Agent Found</h3>
             <p className="text-gray-400 mb-8 max-w-md text-center">Deploy an intelligent agent to Stylus to begin tracking performance.</p>
             <div className="flex gap-4">
                <Link href="/training">
                  <button className="px-8 py-3 bg-gradient-to-r from-arbitrum-cyan to-blue-600 text-[#0A0E27] font-bold rounded-xl hover:shadow-lg transition-all">
                    Train New Agent
                  </button>
                </Link>
                <Link href="/agents/deploy">
                   <button className="px-8 py-3 bg-[#1A1F3A] text-white font-bold rounded-xl border border-[#2A2F4A] hover:bg-[#252B45] transition-all">
                     Deploy Existing
                   </button>
                </Link>
             </div>
           </div>
        ) : (
          <div className="space-y-6">
            
            {/* Top Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.1 }}
                 className="bg-[#0F1422]/80 backdrop-blur-lg p-6 rounded-2xl border border-[#1A1F3A] hover:border-green-500/30 transition-colors group"
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className="text-gray-400 text-sm font-semibold uppercase">Prediction Accuracy</span>
                     <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                        <SparklesIcon className="w-5 h-5 text-green-400" />
                     </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{(metrics.accuracy * 100).toFixed(1)}%</div>
                  <div className="text-xs text-green-400 flex items-center gap-1">
                     <span className="bg-green-500/10 px-1.5 py-0.5 rounded">↑ 2.3%</span>
                     <span className="text-gray-500">vs last epoch</span>
                  </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
                 className="bg-[#0F1422]/80 backdrop-blur-lg p-6 rounded-2xl border border-[#1A1F3A] hover:border-blue-500/30 transition-colors group"
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className="text-gray-400 text-sm font-semibold uppercase">Win Rate</span>
                     <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                        <ZapIcon className="w-5 h-5 text-blue-400" />
                     </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{(metrics.winRate * 100).toFixed(1)}%</div>
                  <div className="text-xs text-blue-400 flex items-center gap-1">
                     <span className="bg-blue-500/10 px-1.5 py-0.5 rounded">↑ 1.5%</span>
                     <span className="text-gray-500">rolling avg</span>
                  </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.3 }}
                 className="bg-[#0F1422]/80 backdrop-blur-lg p-6 rounded-2xl border border-[#1A1F3A] hover:border-yellow-500/30 transition-colors group"
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className="text-gray-400 text-sm font-semibold uppercase">Net Profit</span>
                     <div className="p-2 bg-yellow-500/10 rounded-lg group-hover:bg-yellow-500/20 transition-colors">
                        <ShareIcon className="w-5 h-5 text-yellow-400" />
                     </div>
                  </div>
                  <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2">
                     {metrics.profit.toFixed(3)} ETH
                  </div>
                  <div className="text-xs text-yellow-500 flex items-center gap-1">
                     <span className="bg-yellow-500/10 px-1.5 py-0.5 rounded">+{((metrics.profit - metrics.loss) * 1000).toFixed(2)} USD</span>
                     <span className="text-gray-500">esthetic PnL</span>
                  </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.4 }}
                 className="bg-[#0F1422]/80 backdrop-blur-lg p-6 rounded-2xl border border-[#1A1F3A] hover:border-purple-500/30 transition-colors group"
               >
                  <div className="flex justify-between items-start mb-4">
                     <span className="text-gray-400 text-sm font-semibold uppercase">System Uptime</span>
                     <div className="p-2 bg-purple-500/10 rounded-lg group-hover:bg-purple-500/20 transition-colors">
                        <TerminalIcon className="w-5 h-5 text-purple-400" />
                     </div>
                  </div>
                  <div className="text-4xl font-bold text-white mb-2">{metrics.uptime.toFixed(1)}%</div>
                  <div className="text-xs text-purple-400 flex items-center gap-1">
                     <span className="bg-purple-500/10 px-1.5 py-0.5 rounded">Active</span>
                     <span className="text-gray-500">{new Date(metrics.lastActive).toLocaleTimeString()}</span>
                  </div>
               </motion.div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Performance Chart Section */}
              <div className="lg:col-span-2 bg-[#0F1422]/90 backdrop-blur-xl rounded-3xl border border-[#1A1F3A] p-8 shadow-xl">
                 <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Performance Velocity</h2>
                    <select className="bg-[#1A1F3A] border border-[#2A2F4A] text-gray-300 text-sm rounded-lg px-3 py-1 focus:outline-none">
                       <option>Last 30 Days</option>
                       <option>Last 7 Days</option>
                       <option>Last 24 Hours</option>
                    </select>
                 </div>
                 
                 <div className="h-80 w-full relative bg-[#0A0E27]/50 rounded-xl border border-[#2A2F4A] p-4 overflow-hidden">
                    {/* Background Grid */}
                    <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-10">
                       {[...Array(24)].map((_, i) => (
                          <div key={i} className="border-r border-b border-arbitrum-cyan" />
                       ))}
                    </div>

                    {performanceHistory.length > 0 ? (
                      <svg className="w-full h-full relative z-10" viewBox="0 0 400 200" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="perfGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#00D9FF" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#00D9FF" stopOpacity="0" />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                             <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                             <feMerge>
                                <feMergeNode in="coloredBlur" />
                                <feMergeNode in="SourceGraphic" />
                             </feMerge>
                          </filter>
                        </defs>
                        
                        {/* Curve */}
                        {(() => {
                           const points = performanceHistory.map((val, i) => {
                              const x = (i / (performanceHistory.length - 1 || 1)) * 400
                              const y = 200 - (val * 180) - 10 // Padding
                              return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                           }).join(' ')
                           const fillPath = `${points} L 400 200 L 0 200 Z`

                           return (
                              <>
                                <path d={fillPath} fill="url(#perfGradient)" />
                                <path d={points} stroke="#00D9FF" strokeWidth="3" fill="none" filter="url(#glow)" strokeLinecap="round" strokeLinejoin="round"/>
                              </>
                           )
                        })()}
                      </svg>
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-500">Awaiting data stream...</div>
                    )}
                 </div>
              </div>

              {/* Activity Log */}
              <div className="bg-[#0F1422]/90 backdrop-blur-xl rounded-3xl border border-[#1A1F3A] p-6 shadow-xl flex flex-col">
                 <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <TerminalIcon className="w-5 h-5 text-gray-400" />
                    Neural Decisions
                 </h2>
                 <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2">
                    {activityLog.length > 0 ? (
                       activityLog.map((log, idx) => (
                          <motion.div 
                             key={idx}
                             initial={{ opacity: 0, x: -10 }}
                             animate={{ opacity: 1, x: 0 }}
                             transition={{ delay: idx * 0.1 }}
                             className="bg-[#1A1F3A]/60 rounded-xl p-4 border border-[#2A2F4A] hover:bg-[#1A1F3A] hover:border-arbitrum-cyan/30 transition-all cursor-default relative overflow-hidden group"
                          >
                             <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-arbitrum-cyan/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                             
                             <div className="flex justify-between items-start mb-2">
                                <span className={`text-xs font-bold px-2 py-1 rounded ${
                                   log.result === 'success' ? 'bg-green-500/20 text-green-400' :
                                   log.result === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                                   'bg-red-500/20 text-red-400'
                                }`}>
                                   {log.result.toUpperCase()}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono">
                                   {new Date(log.timestamp).toLocaleTimeString()}
                                </span>
                             </div>
                             <div className="text-sm font-semibold text-white mb-1">{log.action}</div>
                             <div className="text-xs text-gray-400">{log.details}</div>
                          </motion.div>
                       ))
                    ) : (
                       <div className="text-center text-gray-500 py-10">No recent neural activity</div>
                    )}
                 </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin" />
             <div className="text-gray-400 font-mono text-sm tracking-wider">CONNECTING TO SATELLITE...</div>
          </div>
       </div>
    }>
      <AnalyticsContent />
    </Suspense>
  )
}


