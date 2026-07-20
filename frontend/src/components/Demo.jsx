import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import WaveSurfer from 'wavesurfer.js'
import useStore from '../utils/store'
import { predictWithInsight } from '../utils/api'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { EMOTIONS, EMOTION_COLORS, EMOTION_EMOJIS, formatConfidence, getEmotionStyle } from '../utils/emotions'

function EmotionBar({ emotion, score, maxScore }) {
  const style = getEmotionStyle(emotion)
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0

  return (
    <div className="flex items-center gap-3 group">
      <span className="w-24 text-sm font-medium text-gray-300 flex items-center gap-1.5">
        <span className="text-base">{EMOTION_EMOJIS[emotion]}</span>
        <span className="capitalize">{emotion}</span>
      </span>
      <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: style.bg }}
        />
      </div>
      <span className="w-16 text-right text-sm font-mono text-gray-400">
        {formatConfidence(score)}
      </span>
    </div>
  )
}

function WaveformDisplay({ audioUrl }) {
  const containerRef = useRef(null)
  const wsRef = useRef(null)

  useEffect(() => {
    if (!audioUrl || !containerRef.current) return

    if (wsRef.current) {
      wsRef.current.destroy()
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#5c7cfa',
      progressColor: '#3b5bdb',
      cursorColor: '#fff',
      barWidth: 2,
      barRadius: 2,
      barGap: 1,
      height: 80,
      normalize: true,
    })

    ws.load(audioUrl)
    wsRef.current = ws

    return () => {
      if (wsRef.current) {
        wsRef.current.destroy()
        wsRef.current = null
      }
    }
  }, [audioUrl])

  return <div ref={containerRef} className="w-full rounded-xl overflow-hidden bg-white/5 p-2" />
}

function InsightCard({ insight, emotion, confidence }) {
  const style = getEmotionStyle(emotion)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass p-6"
    >
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: style.bg + '20' }}
        >
          {EMOTION_EMOJIS[emotion]}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            AI Insight
          </h4>
          <p className="text-gray-300 leading-relaxed">{insight}</p>
        </div>
      </div>
    </motion.div>
  )
}

function ChartPanel({ perClassScores }) {
  const data = EMOTIONS.map((e) => ({
    name: EMOTION_EMOJIS[e],
    emotion: e,
    score: perClassScores[e] || 0,
    fill: EMOTION_COLORS[e].bg,
  }))

  return (
    <div className="glass p-4 h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis dataKey="name" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 1]} />
          <Tooltip
            contentStyle={{
              background: '#1f2937',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              fontSize: '12px',
            }}
            formatter={(value, name, props) => [formatConfidence(value), props.payload.emotion]}
          />
          <Bar dataKey="score" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.fill} fillOpacity={0.8} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function Demo() {
  const { prediction, isLoading, error, audioBlob, audioUrl, setPrediction, setIsLoading, setError, clearPrediction } = useStore()
  const { isRecording, duration, formattedDuration, error: recorderError, startRecording, stopRecording, resetRecording } = useAudioRecorder()
  const fileInputRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)

  const handlePredict = useCallback(async (blob) => {
    if (!blob) return
    setIsLoading(true)
    setError(null)
    try {
      const result = await predictWithInsight(blob)
      setPrediction(result)
    } catch (err) {
      setError(err.message)
    }
  }, [setIsLoading, setError, setPrediction])

  const handleRecord = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  // Auto-predict is now manual — user clicks Analyse
  // (we keep this effect only as a no-op placeholder)

  const handleFileUpload = (file) => {
    if (!file) return
    const { setAudioBlob } = useStore.getState()
    clearPrediction()
    setAudioBlob(file)
    // Don't auto-predict — let user click Analyse
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('audio/')) {
      handleFileUpload(file)
    }
  }

  const handleReset = () => {
    clearPrediction()
    resetRecording()
  }

  return (
    <section id="demo" className="py-24 px-4 relative">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="section-heading"
          >
            Try It <span className="text-gradient">Live</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="section-subtitle mx-auto"
          >
            Record your voice or upload an audio file to see real-time emotion classification.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className="glass p-8">
            {/* Upload / Record area */}
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/10 hover:border-white/20 hover:bg-white/5'
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {!audioBlob && !isRecording && (
                <div className="flex flex-col items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-gray-300 font-medium mb-1">
                      Drop an audio file here, or
                    </p>
                    <p className="text-sm text-gray-500">
                      Supports WAV, MP3, OGG, FLAC — up to 25MB
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-primary"
                    >
                      📁 Upload File
                    </button>
                    <button
                      onClick={handleRecord}
                      className="btn-secondary"
                    >
                      🎙️ Record Audio
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files?.[0])}
                  />
                </div>
              )}

              {isRecording && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center animate-pulse">
                    <div className="w-4 h-4 rounded-full bg-red-500" />
                  </div>
                  <p className="text-red-400 font-semibold">Recording... {formattedDuration}</p>
                  <button onClick={handleRecord} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-semibold transition-colors">
                    ⏹️ Stop Recording
                  </button>
                </div>
              )}

              {audioBlob && !isRecording && !isLoading && !prediction && (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center">
                    <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-300 font-medium">Audio ready — click Analyse to detect emotion</p>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePredict(audioBlob)}
                      className="btn-primary flex items-center gap-2 px-8 py-3 text-base font-bold"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.347.347a3.004 3.004 0 01-.232 3.31L12 21 9.2 17.99a3.004 3.004 0 01-.232-3.31l-.347-.347z" />
                      </svg>
                      Analyse Emotion
                    </motion.button>
                    <button onClick={handleReset} className="btn-secondary">
                      🔄 Reset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error display */}
            {(error || recorderError) && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                {error || recorderError}
              </div>
            )}

            {/* Waveform */}
            {audioUrl && (
              <div className="mt-6">
                <WaveformDisplay audioUrl={audioUrl} />
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div className="mt-8 flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-400">Analyzing emotion...</p>
              </div>
            )}

            {/* Results */}
            {prediction && (
              <div className="mt-8 space-y-6">
                {/* Top prediction */}
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                      style={{
                        backgroundColor: getEmotionStyle(prediction.emotion).bg + '20',
                      }}
                    >
                      {EMOTION_EMOJIS[prediction.emotion]}
                    </div>
                    <div>
                      <p className="text-sm text-gray-400 mb-0.5">Detected Emotion</p>
                      <p className="text-2xl font-bold capitalize">{prediction.emotion}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-0.5">Confidence</p>
                    <p className="text-3xl font-black text-gradient">
                      {formatConfidence(prediction.confidence)}
                    </p>
                  </div>
                </div>

                {/* Confidence bars */}
                <div className="space-y-2">
                  {[...EMOTIONS].sort(
                    (a, b) => (prediction.per_class_scores[b] || 0) - (prediction.per_class_scores[a] || 0)
                  ).map((emotion) => (
                    <EmotionBar
                      key={emotion}
                      emotion={emotion}
                      score={prediction.per_class_scores[emotion] || 0}
                      maxScore={prediction.confidence}
                    />
                  ))}
                </div>

                {/* Chart */}
                <ChartPanel perClassScores={prediction.per_class_scores} />

                {/* LLM Insight */}
                {prediction.insight && (
                  <InsightCard
                    insight={prediction.insight}
                    emotion={prediction.emotion}
                    confidence={prediction.confidence}
                  />
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-white/5">
                  <span>Model: {prediction.model_architecture}</span>
                  <span>Latency: {prediction.processing_time_ms?.toFixed(0)}ms</span>
                </div>

                {/* Reset */}
                <div className="text-center">
                  <button onClick={handleReset} className="btn-secondary">
                    🔄 Analyze Another Clip
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
