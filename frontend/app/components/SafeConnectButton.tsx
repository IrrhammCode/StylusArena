'use client'

import { useEffect, useState } from 'react'
import { useWalletAvailable } from '../providers'
import { WalletErrorBoundary } from './WalletErrorBoundary'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export function SafeConnectButton() {
  const { isAvailable, isReady } = useWalletAvailable()
  const [ConnectButton, setConnectButton] = useState<any>(null)
  const [useConnect, setUseConnect] = useState<any>(null)

  useEffect(() => {
    // Load both ConnectButton and useConnect hook
    Promise.all([
      import('@rainbow-me/rainbowkit').then(m => m.ConnectButton),
      import('wagmi').then(m => m.useConnect)
    ]).then(([ConnectBtn, connectHook]) => {
      setConnectButton(() => ConnectBtn)
      setUseConnect(() => connectHook)
    }).catch((err) => {
      console.error('Failed to load wallet modules:', err)
    })
  }, [])

  // Fallback button component that can trigger connection
  const [isRetrying, setIsRetrying] = useState(false)

  const handleFallbackClick = async () => {
    if (!isReady) {
      toast.error('Wallet connection is still loading. Please wait a moment and try again.')
      return
    }

    if (ConnectButton) {
      // If ConnectButton is loaded but not showing, force re-render
      toast('Please wait, wallet is initializing...', { icon: 'ℹ️' })
      return
    }

    // Retry loading ConnectButton
    try {
      setIsRetrying(true)
      toast.loading('Loading wallet connection...', { id: 'wallet-retry' })

      const module = await import('@rainbow-me/rainbowkit')
      setConnectButton(() => module.ConnectButton)

      toast.dismiss('wallet-retry')
      toast.success('Wallet ready! The connect button should appear now.')
    } catch (err) {
      toast.dismiss('wallet-retry')
      toast.error('Failed to load wallet connection. Please refresh the page or check your browser console.')
      console.error('Wallet connection error:', err)
    } finally {
      setIsRetrying(false)
    }
  }

  function FallbackButton() {

    return (
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleFallbackClick}
        disabled={isRetrying}
        className="px-6 py-2.5 bg-gradient-to-r from-arbitrum-cyan to-blue-500 hover:from-arbitrum-cyan/90 hover:to-blue-500/90 disabled:from-gray-600 disabled:to-gray-700 text-gray-900 font-semibold rounded-lg text-sm transition-all shadow-lg shadow-arbitrum-cyan/30 relative z-50 flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        title={!isReady ? "Loading wallet connection..." : isRetrying ? "Retrying..." : "Click to connect wallet"}
      >
        {isRetrying ? (
          <>
            <div className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connect Wallet
          </>
        )}
      </motion.button>
    )
  }

  // If wallet not ready or ConnectButton not loaded, show fallback
  if (!isReady || !ConnectButton) {
    return <FallbackButton />
  }

  // Custom styling for RainbowKit ConnectButton
  return (
    <div className="relative z-50" style={{ pointerEvents: 'auto' }}>
      <WalletErrorBoundary fallback={<FallbackButton />}>
        <div style={{ pointerEvents: 'auto' }}>
          <style jsx global>{`
            button[data-testid="rk-connect-button"] {
              background: linear-gradient(to right, #00D9FF, #3B82F6) !important;
              color: #0F172A !important;
              font-weight: 600 !important;
              padding: 0.625rem 1.5rem !important;
              border-radius: 0.5rem !important;
              font-size: 0.875rem !important;
              box-shadow: 0 10px 15px -3px rgba(0, 217, 255, 0.3) !important;
              transition: all 0.2s !important;
              border: none !important;
            }
            button[data-testid="rk-connect-button"]:hover {
              background: linear-gradient(to right, #00B8D4, #2563EB) !important;
              transform: translateY(-1px) !important;
              box-shadow: 0 15px 20px -3px rgba(0, 217, 255, 0.4) !important;
            }
            button[data-testid="rk-account-button"] {
              background: #1A1F3A !important;
              border: 1px solid #00D9FF !important; /* Cyan border */
              color: white !important;
              font-weight: 600 !important;
              padding: 0.625rem 1rem !important;
              border-radius: 0.75rem !important;
              box-shadow: 0 4px 12px rgba(0, 217, 255, 0.15) !important; /* Glow effect */
            }
            button[data-testid="rk-account-button"] * {
              color: white !important; /* Force all internal text (address, dropdown) to be white */
            }
            button[data-testid="rk-account-button"]:hover {
              background: #252B45 !important;
              box-shadow: 0 4px 16px rgba(0, 217, 255, 0.25) !important;
              transform: translateY(-1px);
            }
          `}</style>
          <ConnectButton />
        </div>
      </WalletErrorBoundary>
    </div>
  )
}
