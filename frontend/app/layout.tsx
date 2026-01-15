import type { Metadata } from 'next'
import './globals.css'
// Force rebuild: 1
import { Providers } from './providers'
import { Toaster } from './components/Toaster'

export const metadata: Metadata = {
  title: 'StylusArena - Play Games to Train AI Agents',
  description: 'Gamified AI training platform - Play games to train AI agents, deploy as Stylus contracts on Arbitrum',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
