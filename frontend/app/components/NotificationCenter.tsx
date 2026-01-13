'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'

interface Notification {
  id: string
  type: 'success' | 'info' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  action?: {
    label: string
    href: string
  }
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Simulate receiving notifications
    const interval = setInterval(() => {
      // This would normally come from WebSocket or polling
      // For demo, we'll simulate occasional notifications
      if (Math.random() > 0.95) {
        addNotification({
          type: 'info',
          title: 'New Tournament',
          message: 'A new tournament has started! Join now to compete.',
          action: { label: 'View', href: '/tournaments' },
        })
      }
    }, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length)
  }, [notifications])

  const addNotification = (data: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...data,
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
      read: false,
    }

    setNotifications(prev => [notification, ...prev].slice(0, 20)) // Keep last 20

    // Show toast
    toast[notification.type === 'error' ? 'error' : notification.type === 'warning' ? 'error' : 'success'](
      notification.message,
      {
        duration: 5000,
        icon: getNotificationIcon(notification.type),
      }
    )
  }

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  // Expose addNotification globally for other components
  useEffect(() => {
    ;(window as any).addNotification = addNotification
    return () => {
      delete (window as any).addNotification
    }
  }, [])

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white hover:bg-[#1A1F3A] rounded-xl transition-all"
        aria-label="Notifications"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold text-white"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 top-full mt-2 w-96 bg-[#0F1422] rounded-2xl border border-[#1A1F3A] shadow-2xl z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-[#1A1F3A] flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Notifications</h3>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-arbitrum-cyan hover:text-arbitrum-cyan/80 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAll}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <div className="text-4xl mb-4">🔔</div>
                    <p>No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#1A1F3A]">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-[#1A1F3A]/50 transition-colors ${
                          !notification.read ? 'bg-[#1A1F3A]/30' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                            notification.type === 'success' ? 'bg-green-400' :
                            notification.type === 'error' ? 'bg-red-400' :
                            notification.type === 'warning' ? 'bg-yellow-400' :
                            'bg-blue-400'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className="text-sm font-semibold text-white">
                                {notification.title}
                              </h4>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteNotification(notification.id)
                                }}
                                className="text-gray-500 hover:text-gray-300 transition-colors flex-shrink-0"
                              >
                                ×
                              </button>
                            </div>
                            <p className="text-sm text-gray-400 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-gray-500">
                                {formatTime(notification.timestamp)}
                              </span>
                              {notification.action && (
                                <a
                                  href={notification.action.href}
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-xs text-arbitrum-cyan hover:text-arbitrum-cyan/80 transition-colors"
                                >
                                  {notification.action.label} →
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'success':
      return '✅'
    case 'error':
      return '❌'
    case 'warning':
      return '⚠️'
    default:
      return 'ℹ️'
  }
}

function formatTime(date: Date): string {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (days > 0) return `${days}d ago`
  if (hours > 0) return `${hours}h ago`
  if (minutes > 0) return `${minutes}m ago`
  return 'Just now'
}


