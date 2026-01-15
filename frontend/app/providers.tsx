'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, Suspense, createContext, useContext } from 'react'
import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  getDefaultWallets,
  connectorsForWallets,
} from '@rainbow-me/rainbowkit'
import {
  metaMaskWallet,
  injectedWallet,
  rainbowWallet,
  walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { configureChains, createConfig, WagmiConfig } from 'wagmi'
import { arbitrumSepolia } from 'wagmi/chains'
import { publicProvider } from 'wagmi/providers/public'

// Create query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
})

// Configure chains
const { chains, publicClient } = configureChains(
  [arbitrumSepolia],
  [publicProvider()]
)

// Setup Connectors
// 1. Try to use default project ID
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '00000000000000000000000000000000'

// 2. Configure specific wallets to ensure they show up
const connectors = connectorsForWallets([
  {
    groupName: 'Recommended',
    wallets: [
      injectedWallet({ chains }),
      metaMaskWallet({ projectId, chains }),
    ],
  },
])

// 3. Create Wagmi Config
const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
})

// Context
const WalletContext = createContext<{ isAvailable: boolean; isReady: boolean }>({
  isAvailable: false,
  isReady: false
})

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <WagmiConfig config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <WalletContext.Provider value={{ isAvailable: false, isReady: false }}>
            {children}
          </WalletContext.Provider>
        </QueryClientProvider>
      </WagmiConfig>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains}>
          <WalletContext.Provider value={{ isAvailable: true, isReady: true }}>
            {children}
          </WalletContext.Provider>
        </RainbowKitProvider>
      </WagmiConfig>
    </QueryClientProvider>
  )
}

export function useWalletAvailable() {
  return useContext(WalletContext)
}
