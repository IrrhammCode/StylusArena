'use client'

import { useState, useEffect, Suspense } from 'react'
import { Navbar } from '../components/Navbar'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { 
  RocketIcon, 
  CodeIcon, 
  TerminalIcon, 
  ZapIcon, 
  CheckCircleIcon 
} from '../components/Icons'

function TrainingContent() {
  const searchParams = useSearchParams()
  const trainingId = searchParams.get('id')
  const [trainingStatus, setTrainingStatus] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (trainingId) {
      // Initialize simulation
      const startTime = Date.now()
      const totalEpochs = 20

      setTrainingStatus({
        trainingId,
        gameType: 'racing', // Default for demo
        status: 'in_progress',
        progress: 0,
        epoch: 0,
        totalEpochs,
        loss: 1.0,
        accuracy: 0.3,
        lossHistory: [1.0],
        accuracyHistory: [0.3],
        dataPoints: 150,
        startTime,
        logs: ['Initializing neural network...', 'Loading hyperparameters...', 'Connecting to Stylus VM...']
      })
      setIsLoading(false)

      // Simulate training progress
      const interval = setInterval(() => {
        setTrainingStatus((prev: any) => {
          if (!prev || prev.status === 'completed') return prev

          const currentEpoch = prev.epoch + 1
          const progress = Math.min(100, Math.floor((currentEpoch / totalEpochs) * 100))

          // Simulation math
          const targetLoss = 0.01
          const lossDecay = 0.15
          let newLoss = targetLoss + (prev.loss - targetLoss) * Math.exp(-lossDecay * currentEpoch)
          newLoss = Math.max(targetLoss, newLoss + (Math.random() * 0.05 - 0.025)) // Add noise

          const targetAccuracy = 0.95
          const accuracyGrowth = 0.1
          let newAccuracy = targetAccuracy / (1 + Math.exp(-accuracyGrowth * (currentEpoch - totalEpochs / 2)))
          newAccuracy = Math.min(targetAccuracy, newAccuracy + (Math.random() * 0.02 - 0.01)) // Add noise

          const newLogs = [...prev.logs]
          if (currentEpoch % 2 === 0) newLogs.push(`Epoch ${currentEpoch}: Optimizing weights...`)
          if (currentEpoch % 5 === 0) newLogs.push(`Checkpoint saved: model_v${currentEpoch}.bin`)

          // Completed?
          if (currentEpoch >= totalEpochs) {
            clearInterval(interval)

            // Save to localStorage for other pages to see
            const trainedModel = {
              id: trainingId,
              gameType: prev.gameType,
              accuracy: newAccuracy,
              loss: newLoss,
              timestamp: Date.now()
            }
            const existing = JSON.parse(localStorage.getItem('stylus_trained_models') || '[]')
            localStorage.setItem('stylus_trained_models', JSON.stringify([...existing, trainedModel]))

            return {
              ...prev,
              status: 'completed',
              progress: 100,
              epoch: totalEpochs,
              loss: newLoss,
              accuracy: newAccuracy,
              lossHistory: [...prev.lossHistory, newLoss],
              accuracyHistory: [...prev.accuracyHistory, newAccuracy],
              estimatedTimeRemaining: 'Completed',
              logs: [...newLogs, 'Training finalized.', 'Model exported to WASM format.']
            }
          }

          return {
            ...prev,
            epoch: currentEpoch,
            progress,
            loss: newLoss,
            accuracy: newAccuracy,
            lossHistory: [...prev.lossHistory, newLoss],
            accuracyHistory: [...prev.accuracyHistory, newAccuracy],
            dataPoints: prev.dataPoints + Math.floor(Math.random() * 50),
            estimatedTimeRemaining: Math.ceil(((totalEpochs - currentEpoch) * 1.5)) + 's',
            logs: newLogs.slice(-6) // Keep only last 6 logs
          }
        })
      }, 1500) // Slower update for cinematic feel

      return () => clearInterval(interval)
    } else {
      setIsLoading(false)
    }
  }, [trainingId])

  return (
    <div className="min-h-screen bg-[#0A0E27] text-white selection:bg-arbitrum-cyan/30">
      <Navbar />

      {/* Hero Header */}
      <div className="relative h-[400px] w-full overflow-hidden border-b border-[#1A1F3A]">
         <Image 
           src="/images/training-hero.png" 
           alt="Training Dashboard" 
           fill 
           className="object-cover opacity-60"
           priority
         />
         <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E27]/50 via-[#0A0E27]/80 to-[#0A0E27]" />
         
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center max-w-4xl px-6 relative z-10">
               <motion.div
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.8 }}
               >
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-arbitrum-cyan/10 border border-arbitrum-cyan/30 text-arbitrum-cyan text-sm font-semibold mb-6 backdrop-blur-md">
                     <span className="relative flex h-2 w-2">
                       <span className={`animate-ping absolute inline-flex h-full w-full rounded-full bg-arbitrum-cyan opacity-75 ${trainingStatus?.status === 'completed' ? 'hidden' : ''}`}></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-arbitrum-cyan"></span>
                     </span>
                     {trainingStatus?.status === 'completed' ? 'Training Finalized' : 'Live Training Session'}
                  </div>
                  <h1 className="text-6xl font-bold mb-4 tracking-tight text-white drop-shadow-2xl">
                     Neural Architecture <span className="text-transparent bg-clip-text bg-gradient-to-r from-arbitrum-cyan to-blue-500">Training</span>
                  </h1>
                  <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                     Optimizing agent decision pathways using reinforcement learning. 
                     Preparing model for deployment on Arbitrum Stylus.
                  </p>
               </motion.div>
            </div>
         </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-24 relative z-20 pb-20">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-[#0F1422]/80 backdrop-blur-xl rounded-3xl border border-[#2A2F4A]">
            <div className="w-20 h-20 border-4 border-arbitrum-cyan border-t-transparent rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(0,217,255,0.3)]" />
            <p className="text-gray-300 text-lg animate-pulse">Initializing Environment...</p>
          </div>
        ) : trainingStatus ? (
          <div className="space-y-8">
            
            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
               
               {/* Left Column: Metrics & Progress */}
               <div className="lg:col-span-2 space-y-8">
                  
                  {/* Progress Panel */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#0F1422]/90 backdrop-blur-xl rounded-3xl border border-[#1A1F3A] p-8 shadow-2xl relative overflow-hidden"
                  >
                     <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
                     
                     <div className="flex justify-between items-end mb-6">
                        <div>
                           <h2 className="text-2xl font-bold text-white mb-2">Training Progress</h2>
                           <p className="text-gray-400 text-sm">Epoch {trainingStatus.epoch} of {trainingStatus.totalEpochs}</p>
                        </div>
                        <div className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-arbitrum-cyan to-blue-500">
                           {trainingStatus.progress}%
                        </div>
                     </div>

                     <div className="h-6 bg-[#1A1F3A] rounded-full overflow-hidden border border-[#2A2F4A] relative">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-arbitrum-cyan to-blue-600 relative overflow-hidden"
                          initial={{ width: 0 }}
                          animate={{ width: `${trainingStatus.progress}%` }}
                        >
                           <div className="absolute inset-0 bg-white/20 skew-x-[-20deg] animate-shimmer" />
                        </motion.div>
                     </div>
                     <div className="mt-4 flex justify-between text-xs font-mono text-gray-500">
                        <span>START: {new Date(trainingStatus.startTime).toLocaleTimeString()}</span>
                        <span>EST. REMAINING: {trainingStatus.estimatedTimeRemaining}</span>
                     </div>
                  </motion.div>

                  {/* Charts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     {/* Loss Chart */}
                     <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.3 }}
                       className="bg-[#0F1422]/80 backdrop-blur-lg rounded-3xl border border-[#1A1F3A] p-6"
                     >
                        <h3 className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">Loss Function</h3>
                        <div className="h-40 relative flex items-end gap-1 border-b border-l border-[#2A2F4A] p-2">
                           {trainingStatus.lossHistory.map((val: number, i: number) => (
                              <div
                                key={i}
                                className="flex-1 bg-red-500/50 rounded-t-sm hover:bg-red-400 transition-colors"
                                style={{ height: `${Math.min(100, val * 100)}%` }}
                              />
                           ))}
                           <div className="absolute top-2 right-2 text-2xl font-bold text-red-400">
                              {trainingStatus.loss.toFixed(4)}
                           </div>
                        </div>
                     </motion.div>

                     {/* Accuracy Chart */}
                     <motion.div 
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: 0.4 }}
                       className="bg-[#0F1422]/80 backdrop-blur-lg rounded-3xl border border-[#1A1F3A] p-6"
                     >
                        <h3 className="text-gray-400 text-sm font-semibold mb-4 uppercase tracking-wider">Model Accuracy</h3>
                        <div className="h-40 relative flex items-end gap-1 border-b border-l border-[#2A2F4A] p-2">
                           {trainingStatus.accuracyHistory.map((val: number, i: number) => (
                              <div
                                key={i}
                                className="flex-1 bg-green-500/50 rounded-t-sm hover:bg-green-400 transition-colors"
                                style={{ height: `${val * 100}%` }}
                              />
                           ))}
                           <div className="absolute top-2 right-2 text-2xl font-bold text-green-400">
                              {(trainingStatus.accuracy * 100).toFixed(1)}%
                           </div>
                        </div>
                     </motion.div>
                  </div>

               </div>

               {/* Right Column: Terminal & Stats */}
               <div className="space-y-8">
                  {/* Live Logs Terminal */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-[#0A0E27] rounded-3xl border border-[#2A2F4A] p-6 font-mono text-sm h-[320px] overflow-hidden flex flex-col"
                  >
                     <div className="flex items-center gap-2 mb-4 border-b border-[#1A1F3A] pb-4">
                        <TerminalIcon className="w-4 h-4 text-arbitrum-cyan" />
                        <span className="text-gray-300 font-semibold">System Logs</span>
                        <div className="flex-1" />
                        <div className="flex gap-1.5">
                           <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                           <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                           <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                        </div>
                     </div>
                     <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                        <AnimatePresence>
                           {trainingStatus.logs?.map((log: string, i: number) => (
                              <motion.div 
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-gray-400 border-l-2 border-transparent hover:border-arbitrum-cyan/50 pl-2 hover:bg-[#1A1F3A]/50 py-1 rounded-r"
                              >
                                 <span className="text-[#2A2F4A] mr-2">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
                                 {log}
                              </motion.div>
                           ))}
                        </AnimatePresence>
                        <motion.div 
                           animate={{ opacity: [0, 1, 0] }}
                           transition={{ duration: 1, repeat: Infinity }}
                           className="text-arbitrum-cyan"
                        >
                           _
                        </motion.div>
                     </div>
                  </motion.div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-[#1A1F3A]/50 p-5 rounded-2xl border border-[#2A2F4A]">
                        <div className="text-gray-400 text-xs uppercase mb-1">Data Points</div>
                        <div className="text-2xl font-bold text-white">{trainingStatus.dataPoints.toLocaleString()}</div>
                     </div>
                     <div className="bg-[#1A1F3A]/50 p-5 rounded-2xl border border-[#2A2F4A]">
                        <div className="text-gray-400 text-xs uppercase mb-1">Learning Rate</div>
                        <div className="text-2xl font-bold text-white">0.0035</div>
                     </div>
                  </div>
               </div>

            </div>

            {/* Action Bar (Completion State) */}
            <AnimatePresence>
               {trainingStatus.status === 'completed' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed bottom-0 left-0 right-0 bg-[#0F1422]/90 backdrop-blur-xl border-t border-arbitrum-cyan/30 p-6 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
                  >
                     <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                           <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/30">
                              <CheckCircleIcon className="w-8 h-8 text-green-400" />
                           </div>
                           <div>
                              <h3 className="text-xl font-bold text-white">Training Successfully Completed</h3>
                              <p className="text-gray-400">Model verified and ready for on-chain deployment.</p>
                           </div>
                        </div>
                        
                        <div className="flex gap-4">
                           <Link href={`/agents/test?trainingId=${trainingStatus.trainingId}`}>
                              <button className="px-8 py-4 bg-[#1A1F3A] hover:bg-[#252B45] text-white font-bold rounded-xl border border-[#2A2F4A] transition-all">
                                 Test in Sandbox
                              </button>
                           </Link>
                           <Link href={`/agents/deploy?trainingId=${trainingStatus.trainingId}`}>
                              <button className="px-8 py-4 bg-gradient-to-r from-arbitrum-cyan to-blue-600 hover:shadow-[0_0_20px_rgba(0,217,255,0.4)] text-[#0A0E27] font-bold rounded-xl transition-all flex items-center gap-2">
                                 <RocketIcon className="w-5 h-5" />
                                 Deploy to Mainnet
                              </button>
                           </Link>
                        </div>
                     </div>
                  </motion.div>
               )}
            </AnimatePresence>

          </div>
        ) : (
          <div className="text-center py-32 bg-[#0F1422]/50 rounded-3xl border border-[#1A1F3A] border-dashed">
             <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1A1F3A] flex items-center justify-center shadow-lg">
                <span className="text-4xl">🤖</span>
             </div>
             <h3 className="text-3xl font-bold text-white mb-2">No Active Session</h3>
             <p className="text-gray-400 mb-8 max-w-md mx-auto">Initiate a training session from the Game Library to begin the reinforcement learning process.</p>
             <Link href="/games">
                <button className="px-8 py-3 bg-white text-[#0A0E27] font-bold rounded-xl hover:bg-gray-200 transition-all shadow-xl">
                   Go to Game Library
                </button>
             </Link>
          </div>
        )}
      </main>
    </div>
  )
}

export default function TrainingPage() {
  return (
    <Suspense fallback={
       <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
             <div className="w-16 h-16 border-4 border-arbitrum-cyan border-t-transparent rounded-full animate-spin" />
             <div className="text-gray-400 font-mono text-sm tracking-wider">LOADING SYSTEM...</div>
          </div>
       </div>
    }>
      <TrainingContent />
    </Suspense>
  )
}

