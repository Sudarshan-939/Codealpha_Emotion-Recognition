import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'API request failed'
    return Promise.reject(new Error(message))
  }
)

/**
 * Upload audio file for emotion prediction
 */
export async function predictEmotion(audioBlob, architecture = 'production') {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.wav')

  const { data } = await api.post('/predict', formData, {
    params: { architecture },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * Upload audio file for emotion prediction with LLM insight
 */
export async function predictWithInsight(audioBlob, architecture = 'production') {
  const formData = new FormData()
  formData.append('file', audioBlob, 'recording.wav')

  const { data } = await api.post('/predict/insight', formData, {
    params: { architecture },
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/**
 * List available trained models
 */
export async function getModels() {
  const { data } = await api.get('/models')
  return data
}

/**
 * Health check
 */
export async function healthCheck() {
  const { data } = await api.get('/health')
  return data
}

export default api
