// ... imports
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi'
import { STYLUS_ARENA_ADDRESS, stylusArenaABI } from '../../lib/contracts'
import { parseEther } from 'viem'

// Game type mapping matches Solidity contract
const GAME_TYPE_MAP: Record<string, number> = {
  'racing': 0,
  'battle': 1,
  'puzzle': 2,
  'trading': 3,
  'memory': 4,
  'card': 5
}

function DeployContent() {
  const searchParams = useSearchParams()
  const trainingId = searchParams.get('trainingId')
  const [agentData, setAgentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Wagmi Hooks
  const { address: userAddress } = useAccount()
  const { data: hash, isPending: isWritePending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  // Combined loading state
  const isDeploying = isWritePending || isConfirming

  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'generating' | 'deploying' | 'success' | 'failed'>('idle')
  const [deploymentProgress, setDeploymentProgress] = useState(0)

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
        // Use the transaction hash as a pseudo-ID for the agent contract in this demo
        const mockContractAddress = hash ? `0x${hash.slice(26, 66)}` : `0x${Date.now().toString(16).padStart(40, '0')}`

        const newAgent = {
          id: `agent_${Date.now()}`,
          trainingId,
          contractAddress: mockContractAddress, // In real Stylus, this would be computed
          gameType: agentData.gameType,
          deployedAt: new Date().toISOString(),
          status: 'active',
          accuracy: agentData.model.performance.accuracy,
          profit: 0
        }
        localStorage.setItem('stylus_deployed_agents', JSON.stringify([...deployedAgents, newAgent]))
      }
    }
  }, [isWritePending, isConfirming, isConfirmed, hash, agentData, trainingId])


  // ... (useEffect for loading agentData remains same)
  useEffect(() => {
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
  }, [trainingId])

  const handleDeploy = async () => {
    if (!agentData || !userAddress) {
      toast.error('Please connect wallet first')
      return
    }

    try {
      toast.loading('Please confirm transaction...', { id: 'deploy' })

      // For this hackathon demo, we "Deploy" by registering a placeholder address
      // In a full production Stylus app, we would deploy a WASM contract here.
      // We use a deterministic random address based on time for demo unique constraints
      const demoAgentAddress = `0x${Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}` as `0x${string}`

      writeContract({
        address: STYLUS_ARENA_ADDRESS,
        abi: stylusArenaABI,
        functionName: 'registerAgent',
        args: [
          `Agent ${agentData.gameType.toUpperCase()}`, // Name
          GAME_TYPE_MAP[agentData.gameType] || 0,      // Game Type Int
          demoAgentAddress                             // Agent Contract Address
        ],
      })

    } catch (error: any) {
      console.error(error)
      setDeploymentStatus('failed')
      toast.dismiss('deploy')
      toast.error(error.message || 'Deployment failed')
    }
  }

  // ... (Render logic mostly same, just updating disabled states)

  if (isLoading) return <div className="min-h-screen bg-[#0A0E27]"><Navbar /><div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Loading...</p></div></div>
  if (!agentData) return <div className="min-h-screen bg-[#0A0E27]"><Navbar /><div className="p-10 text-center text-white">No data</div></div>

  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* ... Header ... */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Deploy Agent</h1>
          <p className="text-gray-400">Deploy your trained AI agent to Arbitrum Sepolia</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Agent Info (Existing UI) */}
          <div className="lg:col-span-2 space-y-6">
            {/* ... Agent Details Card ... */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Agent Details</h2>
              <div className="space-y-4">
                <div>
                  <div className="text-sm text-gray-400">Game Type</div>
                  <div className="text-lg font-semibold text-white capitalize">{agentData.gameType}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><div className="text-sm text-gray-400">Accuracy</div><div className="text-2xl font-bold text-green-400">{(agentData.model.performance.accuracy * 100).toFixed(1)}%</div></div>
                </div>
              </div>
            </div>

            {/* Deployment Status */}
            {deploymentStatus !== 'idle' && (
              <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Deployment Status</h2>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>
                      {deploymentStatus === 'generating' && 'Waiting for Wallet Confirmation...'}
                      {deploymentStatus === 'deploying' && 'Confirming on Arbitrum Sepolia...'}
                      {deploymentStatus === 'success' && 'Confirmed on Blockchain!'}
                      {deploymentStatus === 'failed' && 'Transaction Failed'}
                    </span>
                    <span>{deploymentProgress}%</span>
                  </div>
                  <div className="w-full bg-[#1A1F3A] rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${deploymentProgress}%` }}
                      className={`h-full ${deploymentStatus === 'success' ? 'bg-green-500' : 'bg-arbitrum-cyan'}`}
                    />
                  </div>
                  {hash && <p className="text-xs text-gray-500 truncate">Tx: {hash}</p>}
                </div>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="space-y-6">
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h2 className="text-xl font-bold text-white mb-4">Deploy to Arbitrum</h2>

              {/* Gas Info */}
              <div className="bg-[#1A1F3A] rounded-lg p-4 border border-[#2A2F4A] mb-6">
                <div className="text-sm text-gray-400">Network</div>
                <div className="text-lg font-semibold text-white">Arbitrum Sepolia</div>
              </div>

              {isConfirmed ? (
                <Link href="/marketplace">
                  <motion.button whileHover={{ scale: 1.05 }} className="w-full px-6 py-3 bg-green-600 text-white font-bold rounded-xl">
                    View in Marketplace
                  </motion.button>
                </Link>
              ) : (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  onClick={handleDeploy}
                  disabled={isDeploying}
                  className="w-full px-6 py-3 bg-gradient-to-r from-arbitrum-cyan to-blue-500 hover:opacity-90 disabled:opacity-50 text-white font-bold rounded-xl flex justify-center items-center gap-2"
                >
                  {isDeploying ? 'Processing...' : '🚀 Deploy Agent (On-Chain)'}
                </motion.button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
const searchParams = useSearchParams()
const trainingId = searchParams.get('trainingId')
const [agentData, setAgentData] = useState<any>(null)
const [isLoading, setIsLoading] = useState(true)
const [isDeploying, setIsDeploying] = useState(false)
const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'generating' | 'deploying' | 'success' | 'failed'>('idle')
const [contractAddress, setContractAddress] = useState<string | null>(null)
const [deploymentProgress, setDeploymentProgress] = useState(0)

useEffect(() => {
  if (trainingId) {
    // Fetch from local storage instead of backend
    const models = JSON.parse(localStorage.getItem('stylus_trained_models') || '[]')
    const model = models.find((m: any) => m.id === trainingId)

    if (model) {
      // Construct mock agent data structure
      setAgentData({
        trainingId: model.id,
        gameType: model.gameType,
        model: {
          algorithm: 'Q-Learning',
          performance: {
            accuracy: model.accuracy,
            loss: model.loss,
            epochs: 20,
            dataPoints: 150 + Math.floor(Math.random() * 50)
          }
        }
      })
      setIsLoading(false)
    } else {
      // Fallback for demo if not found
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
}, [trainingId])

const handleDeploy = async () => {
  if (!agentData) return

  setIsDeploying(true)
  setDeploymentStatus('generating')
  setDeploymentProgress(20)

  try {
    // Step 1: Generate Stylus contract code
    toast.loading('Generating Stylus contract...', { id: 'deploy' })

    await new Promise(resolve => setTimeout(resolve, 2000))
    setDeploymentProgress(50)
    setDeploymentStatus('deploying')

    // Step 2: Deploy to Arbitrum
    toast.loading('Deploying to Arbitrum...', { id: 'deploy' })

    await new Promise(resolve => setTimeout(resolve, 3000))
    setDeploymentProgress(100)

    // Simulate deployment
    const mockAddress = `0x${Math.random().toString(16).substr(2, 40)}`
    setContractAddress(mockAddress)
    setDeploymentStatus('success')

    toast.dismiss('deploy')
    toast.success('Agent deployed successfully! 🎉')

    // Save deployment info to LocalStorage
    const deployedAgents = JSON.parse(localStorage.getItem('stylus_deployed_agents') || '[]')
    const newAgent = {
      id: `agent_${Date.now()}`,
      trainingId,
      contractAddress: mockAddress,
      gameType: agentData.gameType,
      deployedAt: new Date().toISOString(),
      status: 'active',
      accuracy: agentData.model.performance.accuracy,
      profit: 0
    }
    localStorage.setItem('stylus_deployed_agents', JSON.stringify([...deployedAgents, newAgent]))

    // Trigger notification
    if ((window as any).addNotification) {
      ; (window as any).addNotification({
        type: 'success',
        title: 'Agent Deployed!',
        message: `Your agent is now live on Arbitrum at ${mockAddress.slice(0, 10)}...`,
        action: { label: 'View Analytics', href: `/agents/analytics?address=${mockAddress}` },
      })
    }

  } catch (error: any) {
    setDeploymentStatus('failed')
    toast.dismiss('deploy')
    toast.error(error.message || 'Deployment failed')
  } finally {
    setIsDeploying(false)
  }
}

if (isLoading) {
  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-arbitrum-cyan border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading agent data...</p>
        </div>
      </div>
    </div>
  )
}

if (!agentData) {
  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-[#1A1F3A] flex items-center justify-center">
            <span className="text-4xl">🤖</span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">No Agent Data</h3>
          <p className="text-gray-400 mb-6">Please complete training first</p>
          <Link href="/training">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-3 bg-gradient-to-r from-arbitrum-cyan to-blue-500 hover:opacity-90 text-white font-bold rounded-xl transition-all"
            >
              Go to Training
            </motion.button>
          </Link>
        </div>
      </div>
    </div>
  )
}

return (
  <div className="min-h-screen bg-[#0A0E27]">
    <Navbar />

    <main className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Deploy Agent</h1>
            <p className="text-gray-400">Deploy your trained AI agent as a Stylus contract on Arbitrum</p>
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
                      {deploymentStatus === 'generating' && 'Generating contract...'}
                      {deploymentStatus === 'deploying' && 'Deploying to Arbitrum...'}
                      {deploymentStatus === 'success' && 'Deployment complete!'}
                      {deploymentStatus === 'failed' && 'Deployment failed'}
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
                <div className="text-lg font-semibold text-white">Arbitrum One</div>
              </div>
            </div>

            {deploymentStatus === 'success' ? (
              <div className="space-y-3">
                <Link href="/marketplace">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-bold rounded-xl transition-all"
                  >
                    List on Marketplace
                  </motion.button>
                </Link>
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

