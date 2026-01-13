import { useAccount, useContractRead, useContractWrite, useWaitForTransaction } from 'wagmi'
import { contractConfig, type UserProfile, type Achievement, type Tournament, type Battle, type Challenge } from '../lib/contracts'
import { Address } from 'viem'
import { useMemo } from 'react'

// Hook untuk user profile
export function useUserProfile(userAddress?: Address) {
  const { address } = useAccount()
  const targetAddress = userAddress || address

  const { data: hasProfile, isLoading: loadingProfile } = useContractRead({
    ...contractConfig,
    functionName: 'hasProfile',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress,
  })

  const { data: profile, isLoading: loadingUser } = useContractRead({
    ...contractConfig,
    functionName: 'getUserProfile',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress && hasProfile,
  })

  const { data: winRate } = useContractRead({
    ...contractConfig,
    functionName: 'getWinRate',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress && hasProfile,
  })

  return {
    profile: profile as UserProfile | undefined,
    hasProfile: hasProfile as boolean | undefined,
    winRate: winRate ? Number(winRate) / 100 : 0,
    isLoading: loadingProfile || loadingUser,
  }
}

// Hook untuk create profile
export function useCreateProfile() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'createProfile',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    createProfile: (username: string) => write({ args: [username] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// Hook untuk add XP
export function useAddXP() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'addXP',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    addXP: (amount: bigint) => write({ args: [amount] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// Hook untuk update game stats
export function useUpdateGameStats() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'updateGameStats',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    updateGameStats: (won: boolean) => write({ args: [won] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// Hook untuk update agent stats
export function useUpdateAgentStats() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'updateAgentStats',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    updateAgentStats: (trained: boolean, deployed: boolean) => 
      write({ args: [trained, deployed] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// Hook untuk achievements
export function useAchievements() {
  const { data: count } = useContractRead({
    ...contractConfig,
    functionName: 'achievementCount',
  })

  const achievementIds = useMemo(() => {
    if (!count) return []
    return Array.from({ length: Number(count) }, (_, i) => i)
  }, [count])

  return {
    count: count ? Number(count) : 0,
    achievementIds,
  }
}

export function useAchievement(achievementId: number) {
  const { data: achievement, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'achievements',
    args: [BigInt(achievementId)],
  })

  return {
    achievement: achievement as Achievement | undefined,
    isLoading,
  }
}

export function useHasAchievement(userAddress: Address, achievementId: number) {
  const { data: hasAchievement, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'hasAchievement',
    args: [userAddress, BigInt(achievementId)],
  })

  return {
    hasAchievement: hasAchievement as boolean | undefined,
    isLoading,
  }
}

export function useUnlockAchievement() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'unlockAchievement',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    unlockAchievement: (achievementId: number) => 
      write({ args: [BigInt(achievementId)] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// Hook untuk tournaments
export function useTournaments() {
  const { data: count } = useContractRead({
    ...contractConfig,
    functionName: 'tournamentCount',
  })

  const tournamentIds = useMemo(() => {
    if (!count) return []
    return Array.from({ length: Number(count) }, (_, i) => i)
  }, [count])

  return {
    count: count ? Number(count) : 0,
    tournamentIds,
  }
}

export function useTournament(tournamentId: number) {
  const { data: tournament, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'tournaments',
    args: [BigInt(tournamentId)],
  })

  return {
    tournament: tournament as Tournament | undefined,
    isLoading,
  }
}

export function useCreateTournament() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'createTournament',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    createTournament: (
      name: string,
      description: string,
      gameType: number,
      startTime: bigint,
      endTime: bigint,
      prizePool: bigint,
      entryFee: bigint,
      maxParticipants: bigint,
      value: bigint
    ) => write({
      args: [name, description, gameType, startTime, endTime, prizePool, entryFee, maxParticipants],
      value,
    }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

export function useJoinTournament() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'joinTournament',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    joinTournament: (tournamentId: number, entryFee: bigint) => 
      write({
        args: [BigInt(tournamentId)],
        value: entryFee,
      }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// Hook untuk battles
export function useBattles() {
  const { data: count } = useContractRead({
    ...contractConfig,
    functionName: 'battleCount',
  })

  const battleIds = useMemo(() => {
    if (!count) return []
    return Array.from({ length: Number(count) }, (_, i) => i)
  }, [count])

  return {
    count: count ? Number(count) : 0,
    battleIds,
  }
}

export function useBattle(battleId: number) {
  const { data: battle, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'battles',
    args: [BigInt(battleId)],
  })

  return {
    battle: battle as Battle | undefined,
    isLoading,
  }
}

export function useCreateBattle() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'createBattle',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    createBattle: (agent2: Address, gameType: number, prize: bigint) => 
      write({
        args: [agent2, gameType, prize],
        value: prize,
      }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// Hook untuk challenges
export function useChallenges() {
  const { data: count } = useContractRead({
    ...contractConfig,
    functionName: 'challengeCount',
  })

  const challengeIds = useMemo(() => {
    if (!count) return []
    return Array.from({ length: Number(count) }, (_, i) => i)
  }, [count])

  return {
    count: count ? Number(count) : 0,
    challengeIds,
  }
}

export function useChallenge(challengeId: number) {
  const { data: challenge, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'challenges',
    args: [BigInt(challengeId)],
  })

  return {
    challenge: challenge as Challenge | undefined,
    isLoading,
  }
}

export function useChallengeProgress(userAddress: Address, challengeId: number) {
  const { data: progress, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'challengeProgress',
    args: [userAddress, BigInt(challengeId)],
  })

  return {
    progress: progress ? Number(progress) : 0,
    isLoading,
  }
}

export function useUpdateChallengeProgress() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'updateChallengeProgress',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    updateChallengeProgress: (challengeId: number, progress: bigint) => 
      write({ args: [BigInt(challengeId), progress] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// ============ AGENT MANAGEMENT HOOKS ============

export function useRegisterAgent() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'registerAgent',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    registerAgent: (name: string, gameType: number, contractAddress: Address) => 
      write({ args: [name, gameType, contractAddress] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

export function useUpdateAgentMetrics() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'updateAgentMetrics',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    updateAgentMetrics: (agent: Address, accuracy: number, winRate: number, profit: bigint) => 
      write({ args: [agent, BigInt(accuracy), BigInt(winRate), profit] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

export function useAgentInfo(agentAddress: Address) {
  const { data: agent, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'getAgentInfo',
    args: [agentAddress],
    enabled: !!agentAddress,
  })

  return {
    agent: agent as any,
    isLoading,
  }
}

export function useUserAgents(userAddress?: Address) {
  const { address } = useAccount()
  const targetAddress = userAddress || address

  const { data: agents, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'getUserAgents',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress,
  })

  return {
    agents: agents as Address[] | undefined,
    isLoading,
  }
}

// ============ MARKETPLACE HOOKS ============

export function useListings() {
  const { data: count } = useContractRead({
    ...contractConfig,
    functionName: 'listingCount',
  })

  const listingIds = useMemo(() => {
    if (!count) return []
    return Array.from({ length: Number(count) }, (_, i) => i)
  }, [count])

  return {
    count: count ? Number(count) : 0,
    listingIds,
  }
}

export function useListing(listingId: number) {
  const { data: listing, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'getListing',
    args: [BigInt(listingId)],
  })

  return {
    listing: listing as any,
    isLoading,
  }
}

export function useListAgent() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'listAgent',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    listAgent: (agent: Address, price: bigint) => 
      write({ args: [agent, price] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

export function useBuyAgent() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'buyAgent',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    buyAgent: (listingId: number, value: bigint) => 
      write({ args: [BigInt(listingId)], value }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

export function useCancelListing() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'cancelListing',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    cancelListing: (listingId: number) => 
      write({ args: [BigInt(listingId)] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

// ============ SOCIAL HOOKS ============

export function useFriends(userAddress?: Address) {
  const { address } = useAccount()
  const targetAddress = userAddress || address

  const { data: friends, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'getFriends',
    args: targetAddress ? [targetAddress] : undefined,
    enabled: !!targetAddress,
  })

  return {
    friends: friends as Address[] | undefined,
    isLoading,
  }
}

export function useAddFriend() {
  const { write, data, isLoading, error } = useContractWrite({
    ...contractConfig,
    functionName: 'addFriend',
  })

  const { isLoading: isConfirming, isSuccess } = useWaitForTransaction({
    hash: data?.hash,
  })

  return {
    addFriend: (friendAddress: Address) => 
      write({ args: [friendAddress] }),
    isLoading: isLoading || isConfirming,
    isSuccess,
    error,
    hash: data?.hash,
  }
}

export function useAreFriends(user1: Address, user2: Address) {
  const { data: areFriends, isLoading } = useContractRead({
    ...contractConfig,
    functionName: 'areFriends',
    args: [user1, user2],
  })

  return {
    areFriends: areFriends as boolean | undefined,
    isLoading,
  }
}


