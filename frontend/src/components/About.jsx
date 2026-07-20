import React from 'react'
import { motion } from 'framer-motion'

const STEPS = [
  {
    icon: '🎙️',
    title: 'Audio Input',
    desc: 'Record or upload speech audio (WAV, MP3, FLAC). The system resamples to 16kHz mono and trims silence.',
    color: '#5c7cfa',
  },
  {
    icon: '📊',
    title: 'Feature Extraction',
    desc: 'Extract MFCCs, delta-MFCCs, mel-spectrograms, chroma, ZCR, and RMS energy — capturing pitch, rhythm, and timbre.',
    color: '#a78bfa',
  },
  {
    icon: '🧠',
    title: 'Deep Learning',
    desc: 'Classify emotion using CNN (spectrogram images), BiLSTM (time-sequences), or CNN-LSTM hybrid (best performer).',
    color: '#f472b6',
  },
  {
    icon: '💡',
    title: 'LLM Insight',
    desc: 'NVIDIA NIM LLM generates a natural-language explanation of which acoustic cues drove the prediction.',
    color: '#34d399',
  },
]

const STATS = [
  { value: '8', label: 'Emotions', sub: 'neutral, calm, happy, sad, angry, fearful, disgust, surprised' },
  { value: '≥85%', label: 'Accuracy', sub: 'Target weighted classification accuracy' },
  { value: '3', label: 'Architectures', sub: 'CNN, LSTM, CNN-LSTM hybrid' },
  { value: '<800ms', label: 'Latency', sub: 'CPU inference for a 3–5s clip' },
]

export default function About() {
  return (
    <section id="about" className="py-24 px-4 relative">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading"
          >
            Beyond <span className="text-gradient">Words</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle mx-auto"
          >
            Human emotion is carried in <em>how</em> something is said, not just <em>what</em> is said.
            Our system decodes vocal cues to classify 8 distinct emotional states.
          </motion.p>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {STATS.map((stat, i) => (
            <div key={i} className="glass-sm p-5 text-center">
              <div className="text-3xl font-black text-gradient mb-1">{stat.value}</div>
              <div className="text-sm font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{stat.sub}</div>
            </div>
          ))}
        </motion.div>

        {/* Pipeline steps */}
        <div className="grid md:grid-cols-4 gap-6">
          {STEPS.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative"
            >
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-10 left-full w-6 h-px bg-gradient-to-r from-white/20 to-transparent z-10" />
              )}
              <div className="glass-sm p-6 h-full hover:bg-white/[0.07] transition-colors group">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: step.color + '15' }}
                >
                  {step.icon}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: step.color + '25', color: step.color }}
                  >
                    {i + 1}
                  </span>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
