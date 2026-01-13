'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SafeConnectButton } from './SafeConnectButton'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  CodeIcon,
  CubeIcon,
  ShareIcon,
  TerminalIcon
} from './Icons'
import { NotificationCenter } from './NotificationCenter'

const navItems = [
  { href: '/games', label: 'Games', icon: CodeIcon, color: '#00D9FF', glow: '0 0 20px rgba(0, 217, 255, 0.5)' },
  { href: '/training', label: 'Training', icon: CubeIcon, color: '#FF00FF', glow: '0 0 20px rgba(255, 0, 255, 0.5)' },
  { href: '/agents/analytics', label: 'Analytics', icon: TerminalIcon, color: '#00FF88', glow: '0 0 20px rgba(0, 255, 136, 0.5)' },
  { href: '/marketplace', label: 'Marketplace', icon: ShareIcon, color: '#FFD700', glow: '0 0 20px rgba(255, 215, 0, 0.5)' },
]

export function Navbar() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`sticky top-0 z-50 transition-all duration-500 ${scrolled
        ? 'bg-[#0A0E27]/95 backdrop-blur-2xl shadow-2xl shadow-black/50'
        : 'bg-transparent'
        }`}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00D9FF] to-transparent opacity-60" />

      {/* Animated border bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden">
        <motion.div
          className="h-full w-[200%] bg-gradient-to-r from-transparent via-[#00D9FF] via-50% to-transparent"
          animate={{ x: ['-50%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-4 group relative">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 3 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              {/* Logo glow */}
              <div className="absolute inset-0 bg-[#00D9FF] rounded-xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />

              {/* Logo image */}
              <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-lg">
                <img
                  src="/images/logo.png"
                  alt="StylusArena Logo"
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>

            <div className="flex flex-col">
              <motion.span
                className="text-2xl font-bold bg-gradient-to-r from-white via-[#00D9FF] to-white bg-clip-text text-transparent bg-[length:200%_100%]"
                animate={{ backgroundPosition: ['0% 0%', '100% 0%', '0% 0%'] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
              >
                StylusArena
              </motion.span>
              <span className="text-[11px] text-[#00D9FF]/70 font-medium tracking-widest uppercase">
                AI Training Games
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1 p-1.5 bg-[#0A0E27]/60 backdrop-blur-xl rounded-2xl border border-white/5">
            {navItems.map((item, index) => {
              const IconComponent = item.icon
              const active = isActive(item.href)
              const isHovered = hoveredIndex === index

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="relative"
                >
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative px-5 py-2.5 rounded-xl transition-all duration-300 flex items-center gap-2.5 overflow-hidden ${active
                      ? 'text-white'
                      : 'text-gray-400 hover:text-white'
                      }`}
                    style={{
                      boxShadow: active ? item.glow : 'none'
                    }}
                  >
                    {/* Active/Hover background */}
                    <AnimatePresence>
                      {(active || isHovered) && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: active
                              ? `linear-gradient(135deg, ${item.color}30, ${item.color}10)`
                              : 'rgba(255,255,255,0.05)'
                          }}
                        />
                      )}
                    </AnimatePresence>

                    {/* Active indicator line */}
                    {active && (
                      <motion.div
                        layoutId="activeNavLine"
                        className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}

                    {/* Icon */}
                    <motion.div
                      animate={{
                        color: active ? item.color : isHovered ? item.color : '#9CA3AF',
                        scale: active ? 1.1 : 1
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      <IconComponent className="w-4 h-4 relative z-10" />
                    </motion.div>

                    {/* Label */}
                    <span className="font-semibold text-sm relative z-10">{item.label}</span>

                    {/* Pulse effect for active */}
                    {active && (
                      <motion.div
                        className="absolute -right-1 -top-1 w-2 h-2 rounded-full"
                        style={{ backgroundColor: item.color }}
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </motion.div>
                </Link>
              )
            })}
          </div>

          {/* Right Side - Wallet & Mobile Menu */}
          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <NotificationCenter />
            </div>

            <div className="hidden md:block">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <SafeConnectButton />
              </motion.div>
            </div>

            {/* Mobile Menu Button */}
            <motion.button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="lg:hidden p-3 text-white bg-gradient-to-br from-[#1A1F3A] to-[#0A0E27] rounded-xl border border-white/10 hover:border-[#00D9FF]/50 transition-colors shadow-lg"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden overflow-hidden"
            >
              <div className="pb-6 pt-4 space-y-2">
                {/* Separator with glow */}
                <div className="h-[1px] bg-gradient-to-r from-transparent via-[#00D9FF]/50 to-transparent mb-4" />

                {navItems.map((item, index) => {
                  const IconComponent = item.icon
                  const active = isActive(item.href)
                  return (
                    <motion.div
                      key={item.href}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className={`relative flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${active
                          ? 'text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        style={{
                          background: active ? `linear-gradient(135deg, ${item.color}20, transparent)` : undefined,
                          boxShadow: active ? item.glow : undefined
                        }}
                      >
                        {/* Left accent bar */}
                        {active && (
                          <motion.div
                            layoutId="mobileActiveBar"
                            className="absolute left-0 top-2 bottom-2 w-1 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                        )}

                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: `${item.color}20`,
                            boxShadow: active ? `0 0 15px ${item.color}30` : undefined
                          }}
                        >
                          <span style={{ color: item.color }}>
                            <IconComponent className="w-5 h-5" />
                          </span>
                        </div>

                        <span className="font-semibold text-base">{item.label}</span>

                        {/* Arrow */}
                        <svg
                          className="w-4 h-4 ml-auto opacity-50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </motion.div>
                  )
                })}

                {/* Mobile wallet button */}
                <div className="pt-4 px-2">
                  <SafeConnectButton />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
