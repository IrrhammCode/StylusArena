'use client'

import { useState, useEffect, Suspense } from 'react'
import { Navbar } from '../../components/Navbar'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { toast } from 'react-hot-toast'

interface TestResult {
  scenario: string
  agentAction: string
  expectedAction: string
  match: boolean
  score: number
}

function TestContent() {
  const searchParams = useSearchParams()
  const trainingId = searchParams.get('trainingId')
  const [agentData, setAgentData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isTesting, setIsTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [overallScore, setOverallScore] = useState(0)

  useEffect(() => {
    if (trainingId) {
      fetchAgentData(trainingId)
    } else {
      setIsLoading(false)
    }
  }, [trainingId])

  const fetchAgentData = async (id: string) => {
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800))

      const models = JSON.parse(localStorage.getItem('stylus_trained_models') || '[]')
      const model = models.find((m: any) => m.id === id)

      if (model) {
        setAgentData({
          id: model.id,
          gameType: model.gameType,
          model: {
            performance: {
              accuracy: model.accuracy,
              epochs: 20,
              dataPoints: 150
            }
          }
        })
      } else {
        // Fallback for demo if id not found (mock it)
        setAgentData({
          id: id,
          gameType: id.startsWith('race') ? 'racing' : 'strategy',
          model: {
            performance: {
              accuracy: 0.88,
              epochs: 20,
              dataPoints: 150
            }
          }
        })
      }
      setIsLoading(false)
    } catch (error: any) {
      console.error('Failed to fetch agent data:', error)
      toast.error('Failed to load local agent data')
      setIsLoading(false)
    }
  }

  const handleTest = async () => {
    setIsTesting(true)
    toast.loading('Running tests...', { id: 'test' })

    // Simulate testing different scenarios
    await new Promise(resolve => setTimeout(resolve, 2000))

    const scenarios = [
      { name: 'High Risk', agent: 'Defend', expected: 'Defend', match: true },
      { name: 'Low Risk', agent: 'Attack', expected: 'Attack', match: true },
      { name: 'Medium Risk', agent: 'Attack', expected: 'Defend', match: false },
      { name: 'Optimal Entry', agent: 'Buy', expected: 'Buy', match: true },
      { name: 'Optimal Exit', agent: 'Sell', expected: 'Sell', match: true },
    ]

    const results: TestResult[] = scenarios.map(scenario => ({
      scenario: scenario.name,
      agentAction: scenario.agent,
      expectedAction: scenario.expected,
      match: scenario.match,
      score: scenario.match ? 100 : 0,
    }))

    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length

    setTestResults(results)
    setOverallScore(avgScore)
    setIsTesting(false)

    toast.dismiss('test')
    toast.success(`Testing complete! Score: ${avgScore.toFixed(1)}%`)

    // Trigger notification if score is good
    if (avgScore >= 80 && (window as any).addNotification) {
      ; (window as any).addNotification({
        type: 'success',
        title: 'Agent Ready!',
        message: `Your agent scored ${avgScore.toFixed(1)}% and is ready to deploy.`,
        action: { label: 'Deploy Now', href: `/agents/deploy?trainingId=${trainingId}` },
      })
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
              <span className="text-4xl">🧪</span>
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
              <h1 className="text-4xl font-bold text-white mb-2">Agent Testing Ground</h1>
              <p className="text-gray-400">Test your agent before deployment</p>
            </div>
            <div className="flex gap-3">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Agent Info & Test */}
          <div className="lg:col-span-2 space-y-6">
            {/* Agent Info */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Agent Information</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Game Type</div>
                  <div className="text-lg font-semibold text-white capitalize">{agentData.gameType}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Training Accuracy</div>
                  <div className="text-lg font-semibold text-green-400">
                    {(agentData.model.performance.accuracy * 100).toFixed(1)}%
                  </div>
                </div>
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

            {/* Test Scenarios */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Test Scenarios</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleTest}
                  disabled={isTesting}
                  className="px-6 py-2 bg-gradient-to-r from-arbitrum-cyan to-blue-500 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all flex items-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <span>🧪</span>
                      Run Tests
                    </>
                  )}
                </motion.button>
              </div>

              {testResults.length > 0 && (
                <div className="space-y-3">
                  {testResults.map((result, idx) => (
                    <div
                      key={idx}
                      className="bg-[#1A1F3A] rounded-lg p-4 border border-[#2A2F4A]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${result.match ? 'bg-green-400' : 'bg-red-400'
                            }`} />
                          <span className="font-semibold text-white">{result.scenario}</span>
                        </div>
                        <span className={`font-bold ${result.match ? 'text-green-400' : 'text-red-400'
                          }`}>
                          {result.score}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                        <div>
                          <span className="text-gray-400">Agent: </span>
                          <span className="text-white">{result.agentAction}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Expected: </span>
                          <span className="text-white">{result.expectedAction}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {testResults.length === 0 && !isTesting && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">🧪</div>
                  <p>Click "Run Tests" to test your agent</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Results & Actions */}
          <div className="space-y-6">
            {/* Overall Score */}
            {testResults.length > 0 && (
              <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
                <h3 className="text-lg font-bold text-white mb-4">Overall Score</h3>

                <div className="text-center mb-4">
                  <div className="text-5xl font-bold text-arbitrum-cyan mb-2">
                    {overallScore.toFixed(1)}%
                  </div>
                  <div className={`text-sm font-semibold ${overallScore >= 80 ? 'text-green-400' :
                      overallScore >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                    }`}>
                    {overallScore >= 80 ? 'Ready to Deploy!' :
                      overallScore >= 60 ? 'Needs Improvement' :
                        'Not Ready'}
                  </div>
                </div>

                <div className="w-full bg-[#1A1F3A] rounded-full h-3 border border-[#2A2F4A] overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${overallScore}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-full ${overallScore >= 80 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                        overallScore >= 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                          'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                  />
                </div>

                {overallScore >= 80 ? (
                  <Link href={`/agents/deploy?trainingId=${trainingId}`}>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90 text-white font-bold rounded-xl transition-all"
                    >
                      Deploy Agent
                    </motion.button>
                  </Link>
                ) : (
                  <div className="text-center text-sm text-gray-400">
                    Improve training data and try again
                  </div>
                )}
              </div>
            )}

            {/* Info Card */}
            <div className="bg-[#0F1422] rounded-2xl border border-[#1A1F3A] p-6">
              <h3 className="text-lg font-bold text-white mb-3">About Testing</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">•</span>
                  <span>Tests agent in various scenarios</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">•</span>
                  <span>Compares actions with expected results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">•</span>
                  <span>Score ≥80% recommended for deployment</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-arbitrum-cyan mt-1">•</span>
                  <span>Improve training data if score is low</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function TestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0E27] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-arbitrum-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <TestContent />
    </Suspense>
  )
}

