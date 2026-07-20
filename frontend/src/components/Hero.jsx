import React, { Suspense, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import ParticleScene from './ParticleScene'

const EMOTIONS_FOR_HERO = ['neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised']

function HeroContent() {
  const [activeEmotion, setActiveEmotion] = useState('neutral')

  useEffect(() => {
    let idx = 0
    const interval = setInterval(() => {
      idx = (idx + 1) % EMOTIONS_FOR_HERO.length
      setActiveEmotion(EMOTIONS_FOR_HERO[idx])
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative z-10 flex flex-col items-center text-center px-4 pt-32 pb-20 max-w-5xl mx-auto">
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
          Powered by Deep Learning
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-none mb-6"
      >
        Hear the{' '}
        <span className="text-gradient">Emotion</span>
        <br />
        Behind the Voice
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="text-lg sm:text-xl text-gray-400 max-w-2xl mb-10 leading-relaxed"
      >
        Classify human emotion directly from speech audio using CNN, LSTM,
        and hybrid deep learning architectures — with real-time NVIDIA LLM insights.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <Link to="/demo" className="btn-primary text-lg px-8 py-4">
          Try Live Demo →
        </Link>
        <Link to="/about" className="btn-secondary text-lg px-8 py-4">
          See How It Works
        </Link>
      </motion.div>

      {/* Emotion cycling indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-12 flex items-center gap-3"
      >
        <span className="text-sm text-gray-500">Detecting:</span>
        <div className="flex gap-1.5">
          {EMOTIONS_FOR_HERO.map((e) => (
            <div
              key={e}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                e === activeEmotion ? 'scale-150 ring-2 ring-white/30' : 'opacity-30'
              }`}
              style={{
                backgroundColor:
                  e === 'angry' ? '#ef4444'
                  : e === 'happy' ? '#fbbf24'
                  : e === 'sad' ? '#60a5fa'
                  : e === 'calm' ? '#67e8f9'
                  : e === 'fearful' ? '#a78bfa'
                  : e === 'disgust' ? '#34d399'
                  : e === 'surprised' ? '#f472b6'
                  : '#94a3b8',
              }}
              title={e}
            />
          ))}
        </div>
        <span className="text-sm font-medium text-gray-300 capitalize ml-1">{activeEmotion}</span>
      </motion.div>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Three.js Background */}
      <div className="absolute inset-0 z-0">
        <Suspense fallback={
          <div className="w-full h-full bg-gradient-to-b from-brand-900/20 via-gray-950 to-gray-950" />
        }>
          <ParticleScene />
        </Suspense>
      </div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-gray-950/40 via-transparent to-gray-950 pointer-events-none" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-r from-gray-950/60 via-transparent to-gray-950/60 pointer-events-none" />

      {/* Content */}
      <HeroContent />

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <Link to="/demo" className="flex flex-col items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors">
          <span className="text-xs font-medium tracking-widest uppercase">Scroll to explore</span>
          <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </Link>
      </motion.div>
    </section>
  )
}
