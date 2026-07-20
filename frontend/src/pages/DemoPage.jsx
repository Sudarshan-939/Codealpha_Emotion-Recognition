import React, { useEffect } from 'react'
import Demo from '../components/Demo'
import Footer from '../components/Footer'
import useStore from '../utils/store'
import { getModels } from '../utils/api'

export default function DemoPage() {
  const { setAvailableModels } = useStore()

  useEffect(() => {
    getModels()
      .then(setAvailableModels)
      .catch(() => {})
  }, [setAvailableModels])

  return (
    <>
      <div className="pt-20">
        <Demo />
      </div>
      <Footer />
    </>
  )
}
