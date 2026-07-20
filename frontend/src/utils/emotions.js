/**
 * Emotion constants, colors, and labels
 */

export const EMOTIONS = [
  'neutral', 'calm', 'happy', 'sad', 'angry', 'fearful', 'disgust', 'surprised'
]

export const EMOTION_COLORS = {
  neutral:  { bg: '#94a3b8', text: '#1e293b', label: '😐 Neutral' },
  calm:     { bg: '#67e8f9', text: '#0e7490', label: '😌 Calm' },
  happy:    { bg: '#fbbf24', text: '#78350f', label: '😊 Happy' },
  sad:      { bg: '#60a5fa', text: '#1e3a5f', label: '😢 Sad' },
  angry:    { bg: '#ef4444', text: '#fff',     label: '😠 Angry' },
  fearful:  { bg: '#a78bfa', text: '#2e1065', label: '😨 Fearful' },
  disgust:  { bg: '#34d399', text: '#064e3b', label: '🤢 Disgust' },
  surprised:{ bg: '#f472b6', text: '#831843', label: '😲 Surprised' },
}

export const EMOTION_EMOJIS = {
  neutral: '😐',
  calm: '😌',
  happy: '😊',
  sad: '😢',
  angry: '😠',
  fearful: '😨',
  disgust: '🤢',
  surprised: '😲',
}

export const EMOTION_DESCRIPTIONS = {
  neutral: 'A baseline, non-emotional state. Even pitch, steady pace, minimal energy variation.',
  calm: 'Relaxed, at ease. Soft voice, gentle cadence, low arousal.',
  happy: 'Joyful, positive affect. Higher pitch variation, faster speech, bright tone.',
  sad: 'Low energy, melancholy. Lower pitch, slower speech rate, reduced volume.',
  angry: 'High arousal, negative affect. Elevated pitch, loud, sharp articulation, fast.',
  fearful: 'Tense, anxious. Trembling voice, higher pitch, irregular rhythm.',
  disgust: 'Aversive response. Distinctive vocal curl, lower pitch, tense.',
  surprised: 'Sudden reaction. Sharp pitch spike, wide dynamic range, brief.',
}

export function getEmotionStyle(emotion) {
  return EMOTION_COLORS[emotion] || EMOTION_COLORS.neutral
}

export function getEmotionEmoji(emotion) {
  return EMOTION_EMOJIS[emotion] || '❓'
}

export function getEmotionDescription(emotion) {
  return EMOTION_DESCRIPTIONS[emotion] || ''
}

export function formatConfidence(score) {
  return `${(score * 100).toFixed(1)}%`
}
