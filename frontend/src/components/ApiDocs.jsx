import React from 'react'
import { motion } from 'framer-motion'

const ENDPOINTS = [
  {
    method: 'POST',
    path: '/api/predict',
    desc: 'Upload audio → emotion + per-class confidence scores',
    params: [
      { name: 'file', type: 'File', required: true, desc: 'Audio file (.wav, .mp3, .ogg, .flac, .m4a)' },
      { name: 'architecture', type: 'string', required: false, desc: "Model to use: 'production', 'cnn', 'lstm', 'cnn_lstm_hybrid'" },
    ],
    example: `curl -X POST http://localhost:8000/api/predict \\
  -F "file=@speech.wav"`,
    response: `{
  "emotion": "angry",
  "confidence": 0.87,
  "per_class_scores": {
    "angry": 0.87,
    "sad": 0.05,
    "happy": 0.02,
    ...
  },
  "model_architecture": "production",
  "processing_time_ms": 245.3
}`,
  },
  {
    method: 'POST',
    path: '/api/predict/insight',
    desc: 'Same as /predict + NVIDIA LLM natural-language explanation',
    params: [
      { name: 'file', type: 'File', required: true, desc: 'Audio file' },
      { name: 'architecture', type: 'string', required: false, desc: 'Model to use' },
    ],
    example: `curl -X POST http://localhost:8000/api/predict/insight \\
  -F "file=@speech.wav"`,
    response: `{
  "emotion": "happy",
  "confidence": 0.93,
  "per_class_scores": { ... },
  "insight": "The model detected 'happy' with 93% confidence. The speaker shows elevated pitch variation (mean MFCC: 12.4) and fast speech rate (ZCR: 0.14), which are strong markers of positive affect.",
  "processing_time_ms": 1234.5
}`,
  },
  {
    method: 'GET',
    path: '/api/models',
    desc: 'List all available trained models with performance metrics',
    params: [],
    example: 'curl http://localhost:8000/api/models',
    response: `[
  {
    "name": "production",
    "path": "./saved_models/production/model.keras",
    "status": "available",
    "test_accuracy": 0.87,
    "macro_f1": 0.83
  }
]`,
  },
  {
    method: 'GET',
    path: '/api/health',
    desc: 'Service health check',
    params: [],
    example: 'curl http://localhost:8000/api/health',
    response: `{
  "status": "healthy",
  "version": "1.0.0",
  "models_available": 3
}`,
  },
]

function MethodBadge({ method }) {
  const colors = {
    POST: 'bg-green-500/15 text-green-400 border-green-500/30',
    GET: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${colors[method]}`}>
      {method}
    </span>
  )
}

function EndpointCard({ endpoint, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="glass-sm p-5"
    >
      <div className="flex items-center gap-3 mb-2">
        <MethodBadge method={endpoint.method} />
        <code className="text-sm font-mono text-white font-semibold">{endpoint.path}</code>
      </div>
      <p className="text-sm text-gray-400 mb-4">{endpoint.desc}</p>

      {/* Parameters */}
      {endpoint.params.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Parameters</h4>
          <div className="space-y-1.5">
            {endpoint.params.map((p, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <code className="font-mono text-brand-300">{p.name}</code>
                <span className="text-xs text-gray-600">{p.type}</span>
                {p.required && <span className="text-xs text-red-400">required</span>}
                <span className="text-xs text-gray-500">— {p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Example */}
      <div className="mb-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Example</h4>
        <pre className="text-xs font-mono bg-gray-900/80 rounded-lg p-3 overflow-x-auto text-gray-300 border border-white/5">
          {endpoint.example}
        </pre>
      </div>

      {/* Response */}
      <div>
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Response</h4>
        <pre className="text-xs font-mono bg-gray-900/80 rounded-lg p-3 overflow-x-auto text-gray-300 border border-white/5 max-h-48 overflow-y-auto">
          {endpoint.response}
        </pre>
      </div>
    </motion.div>
  )
}

export default function ApiDocs() {
  return (
    <section id="api" className="py-24 px-4 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading"
          >
            API <span className="text-gradient">Reference</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle mx-auto"
          >
            REST API for integrating emotion recognition into your own applications.
            Interactive docs available at <code className="text-brand-300">/docs</code>.
          </motion.p>
        </div>

        <div className="space-y-4">
          {ENDPOINTS.map((ep, i) => (
            <EndpointCard key={ep.path + ep.method} endpoint={ep} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
