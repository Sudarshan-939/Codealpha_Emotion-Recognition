import { create } from 'zustand'

const useStore = create((set, get) => ({
  // Prediction state
  prediction: null,
  isLoading: false,
  error: null,

  // Recording state
  isRecording: false,
  audioBlob: null,
  audioUrl: null,

  // Models
  availableModels: [],
  selectedModel: 'production',

  // UI state
  activeSection: 'hero',

  // Actions
  setPrediction: (prediction) => set({ prediction, error: null }),
  setIsLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  clearPrediction: () => set({ prediction: null, error: null, audioBlob: null, audioUrl: null }),

  setIsRecording: (isRecording) => set({ isRecording }),
  setAudioBlob: (audioBlob) => {
    const prev = get().audioUrl
    if (prev) URL.revokeObjectURL(prev)
    const audioUrl = audioBlob ? URL.createObjectURL(audioBlob) : null
    set({ audioBlob, audioUrl })
  },
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setAvailableModels: (availableModels) => set({ availableModels }),
  setActiveSection: (activeSection) => set({ activeSection }),
}))

export default useStore
