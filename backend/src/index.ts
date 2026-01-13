import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
const PORT = 8000

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' }))

// In-memory storage (for demo)
interface TrainingSession {
    id: string
    gameType: string
    status: 'pending' | 'training' | 'completed' | 'failed'
    progress: number
    dataPoints: number
    startedAt: Date
    completedAt?: Date
    metrics?: {
        accuracy: number
        loss: number
        epochs: number
    }
}

interface GameplayRecord {
    id: string
    gameType: string
    data: any[]
    createdAt: Date
}

const trainingSessions: Map<string, TrainingSession> = new Map()
const gameplayRecords: Map<string, GameplayRecord> = new Map()

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Record gameplay data
app.post('/games/play', (req, res) => {
    const { gameType, gameplayData } = req.body

    if (!gameType || !gameplayData) {
        return res.status(400).json({ error: 'Missing gameType or gameplayData' })
    }

    const id = uuidv4()
    const record: GameplayRecord = {
        id,
        gameType,
        data: gameplayData,
        createdAt: new Date()
    }

    gameplayRecords.set(id, record)

    console.log(`📊 Recorded ${gameplayData.length} actions for ${gameType}`)

    res.json({
        success: true,
        recordId: id,
        dataPoints: gameplayData.length
    })
})

// Start training
app.post('/training/start', (req, res) => {
    const { gameType, gameplayData } = req.body

    if (!gameType) {
        return res.status(400).json({ error: 'Missing gameType' })
    }

    const trainingId = uuidv4()
    const dataPoints = gameplayData?.length || 0

    const session: TrainingSession = {
        id: trainingId,
        gameType,
        status: 'pending',
        progress: 0,
        dataPoints,
        startedAt: new Date()
    }

    trainingSessions.set(trainingId, session)

    console.log(`🚀 Training started: ${trainingId} for ${gameType} with ${dataPoints} data points`)

    // Simulate training progress
    simulateTraining(trainingId)

    res.json({
        success: true,
        trainingId,
        message: `Training started for ${gameType}`
    })
})

// Simulate training process
function simulateTraining(trainingId: string) {
    const session = trainingSessions.get(trainingId)
    if (!session) return

    session.status = 'training'

    let progress = 0
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5

        if (progress >= 100) {
            progress = 100
            session.status = 'completed'
            session.progress = 100
            session.completedAt = new Date()
            session.metrics = {
                accuracy: 0.85 + Math.random() * 0.1,
                loss: 0.1 + Math.random() * 0.05,
                epochs: 50 + Math.floor(Math.random() * 50)
            }
            console.log(`✅ Training completed: ${trainingId}`)
            clearInterval(interval)
        } else {
            session.progress = Math.floor(progress)
        }

        trainingSessions.set(trainingId, session)
    }, 1000)
}

// Get training status
app.get('/training/status/:trainingId', (req, res) => {
    const { trainingId } = req.params
    const session = trainingSessions.get(trainingId)

    if (!session) {
        return res.status(404).json({ error: 'Training session not found' })
    }

    res.json(session)
})

// List all training sessions
app.get('/training/list', (req, res) => {
    const sessions = Array.from(trainingSessions.values())
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())

    res.json({ sessions })
})

// Get agent info (mock)
app.get('/agents/:agentId', (req, res) => {
    res.json({
        id: req.params.agentId,
        name: 'AI Agent',
        status: 'active',
        performance: {
            winRate: 0.72,
            profitFactor: 1.5,
            sharpeRatio: 1.8
        }
    })
})

// Deploy agent (mock)
app.post('/agents/deploy', (req, res) => {
    const agentId = uuidv4()
    console.log(`🤖 Agent deployed: ${agentId}`)

    res.json({
        success: true,
        agentId,
        message: 'Agent deployed successfully'
    })
})

// Start server
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   🚀 StylusForge Backend Running                  ║
║                                                   ║
║   📍 URL: http://localhost:${PORT}                  ║
║                                                   ║
║   Endpoints:                                      ║
║   • POST /games/play      - Record gameplay       ║
║   • POST /training/start  - Start AI training    ║
║   • GET  /training/status - Check progress       ║
║   • GET  /training/list   - List all sessions    ║
║   • POST /agents/deploy   - Deploy agent         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
  `)
})
