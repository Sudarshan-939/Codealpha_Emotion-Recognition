import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ARCHITECTURES = [
  {
    id: 'cnn',
    name: 'CNN',
    fullName: 'Convolutional Neural Network',
    emoji: '🖼️',
    color: '#5c7cfa',
    description: 'Treats mel-spectrograms as 2D images, learning spatial patterns via convolutional filters.',
    input: '128×128 log-mel spectrogram',
    layers: [
      'Conv2D (32) → BatchNorm → MaxPool → Dropout(0.2)',
      'Conv2D (64) → BatchNorm → MaxPool → Dropout(0.25)',
      'Conv2D (128) → BatchNorm → MaxPool → Dropout(0.3)',
      'GlobalAveragePooling → Dense(256) → Dropout(0.4)',
      'Softmax(8)',
    ],
    pros: ['Fast inference', 'Good at spectral texture patterns', 'Simple architecture'],
    cons: ['Ignores temporal dynamics', 'Fixed input size', 'No sequential context'],
    bestFor: 'Spectrogram-based emotion classification when speed matters.',
  },
  {
    id: 'lstm',
    name: 'BiLSTM',
    fullName: 'Bidirectional Long Short-Term Memory',
    emoji: '📈',
    color: '#a78bfa',
    description: 'Processes MFCC time-sequences bidirectionally, capturing both past and future temporal context.',
    input: 'MFCC + deltas (T × 120)',
    layers: [
      'BiLSTM (128 units) → return_sequences=True',
      'BatchNorm → Dropout(0.3)',
      'BiLSTM (64 units) → return_sequences=False',
      'BatchNorm → Dropout(0.3)',
      'Dense(128) → Dropout(0.3) → Softmax(8)',
    ],
    pros: ['Captures temporal dynamics', 'Bidirectional context', 'Handles variable-length input'],
    cons: ['Slower inference', 'Sequential processing', 'No local spectral features'],
    bestFor: 'When temporal speech patterns and prosody matter most.',
  },
  {
    id: 'cnn_lstm_hybrid',
    name: 'CNN-LSTM Hybrid',
    fullName: 'TimeDistributed CNN + BiLSTM + Attention',
    emoji: '🏆',
    color: '#f472b6',
    description: 'Best of both worlds — local spectral extraction via CNN, temporal modeling via BiLSTM, plus self-attention.',
    input: 'MFCC + deltas (T × 120)',
    layers: [
      'TimeDistributed Conv1D (64) → BatchNorm → MaxPool → Dropout',
      'TimeDistributed Conv1D (128) → BatchNorm → GAP',
      'BiLSTM (128) → return_sequences=True',
      'MultiHeadAttention (4 heads) → Add → LayerNorm',
      'GlobalAveragePooling → Dense(128) → Dropout(0.3) → Softmax(8)',
    ],
    pros: ['Best accuracy', 'Spectral + temporal features', 'Attention mechanism'],
    cons: ['Most complex', 'Slower training', 'More parameters'],
    bestFor: 'Maximum accuracy — the production model for the SER platform.',
  },
]

function ArchCard({ arch, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`glass-sm p-5 text-left transition-all duration-300 w-full ${
        isActive
          ? 'ring-2 bg-white/[0.08]'
          : 'hover:bg-white/[0.05]'
      }`}
      style={{
        ringColor: isActive ? arch.color : 'transparent',
        borderColor: isActive ? arch.color + '40' : undefined,
      }}
    >
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{arch.emoji}</span>
        <div>
          <h3 className="font-bold text-white">{arch.name}</h3>
          <p className="text-xs text-gray-500">{arch.fullName}</p>
        </div>
      </div>
      <p className="text-sm text-gray-400 line-clamp-2">{arch.description}</p>
    </button>
  )
}

function ArchDetail({ arch }) {
  return (
    <motion.div
      key={arch.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="glass p-6"
    >
      {/* Input */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Input</h4>
        <code className="text-sm font-mono bg-white/5 px-3 py-1.5 rounded-lg inline-block">
          {arch.input}
        </code>
      </div>

      {/* Architecture layers */}
      <div className="mb-4">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Architecture</h4>
        <div className="space-y-1.5">
          {arch.layers.map((layer, i) => (
            <div key={i} className="flex items-start gap-2">
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: arch.color }}
              />
              <span className="text-sm text-gray-300 font-mono">{layer}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pros / Cons */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-1.5">Strengths</h4>
          <ul className="space-y-1">
            {arch.pros.map((p, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-center gap-1.5">
                <span className="text-green-500 text-xs">✓</span> {p}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1.5">Trade-offs</h4>
          <ul className="space-y-1">
            {arch.cons.map((c, i) => (
              <li key={i} className="text-sm text-gray-400 flex items-center gap-1.5">
                <span className="text-orange-500 text-xs">•</span> {c}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Best for */}
      <div
        className="p-3 rounded-xl text-sm"
        style={{ backgroundColor: arch.color + '10', color: arch.color }}
      >
        <strong>Best for:</strong> {arch.bestFor}
      </div>
    </motion.div>
  )
}

export default function Architecture() {
  const [activeIdx, setActiveIdx] = useState(2) // Default to hybrid

  return (
    <section id="architecture" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading"
          >
            Model <span className="text-gradient">Architecture</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle mx-auto"
          >
            Three architectures trained and benchmarked — from CNNs over spectrogram images
            to a hybrid CNN-LSTM with self-attention.
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Architecture selector */}
          <div className="lg:col-span-4 space-y-3">
            {ARCHITECTURES.map((arch, i) => (
              <ArchCard
                key={arch.id}
                arch={arch}
                isActive={i === activeIdx}
                onClick={() => setActiveIdx(i)}
              />
            ))}
          </div>

          {/* Right: Detail panel */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <ArchDetail arch={ARCHITECTURES[activeIdx]} />
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
