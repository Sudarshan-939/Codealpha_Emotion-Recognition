import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-xs font-bold">
              ES
            </div>
            <span className="text-sm font-bold tracking-tight">
              Emotion<span className="text-gradient">Sense</span>
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link to="/demo" className="hover:text-gray-300 transition-colors">Demo</Link>
            <Link to="/about" className="hover:text-gray-300 transition-colors">About</Link>
            <Link to="/tech" className="hover:text-gray-300 transition-colors">Tech</Link>
            <a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer" className="hover:text-gray-300 transition-colors">
              Swagger ↗
            </a>
          </div>

          {/* Credit */}
          <p className="text-xs text-gray-600">
            Built with TensorFlow, FastAPI, React &amp; Three.js
          </p>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 text-center">
          <p className="text-xs text-gray-600">
            Speech Emotion Recognition Platform — Classifying 8 emotions from voice using deep learning.
          </p>
        </div>
      </div>
    </footer>
  )
}
