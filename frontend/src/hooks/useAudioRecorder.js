import { useState, useRef, useCallback } from 'react'
import useStore from '../utils/store'

/**
 * Custom hook for audio recording using MediaRecorder API
 */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)

  const { setAudioBlob, clearPrediction } = useStore()

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      clearPrediction()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      })

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop())

        clearInterval(timerRef.current)
        setIsRecording(false)
        setIsPaused(false)
      }

      mediaRecorder.onerror = (e) => {
        setError('Recording failed: ' + e.error?.message)
        setIsRecording(false)
        clearInterval(timerRef.current)
      }

      mediaRecorder.start(100) // Collect data every 100ms
      setIsRecording(true)
      startTimeRef.current = Date.now()

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)
    } catch (err) {
      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone access denied. Please allow microphone access and try again.'
          : err.name === 'NotFoundError'
          ? 'No microphone found. Please connect a microphone.'
          : 'Failed to start recording: ' + err.message
      )
    }
  }, [setAudioBlob, clearPrediction])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }, [isRecording])

  const resetRecording = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setError(null)
  }, [setAudioBlob])

  const formatDuration = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  return {
    isRecording,
    isPaused,
    duration,
    formattedDuration: formatDuration(duration),
    error,
    startRecording,
    stopRecording,
    resetRecording,
  }
}
