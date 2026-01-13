'use client'

import { ReactNode } from 'react'
import { WalletErrorBoundary } from './WalletErrorBoundary'

interface WalletGuardProps {
  children: (wallet: {
    address?: string
    isConnected: boolean
    chain: any
  }) => ReactNode
}

export function WalletGuard({ children }: WalletGuardProps) {
  // Always return default values
  // Wallet connection state will be managed by RainbowKit ConnectButton
  // This component is kept for backward compatibility but doesn't use hooks
  const defaultWallet = { address: undefined, isConnected: false, chain: null }

  return (
    <WalletErrorBoundary fallback={children(defaultWallet)}>
      {children(defaultWallet)}
    </WalletErrorBoundary>
  )
}
