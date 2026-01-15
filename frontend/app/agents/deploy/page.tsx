'use client'

import { useState, useEffect, Suspense } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { useContractWrite, useWaitForTransaction, useAccount, useContractRead } from 'wagmi'
import { STYLUS_ARENA_ADDRESS, stylusArenaABI } from '../../../lib/contracts'
import { parseEther } from 'viem'

// Game type mapping matches Solidity contract
const GAME_TYPE_MAP: Record<string, number> = {
  'racing': 0,
  'battle': 1,
  'puzzle': 2,
  'trading': 3,
  'memory': 4,
  'card': 5,
  'tower': 6,
  'resource': 7,
  'strategy': 8
}

function DeployContent() {
  const searchParams = useSearchParams()
  const trainingId = searchParams.get('trainingId')
  const [agentData, setAgentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [contractAddress, setContractAddress] = useState<string | null>(null)

  // Wagmi Hooks (V1)
  const { address: userAddress } = useAccount()

  // 1. Check if user has profile
  const { data: hasProfileData, refetch: refetchProfile } = useContractRead({
    address: STYLUS_ARENA_ADDRESS,
    abi: stylusArenaABI,
    functionName: 'hasProfile',
    args: [userAddress!],
    enabled: !!userAddress,
  })

  // 2. Create Profile Write
  const { data: createProfileData, isLoading: isCreatingProfile, write: createProfile } = useContractWrite({
    address: STYLUS_ARENA_ADDRESS,
    abi: stylusArenaABI,
    functionName: 'createProfile',
  })

  const { isLoading: isProfileConfirming, isSuccess: isProfileConfirmed } = useWaitForTransaction({
    hash: createProfileData?.hash,
  })

  const { data: txData, isLoading: isWritePending, write: writeContract } = useContractWrite({
    address: STYLUS_ARENA_ADDRESS,
    abi: stylusArenaABI,
    functionName: 'registerAgent',
  })

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransaction({
    hash: txData?.hash,
  })

  // Combined loading state
  const isDeploying = isWritePending || isConfirming

  // Profile State
  const [username, setUsername] = useState('')
  const [showProfileForm, setShowProfileForm] = useState(false)

  // Effect to update profile status
  useEffect(() => {
    if (isProfileConfirmed) {
      toast.success('Profile created successfully!')
      refetchProfile()
      setShowProfileForm(false)
    }
  }, [isProfileConfirmed, refetchProfile])

  // Effect to show form if needed
  useEffect(() => {
    if (hasProfileData === false && userAddress && !showProfileForm && !isProfileConfirmed) {
      // Only show if explicitly checked and false
      setShowProfileForm(true)
    }
  }, [hasProfileData, userAddress])

  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'generating' | 'deploying' | 'success' | 'failed'>('idle')
  const [deploymentProgress, setDeploymentProgress] = useState(0)
  const [manualAgentAddress, setManualAgentAddress] = useState(`0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`)

  // Determine status based on Wagmi state
  useEffect(() => {
    if (isWritePending) {
      setDeploymentStatus('generating') // Reusing UI state for "Sign in Wallet"
      setDeploymentProgress(30)
    } else if (isConfirming) {
      setDeploymentStatus('deploying')
      setDeploymentProgress(80)
    } else if (isConfirmed) {
      setDeploymentStatus('success')
      setDeploymentProgress(100)
      toast.dismiss('deploy')
      toast.success('Agent deployed successfully on-chain! 🎉')

      // Save to local storage for persistence
      if (agentData) {
        const deployedAgents = JSON.parse(localStorage.getItem('stylus_deployed_agents') || '[]')
        // Use the transaction hash as a pseudo-ID
        const hash = txData?.hash
        const mockContractAddress = hash ? `0x${hash.slice(26, 66)}` : `0x${Date.now().toString(16).padStart(40, '0')}`
        setContractAddress(mockContractAddress)

        const newAgent = {
          id: `agent_${Date.now()}`,
          trainingId,
          contractAddress: mockContractAddress,
          gameType: agentData.gameType,
          deployedAt: new Date().toISOString(),
          status: 'active',
          accuracy: agentData.model.performance.accuracy,
          profit: 0
        }
        localStorage.setItem('stylus_deployed_agents', JSON.stringify([...deployedAgents, newAgent]))
      }
    }
  }, [isWritePending, isConfirming, isConfirmed, txData, agentData, trainingId])


  // Load agent data
  useEffect(() => {
    const type = searchParams.get('type')

    if (type === 'trading') {
      // Real World Trading Strategy
      const strategyJson = localStorage.getItem('stylus_trading_strategy')
      if (strategyJson) {
        const strategy = JSON.parse(strategyJson)
        setAgentData({
          trainingId: `strat_${strategy.timestamp}`,
          gameType: 'trading',
          isRealWorld: true,
          config: strategy,
          model: {
            algorithm: 'Behavioral Analysis',
            performance: {
              // Map "Risk Score" or similar to a confidence metric for UI compatibility
              accuracy: strategy.parameters.riskTolerance === 'High' ? 0.92 : 0.88,
              loss: 0.12,
              epochs: 50,
              dataPoints: 100
            }
          }
        })
        setIsLoading(false)
        return
      }
    }

    if (type === 'tower') {
      const strategyJson = localStorage.getItem('stylus_liquidity_strategy')
      if (strategyJson) {
        const strategy = JSON.parse(strategyJson)
        setAgentData({
          trainingId: `strat_${strategy.timestamp}`,
          gameType: 'tower',
          isRealWorld: true,
          config: strategy,
          model: {
            algorithm: 'Liquidity Optimization',
            performance: {
              accuracy: 0.95,
              loss: 0.05,
              epochs: 30,
              dataPoints: 120
            }
          }
        })
        setIsLoading(false)
        return
      }
    }

    if (type === 'resource') {
      const strategyJson = localStorage.getItem('stylus_yield_strategy')
      if (strategyJson) {
        const strategy = JSON.parse(strategyJson)
        setAgentData({
          trainingId: `strat_${strategy.timestamp}`,
          gameType: 'resource',
          isRealWorld: true,
          config: strategy,
          model: {
            algorithm: 'Yield Optimization',
            performance: {
              accuracy: 0.94,
              loss: 0.06,
              epochs: 40,
              dataPoints: 150
            }
          }
        })
        setIsLoading(false)
        return
      }
    }

    if (type === 'strategy') {
      const strategyJson = localStorage.getItem('stylus_portfolio_config')
      if (strategyJson) {
        const strategy = JSON.parse(strategyJson)
        setAgentData({
          trainingId: `strat_${strategy.timestamp}`,
          gameType: 'strategy',
          isRealWorld: true,
          config: strategy,
          model: {
            algorithm: 'Portfolio Management',
            performance: {
              accuracy: 0.91,
              loss: 0.09,
              epochs: 60,
              dataPoints: 200
            }
          }
        })
        setIsLoading(false)
        return
      }
    }

    if (trainingId) {
      const models = JSON.parse(localStorage.getItem('stylus_trained_models') || '[]')
      const model = models.find((m: any) => m.id === trainingId)
      if (model) {
        setAgentData({
          trainingId: model.id,
          gameType: model.gameType,
          model: {
            algorithm: 'Q-Learning',
            performance: {
              accuracy: model.accuracy,
              loss: model.loss,
              epochs: 20,
              dataPoints: 150
            }
          }
        })
        setIsLoading(false)
      } else {
        // Fallback code...
        setAgentData({
          trainingId,
          gameType: 'racing',
          model: {
            algorithm: 'Q-Learning',
            performance: {
              accuracy: 0.85,
              loss: 0.15,
              epochs: 20,
              dataPoints: 200
            }
          }
        })
        setIsLoading(false)
      }
    } else {
      setIsLoading(false)
    }
  }, [trainingId, searchParams])

  const handleDeploy = async () => {
    if (!agentData) {
      toast.error('No agent data found')
      return
    }

    try {
      toast.loading('Deploying agent locally...', { id: 'deploy' })
      setDeploymentStatus('generating')
      setDeploymentProgress(20)

      // Simulate deployment progress (LOCAL ONLY - no blockchain)
      await new Promise(r => setTimeout(r, 800))
      setDeploymentProgress(50)
      setDeploymentStatus('deploying')

      await new Promise(r => setTimeout(r, 1000))
      setDeploymentProgress(80)

      // Generate mock contract address
      const mockContract = manualAgentAddress || `0x${Date.now().toString(16).padStart(40, '0')}`
      setContractAddress(mockContract)

      // Save to localStorage
      const deployedAgents = JSON.parse(localStorage.getItem('stylus_deployed_agents') || '[]')
      const newAgent = {
        id: `agent_${Date.now()}`,
        trainingId,
        contractAddress: mockContract,
        gameType: agentData.gameType,
        deployedAt: new Date().toISOString(),
        status: 'active',
        accuracy: agentData.model.performance.accuracy,
        profit: 0
      }
      localStorage.setItem('stylus_deployed_agents', JSON.stringify([...deployedAgents, newAgent]))

      await new Promise(r => setTimeout(r, 500))
      setDeploymentProgress(100)
      setDeploymentStatus('success')
      toast.dismiss('deploy')
      toast.success('Agent deployed successfully (Local Simulation)! 🎉')

    } catch (error: any) {
      console.error(error)
      setDeploymentStatus('failed')
      toast.dismiss('deploy')
      toast.error(error.message || 'Deployment failed')
    }
  }

  if (isLoading) return <div className="min-h-screen bg-[#0A0E27]"><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Loading...</p></div></div>
  if (!agentData) return <div className="min-h-screen bg-[#0A0E27]"><Navbar /><div className="p-10 text-center text-white">No data</div></div>

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Deploy Agent</h1>
              <p className="text-gray-400">Deploy your trained AI agent as a Stylus contract on Arbitrum</p>
            </div>
            <div className="flex gap-2">
              {/* Connection Status Indicator */}
              <div className={`px-3 py-1 rounded-full text-xs font-mono border ${hasProfileData ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}>
                {hasProfileData ? 'PROFILE ACTIVE' : 'NO PROFILE'}
              </div>
              <Link href="/training">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-4 py-2 bg-[#1A1F3A] hover:bg-[#252B45] text-gray-300 rounded-lg border border-[#2A2F4A] transition-all"
                >
                  ← Back to Training
                </motion.button>
              </Link>
            </div>
          </div>
        </div>

        {/* PROFILE CREATION WALL */}
        {userAddress && showProfileForm && !hasProfileData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-6"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="bg-yellow-500/20 p-4 rounded-full">
                <span className="text-3xl">🆔</span>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Player Profile Required</h3>
                <p className="text-gray-300 mb-4">
                  You must create an on-chain player profile before deploying agents. This tracks your XP, level, and reputation.
                </p>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter Username (e.g. Satoshi)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-[#0A0E27] border border-[#2A2F4A] rounded-lg px-4 py-2 text-white focus:border-yellow-500 outline-none"
                  />
                  <button
                    onClick={() => {
                      console.log("Creating profile for:", username)
                      createProfile({
                        args: [username || 'Player'],
                        // Force high gas limit to bypass estimation errors on Stylus Testnet
                        gas: BigInt(30000000)
                      })
                    }}
                    disabled={!createProfile || isCreatingProfile || isProfileConfirming}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {isCreatingProfile || isProfileConfirming ? 'Creating...' : 'Create Profile'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Agent Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Details */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Agent Details</h2>

              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Game Type</div>
                  <div className="text-lg font-semibold text-white capitalize">{agentData.gameType}</div>
                </div>

                {agentData.isRealWorld ? (
                  <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-4 border border-blue-500/20">
                    <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2">
                      <span>🌍</span> Real World Strategy Config
                    </h3>
                    {agentData.gameType === 'trading' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Strategy Type</span>
                          <span className="font-bold text-white text-right">{agentData.config.parameters.strategy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Risk Tolerance</span>
                          <span className={`font-bold ${agentData.config.parameters.riskTolerance === 'High' ? 'text-red-400' :
                            agentData.config.parameters.riskTolerance === 'Low' ? 'text-green-400' : 'text-yellow-400'
                            }`}>{agentData.config.parameters.riskTolerance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rebalance Freq</span>
                          <span className="text-white">{agentData.config.parameters.rebalanceFrequency}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                          <span className="text-gray-400">Stop Loss / Take Profit</span>
                          <span className="text-white font-mono">{agentData.config.parameters.stopLoss} / {agentData.config.parameters.takeProfit}</span>
                        </div>
                      </div>
                    ) : agentData.gameType === 'tower' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Liquidity Shape</span>
                          <span className="font-bold text-white text-right">{agentData.config.parameters.liquidityShape}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Mgmt Style</span>
                          <span className={`font-bold ${agentData.config.parameters.managementStyle.includes("Active") ? 'text-green-400' : 'text-blue-400'
                            }`}>{agentData.config.parameters.managementStyle}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rebalance</span>
                          <span className="text-white">{agentData.config.parameters.rebalanceThreshold}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                          <span className="text-gray-400">Target / Fee</span>
                          <span className="text-white font-mono">ETH-USDC / {agentData.config.parameters.feeTier}</span>
                        </div>
                      </div>
                    ) : agentData.gameType === 'resource' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Yield Strategy</span>
                          <span className="font-bold text-white text-right">{agentData.config.parameters.strategyType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Liquidity Pref</span>
                          <span className={`font-bold ${agentData.config.parameters.liquidityPreference.includes("High") ? 'text-green-400' : 'text-amber-400'
                            }`}>{agentData.config.parameters.liquidityPreference.split(" ")[0]}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Gas Strategy</span>
                          <span className="text-white">{agentData.config.parameters.gasStrategy}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                          <span className="text-gray-400">Pools / Risk</span>
                          <span className="text-white font-mono">Aave, Cmpd / {agentData.config.parameters.riskLevel}</span>
                        </div>
                      </div>
                    ) : agentData.gameType === 'strategy' ? (
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Portfolio Type</span>
                          <span className="font-bold text-arbitrum-cyan text-right">{agentData.config.parameters.portfolioType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Allocation</span>
                          <span className="text-white text-xs">{agentData.config.parameters.allocation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Rebalance</span>
                          <span className="text-white">{agentData.config.parameters.rebalanceFrequency}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/10 pt-2 mt-2">
                          <span className="text-gray-400">Risk Score</span>
                          <span className={`font-mono font-bold ${agentData.config.parameters.riskScore.startsWith("8") ? 'text-red-400' :
                            agentData.config.parameters.riskScore.startsWith("2") ? 'text-green-400' : 'text-yellow-400'
                            }`}>{agentData.config.parameters.riskScore}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-400 italic">Config data not available</div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Accuracy</div>
                        <div className="text-2xl font-bold text-green-400">
                          {(agentData.model.performance.accuracy * 100).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Loss</div>
                        <div className="text-2xl font-bold text-red-400">
                          {agentData.model.performance.loss.toFixed(4)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Epochs</div>
                        <div className="text-lg font-semibold text-white">{agentData.model.performance.epochs}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Data Points</div>
                        <div className="text-lg font-semibold text-white">{agentData.model.performance.dataPoints}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Contract Preview */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Stylus Contract Preview</h2>

              <div className="bg-[#1A1F3A] rounded-lg p-4 border border-[#2A2F4A] overflow-x-auto">
                <pre className="text-sm text-gray-300 font-mono">
                  {`// Generated Stylus Contract
// Game Type: ${agentData.gameType}
// Algorithm: ${agentData.model.algorithm}

#[no_mangle]
pub extern "C" fn make_decision(
    state: &GameState
) -> Action {
    // Trained model logic
    // Accuracy: ${(agentData.model.performance.accuracy * 100).toFixed(1)}%
    // Based on ${agentData.model.performance.dataPoints} training samples
    
    // Decision logic here...
    Action::Optimal
}`}
                </pre>
              </div>
            </div>

            {/* Deployment Status */}
            {deploymentStatus !== 'idle' && (
              <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Deployment Status</h2>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-400 mb-2">
                      <span>
                        {deploymentStatus === 'generating' && 'Waiting for Wallet Confirmation...'}
                        {deploymentStatus === 'deploying' && 'Confirming on Arbitrum Sepolia...'}
                        {deploymentStatus === 'success' && 'Confirmed on Blockchain!'}
                        {deploymentStatus === 'failed' && 'Transaction Failed'}
                      </span>
                      <span>{deploymentProgress}%</span>
                    </div>
                    <div className="w-full bg-[#1A1F3A] rounded-full h-3 border border-[#2A2F4A] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${deploymentProgress}%` }}
                        transition={{ duration: 0.5 }}
                        className={`h-full ${deploymentStatus === 'success'
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                          : deploymentStatus === 'failed'
                            ? 'bg-gradient-to-r from-red-500 to-pink-500'
                            : 'bg-gradient-to-r from-arbitrum-cyan to-blue-500'
                          }`}
                      />
                    </div>
                  </div>

                  {deploymentStatus === 'success' && contractAddress && (
                    <div className="bg-[#1A1F3A] rounded-lg p-4 border border-[#2A2F4A]">
                      <div className="text-sm text-gray-400 mb-2">Contract Address</div>
                      <div className="text-lg font-mono text-arbitrum-cyan break-all">{contractAddress}</div>
                      <div className="mt-4 flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-[#252B45] hover:bg-[#2A2F4A] text-gray-300 rounded-lg border border-[#2A2F4A] transition-all text-sm"
                          onClick={() => {
                            navigator.clipboard.writeText(contractAddress)
                            toast.success('Address copied!')
                          }}
                        >
                          Copy Address
                        </motion.button>
                        <Link href={`/agents/analytics?address=${contractAddress}`}>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="px-4 py-2 bg-gradient-to-r from-arbitrum-cyan to-blue-500 hover:opacity-90 text-white rounded-lg transition-all text-sm"
                          >
                            View Analytics
                          </motion.button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Deployment Actions */}
          <div className="space-y-6">
            {/* Deployment Card */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h2 className="text-xl font-bold text-white mb-4">Deploy to Arbitrum</h2>

              <div className="space-y-4 mb-6">
                <div className="bg-[#1A1F3A] rounded-lg p-4 border border-[#2A2F4A]">
                  <div className="text-sm text-gray-400 mb-1">Estimated Gas</div>
                  <div className="text-2xl font-bold text-white">~0.001 ETH</div>
                </div>

                <div className="bg-[#1A1F3A] rounded-lg p-4 border border-[#2A2F4A]">
                  <div className="text-sm text-gray-400 mb-1">Network</div>
                  <div className="text-lg font-semibold text-white">Arbitrum Sepolia</div>
                </div>

                <div className="bg-[#1A1F3A] rounded-lg p-4 border border-[#2A2F4A]">
                  <div className="text-sm text-gray-400 mb-2">Agent Logic Contract</div>
                  <input
                    type="text"
                    placeholder="0x... (From cargo stylus deploy)"
                    value={manualAgentAddress}
                    onChange={(e) => setManualAgentAddress(e.target.value)}
                    className="w-full bg-[#0A0E27] border border-[#2A2F4A] rounded p-2 text-sm text-white focus:border-arbitrum-cyan outline-none font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">Paste the address of your deployed Stylus contract here.</p>
                </div>
              </div>

              {deploymentStatus === 'success' ? (
                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      const listings = JSON.parse(localStorage.getItem('stylus_marketplace_listings') || '[]')
                      const newListing = {
                        id: contractAddress,
                        agent: contractAddress,
                        seller: userAddress,
                        price: "100000000000000000", // 0.1 ETH
                        isActive: true,
                        local: true
                      }
                      localStorage.setItem('stylus_marketplace_listings', JSON.stringify([...listings, newListing]))
                      toast.success('Agent listed on Marketplace (Local)!')
                      setTimeout(() => window.location.href = '/marketplace', 1000)
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-bold rounded-xl transition-all"
                  >
                    List on Marketplace
                  </motion.button>
                  <Link href="/agents/analytics">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-[#1A1F3A] hover:bg-[#252B45] text-gray-300 rounded-xl border border-[#2A2F4A] transition-all"
                    >
                      View Analytics
                    </motion.button>
                  </Link>
                </div>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDeploy}
                  disabled={isDeploying || deploymentStatus !== 'idle'}
                  className="w-full px-6 py-3 bg-gradient-to-r from-arbitrum-cyan to-blue-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {isDeploying ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Deploying...
                    </>
                  ) : (
                    <>
                      <span className="text-xl">🚀</span>
                      Deploy Agent
                    </>
                  )}
                </motion.button>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h3 className="text-lg font-bold text-white mb-3">What happens next?</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">✓</span>
                  <span>Contract deployed to Arbitrum</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">✓</span>
                  <span>Agent starts working autonomously</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">✓</span>
                  <span>Track performance in Analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">✓</span>
                  <span>List on Marketplace to earn</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function DeployPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-arbitrum-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <DeployContent />
    </Suspense>
  )
}
