import React, { useEffect } from 'react'
import Hero from '../components/Hero'
import About from '../components/About'
import TechStack from '../components/TechStack'
import Footer from '../components/Footer'
import useStore from '../utils/store'
import { getModels } from '../utils/api'

export default function HomePage() {
  const { setAvailableModels } = useStore()

  useEffect(() => {
    getModels()
      .then(setAvailableModels)
      .catch(() => {})
  }, [setAvailableModels])

  return (
    <>
      <Hero />
      <About />
      <TechStack />
      <Footer />
    </>
  )
}
