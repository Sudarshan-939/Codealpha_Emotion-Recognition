import React from 'react'
import { motion } from 'framer-motion'

const DATASETS = [
  {
    name: 'RAVDESS',
    fullName: 'Ryerson Audio-Visual Database of Emotional Speech and Song',
    speakers: '24 actors (12M / 12F)',
    emotions: 8,
    emotionList: 'neutral, calm, happy, sad, angry, fearful, disgust, surprise',
    size: '~1,440 files',
    language: 'English (North American)',
    description: 'Professional actors performing two statements with two intensity levels. Gold-standard dataset for balanced multi-emotion speech research.',
    color: '#5c7cfa',
    link: 'https://www.kaggle.com/datasets/uwrfkaggler/ravdess-emotional-speech-audio',
  },
  {
    name: 'TESS',
    fullName: 'Toronto Emotional Speech Set',
    speakers: '2 actresses (26 & 64 yrs)',
    emotions: 7,
    emotionList: 'neutral, happy, sad, angry, fear, disgust, surprise',
    size: '~2,800 files',
    language: 'English',
    description: 'Two female speakers spanning different age groups, each producing all emotions. Excellent for studying age-related vocal differences.',
    color: '#a78bfa',
    link: 'https://www.kaggle.com/datasets/ejlok1/toronto-emotional-speech-set-tess',
  },
  {
    name: 'EMO-DB',
    fullName: 'Berlin Database of Emotional Speech',
    speakers: '10 actors (5M / 5F)',
    emotions: 7,
    emotionList: 'anger, boredom, disgust, fear, happiness, sadness, neutral',
    size: '~535 files',
    language: 'German',
    description: 'Classic European emotional speech corpus. Includes boredom, which maps to neutral in our unified taxonomy. Tests cross-lingual robustness.',
    color: '#34d399',
    link: 'https://www.kaggle.com/datasets/piyushagni5/berlin-database-of-emotional-speech-emodb',
  },
]

function DatasetCard({ dataset, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass-sm p-6 hover:bg-white/[0.07] transition-all group"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">📦</span>
            <h3 className="text-xl font-bold">{dataset.name}</h3>
          </div>
          <p className="text-xs text-gray-500">{dataset.fullName}</p>
        </div>
        <a
          href={dataset.link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-2 py-1 rounded-lg bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
        >
          Kaggle ↗
        </a>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-400 leading-relaxed mb-4">{dataset.description}</p>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Speakers</p>
          <p className="text-sm font-medium text-gray-200">{dataset.speakers}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Emotions</p>
          <p className="text-sm font-medium text-gray-200">{dataset.emotions} classes</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Size</p>
          <p className="text-sm font-medium text-gray-200">{dataset.size}</p>
        </div>
        <div className="bg-white/5 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-0.5">Language</p>
          <p className="text-sm font-medium text-gray-200">{dataset.language}</p>
        </div>
      </div>

      {/* Emotion chips */}
      <div className="mt-4">
        <p className="text-xs text-gray-500 mb-2">Emotions:</p>
        <div className="flex flex-wrap gap-1.5">
          {dataset.emotionList.split(', ').map((e) => (
            <span
              key={e}
              className="emotion-badge text-xs"
              style={{ backgroundColor: dataset.color + '15', color: dataset.color }}
            >
              {e}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function Datasets() {
  return (
    <section id="datasets" className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading"
          >
            Training <span className="text-gradient">Datasets</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle mx-auto"
          >
            All datasets sourced from Kaggle. A unified label mapping normalizes
            slightly different emotion taxonomies across all three.
          </motion.p>
        </div>

        {/* Unified taxonomy note */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-sm p-5 mb-8 flex items-start gap-3"
        >
          <span className="text-xl">🔗</span>
          <div>
            <p className="text-sm font-semibold text-white mb-1">Unified 8-Class Taxonomy</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Different datasets use different emotion labels. Our pipeline normalizes all labels to:
              <span className="text-brand-300 font-medium"> neutral, calm, happy, sad, angry, fearful, disgust, surprised</span>.
              EMO-DB's "boredom" maps to neutral. TESS "pleasant_surprise" maps to surprised.
            </p>
          </div>
        </motion.div>

        {/* Dataset cards */}
        <div className="grid md:grid-cols-3 gap-6">
          {DATASETS.map((dataset, i) => (
            <DatasetCard key={dataset.name} dataset={dataset} index={i} />
          ))}
        </div>

        {/* Total stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-gray-500">
            Combined: <span className="text-white font-semibold">~4,775 audio files</span> from{' '}
            <span className="text-white font-semibold">36 speakers</span> across{' '}
            <span className="text-white font-semibold">3 languages</span> — augmented to{' '}
            <span className="text-gradient font-semibold">~14,000+ samples</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
