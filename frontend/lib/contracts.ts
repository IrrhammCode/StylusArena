import { Address } from 'viem'

// Contract ABI - akan di-generate dari compiled contract
export const stylusArenaABI = [
  // User Profile Functions
  {
    name: 'createProfile',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_username', type: 'string' }],
    outputs: [],
  },
  {
    name: 'addXP',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_amount', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'updateGameStats',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_won', type: 'bool' }],
    outputs: [],
  },
  {
    name: 'updateAgentStats',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_trained', type: 'bool' },
      { name: '_deployed', type: 'bool' },
    ],
    outputs: [],
  },
  {
    name: 'getUserProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [
      {
        components: [
          { name: 'username', type: 'string' },
          { name: 'level', type: 'uint256' },
          { name: 'xp', type: 'uint256' },
          { name: 'totalXP', type: 'uint256' },
          { name: 'gamesPlayed', type: 'uint256' },
          { name: 'agentsTrained', type: 'uint256' },
          { name: 'agentsDeployed', type: 'uint256' },
          { name: 'wins', type: 'uint256' },
          { name: 'losses', type: 'uint256' },
          { name: 'achievementsUnlocked', type: 'uint256' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'lastActiveAt', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getWinRate',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'hasProfile',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
  // Achievement Functions
  {
    name: 'unlockAchievement',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_achievementId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'hasAchievement',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_user', type: 'address' },
      { name: '_achievementId', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'achievementCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'achievements',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'icon', type: 'string' },
          { name: 'category', type: 'uint8' },
          { name: 'rarity', type: 'uint8' },
          { name: 'xpReward', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  // Tournament Functions
  {
    name: 'createTournament',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_description', type: 'string' },
      { name: '_gameType', type: 'uint8' },
      { name: '_startTime', type: 'uint256' },
      { name: '_endTime', type: 'uint256' },
      { name: '_prizePool', type: 'uint256' },
      { name: '_entryFee', type: 'uint256' },
      { name: '_maxParticipants', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'joinTournament',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: '_tournamentId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'tournamentCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'tournaments',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'gameType', type: 'uint8' },
          { name: 'startTime', type: 'uint256' },
          { name: 'endTime', type: 'uint256' },
          { name: 'prizePool', type: 'uint256' },
          { name: 'entryFee', type: 'uint256' },
          { name: 'maxParticipants', type: 'uint256' },
          { name: 'currentParticipants', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'participants', type: 'address[]' },
          { name: 'winner', type: 'address' },
          { name: 'creator', type: 'address' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  // Battle Functions
  {
    name: 'createBattle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_agent2', type: 'address' },
      { name: '_gameType', type: 'uint8' },
      { name: '_prize', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'battleCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'battles',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'agent1', type: 'address' },
          { name: 'agent2', type: 'address' },
          { name: 'gameType', type: 'uint8' },
          { name: 'prize', type: 'uint256' },
          { name: 'status', type: 'uint8' },
          { name: 'winner', type: 'address' },
          { name: 'createdAt', type: 'uint256' },
          { name: 'completedAt', type: 'uint256' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  // Challenge Functions
  {
    name: 'updateChallengeProgress',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_challengeId', type: 'uint256' },
      { name: '_progress', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'challengeCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'challenges',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'name', type: 'string' },
          { name: 'description', type: 'string' },
          { name: 'challengeType', type: 'uint8' },
          { name: 'gameType', type: 'uint8' },
          { name: 'target', type: 'uint256' },
          { name: 'xpReward', type: 'uint256' },
          { name: 'tokenReward', type: 'uint256' },
          { name: 'expiresAt', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'challengeProgress',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '', type: 'address' },
      { name: '', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Agent Management Functions
  {
    name: 'registerAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_name', type: 'string' },
      { name: '_gameType', type: 'uint8' },
      { name: '_contractAddress', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'updateAgentMetrics',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_agent', type: 'address' },
      { name: '_accuracy', type: 'uint256' },
      { name: '_winRate', type: 'uint256' },
      { name: '_profit', type: 'int256' },
    ],
    outputs: [],
  },
  {
    name: 'getAgentInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_agent', type: 'address' }],
    outputs: [
      {
        components: [
          { name: 'owner', type: 'address' },
          { name: 'name', type: 'string' },
          { name: 'gameType', type: 'uint8' },
          { name: 'contractAddress', type: 'address' },
          { name: 'accuracy', type: 'uint256' },
          { name: 'winRate', type: 'uint256' },
          { name: 'profit', type: 'int256' },
          { name: 'deployedAt', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  {
    name: 'getUserAgents',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    name: 'agentCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  // Marketplace Functions
  {
    name: 'listAgent',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_agent', type: 'address' },
      { name: '_price', type: 'uint256' },
    ],
    outputs: [],
  },
  {
    name: 'buyAgent',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'cancelListing',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [],
  },
  {
    name: 'listingCount',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'getListing',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_listingId', type: 'uint256' }],
    outputs: [
      {
        components: [
          { name: 'agent', type: 'address' },
          { name: 'seller', type: 'address' },
          { name: 'price', type: 'uint256' },
          { name: 'isActive', type: 'bool' },
        ],
        name: '',
        type: 'tuple',
      },
    ],
  },
  // Social Functions
  {
    name: 'addFriend',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: '_friend', type: 'address' }],
    outputs: [],
  },
  {
    name: 'getFriends',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '_user', type: 'address' }],
    outputs: [{ name: '', type: 'address[]' }],
  },
  {
    name: 'areFriends',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: '_user1', type: 'address' },
      { name: '_user2', type: 'address' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  // Events
  {
    type: 'event',
    name: 'ProfileCreated',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'username', type: 'string', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'LevelUp',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'newLevel', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'AchievementUnlocked',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'achievementId', type: 'uint256', indexed: false },
    ],
  },
] as const

// Contract address - will be set from .env.local after deployment
// Format: NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
export const STYLUS_ARENA_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as Address) ||
  '0x83e20eC2522DBDC908479e39bf0997131849D638'

// Helper functions
export const contractConfig = {
  address: STYLUS_ARENA_ADDRESS,
  abi: stylusArenaABI,
} as const

// Type helpers
export interface UserProfile {
  username: string
  level: bigint
  xp: bigint
  totalXP: bigint
  gamesPlayed: bigint
  agentsTrained: bigint
  agentsDeployed: bigint
  wins: bigint
  losses: bigint
  achievementsUnlocked: bigint
  createdAt: bigint
  lastActiveAt: bigint
}

export interface Achievement {
  name: string
  description: string
  icon: string
  category: number // 0=game, 1=training, 2=agent, 3=social, 4=special
  rarity: number // 0=common, 1=rare, 2=epic, 3=legendary
  xpReward: bigint
  isActive: boolean
}

export interface Tournament {
  name: string
  description: string
  gameType: number
  startTime: bigint
  endTime: bigint
  prizePool: bigint
  entryFee: bigint
  maxParticipants: bigint
  currentParticipants: bigint
  status: number // 0=upcoming, 1=active, 2=completed
  participants: Address[]
  winner: Address
  creator: Address
}

export interface Battle {
  agent1: Address
  agent2: Address
  gameType: number
  prize: bigint
  status: number // 0=pending, 1=active, 2=completed
  winner: Address
  createdAt: bigint
  completedAt: bigint
}

export interface Challenge {
  name: string
  description: string
  challengeType: number // 0=daily, 1=weekly, 2=special
  gameType: number
  target: bigint
  xpReward: bigint
  tokenReward: bigint
  expiresAt: bigint
  isActive: boolean
}

export interface AgentInfo {
  owner: Address
  name: string
  gameType: number
  contractAddress: Address
  accuracy: bigint
  winRate: bigint
  profit: bigint
  deployedAt: bigint
  isActive: boolean
}

export interface Listing {
  agent: Address
  seller: Address
  price: bigint
  isActive: boolean
}


