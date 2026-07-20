import React from 'react'
import { motion } from 'framer-motion'

const CATEGORIES = [
  {
    title: 'Machine Learning & Signal Processing',
    icon: '🧠',
    color: '#5c7cfa',
    items: [
      { name: 'TensorFlow / Keras', desc: 'Deep learning framework for CNN, LSTM, hybrid models' },
      { name: 'Librosa', desc: 'Audio analysis, feature extraction (MFCC, mel, chroma)' },
      { name: 'NumPy / SciPy', desc: 'Numerical computing, signal processing' },
      { name: 'scikit-learn', desc: 'Data splitting, evaluation metrics, preprocessing' },
      { name: 'Pandas', desc: 'Dataset management and feature manifesting' },
    ],
  },
  {
    title: 'Backend API',
    icon: '⚡',
    color: '#a78bfa',
    items: [
      { name: 'FastAPI', desc: 'Async Python web framework with auto-docs' },
      { name: 'Uvicorn', desc: 'ASGI server for production' },
      { name: 'Pydantic', desc: 'Data validation and serialization' },
      { name: 'OpenAI SDK', desc: 'NVIDIA NIM-compatible LLM client' },
      { name: 'python-dotenv', desc: 'Environment variable management' },
    ],
  },
  {
    title: 'Frontend',
    icon: '🎨',
    color: '#f472b6',
    items: [
      { name: 'React 18', desc: 'Component-based UI framework' },
      { name: 'Three.js / R3F', desc: '3D particle visualization in the hero' },
      { name: 'Tailwind CSS', desc: 'Utility-first CSS styling' },
      { name: 'Framer Motion', desc: 'Smooth scroll-triggered animations' },
      { name: 'Recharts', desc: 'Confidence score bar charts' },
      { name: 'WaveSurfer.js', desc: 'Audio waveform visualization' },
    ],
  },
  {
    title: 'Infrastructure',
    icon: '🐳',
    color: '#34d399',
    items: [
      { name: 'Docker', desc: 'Containerized backend & frontend services' },
      { name: 'Kaggle API', desc: 'Automated dataset download' },
      { name: 'NVIDIA NIM', desc: 'LLM-powered natural language insights' },
    ],
  },
]

function CategoryCard({ category, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass-sm p-6"
    >
      <div className="flex items-center gap-3 mb-5">
        <span className="text-2xl">{category.icon}</span>
        <h3 className="text-lg font-bold">{category.title}</h3>
      </div>
      <div className="space-y-3">
        {category.items.map((item, i) => (
          <div key={i} className="flex items-start gap-3 group">
            <span
              className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-150"
              style={{ backgroundColor: category.color }}
            />
            <div>
              <span className="text-sm font-medium text-gray-200">{item.name}</span>
              <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

export default function TechStack() {
  return (
    <section id="tech" className="py-24 px-4 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading"
          >
            Tech <span className="text-gradient">Stack</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle mx-auto"
          >
            Built with modern, battle-tested technologies across ML, backend, frontend, and infrastructure.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {CATEGORIES.map((cat, i) => (
            <CategoryCard key={cat.title} category={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
