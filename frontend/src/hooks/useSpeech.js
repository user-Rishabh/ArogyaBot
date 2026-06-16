import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * useSpeech — wraps webkitSpeechRecognition for Indian language recognition.
 * @param {string} lang - 'en-IN' or 'hi-IN'
 */
export function useSpeech(lang = 'en-IN') {
  const [transcript,  setTranscript]  = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)

  const SpeechRecognition =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null

  const isSupported = Boolean(SpeechRecognition)

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }, [])

  const startListening = useCallback(() => {
    if (!isSupported) {
      console.warn('SpeechRecognition is not supported in this browser.')
      return
    }
    if (isListening) {
      stopListening()
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang           = lang
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.continuous     = false

    recognition.onstart = () => setIsListening(true)

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1]
      setTranscript(result[0].transcript)
    }

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [isSupported, isListening, lang, stopListening])

  // Restart recognition when language changes while listening
  useEffect(() => {
    if (isListening) {
      stopListening()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    clearTranscript: () => setTranscript(''),
  }
}
