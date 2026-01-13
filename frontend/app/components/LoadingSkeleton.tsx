'use client'

import { motion } from 'framer-motion'

export function CodeSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-700 rounded"></div>
        <div className="h-4 bg-gray-700 rounded w-5/6"></div>
        <div className="h-4 bg-gray-700 rounded w-4/6"></div>
        <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      </div>
    </div>
  )
}

export function TerminalSkeleton() {
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 animate-pulse">
      <div className="h-4 bg-gray-700 rounded w-1/3 mb-4"></div>
      <div className="bg-black rounded p-4 space-y-2">
        <div className="h-3 bg-gray-800 rounded w-1/2"></div>
        <div className="h-3 bg-gray-800 rounded w-2/3"></div>
        <div className="h-3 bg-gray-800 rounded w-1/3"></div>
      </div>
    </div>
  )
}

