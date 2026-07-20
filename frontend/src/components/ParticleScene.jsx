import React, { useRef, useMemo, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float } from '@react-three/drei'
import * as THREE from 'three'

function Particles({ count = 2000, emotion = 'neutral' }) {
  const meshRef = useRef()
  const { viewport } = useThree()

  // Emotion-specific color palettes
  const emotionColors = useMemo(() => ({
    neutral:  [new THREE.Color('#94a3b8'), new THREE.Color('#cbd5e1'), new THREE.Color('#64748b')],
    calm:     [new THREE.Color('#67e8f9'), new THREE.Color('#a5f3fc'), new THREE.Color('#22d3ee')],
    happy:    [new THREE.Color('#fbbf24'), new THREE.Color('#fde68a'), new THREE.Color('#f59e0b')],
    sad:      [new THREE.Color('#60a5fa'), new THREE.Color('#93c5fd'), new THREE.Color('#3b82f6')],
    angry:    [new THREE.Color('#ef4444'), new THREE.Color('#fca5a5'), new THREE.Color('#dc2626')],
    fearful:  [new THREE.Color('#a78bfa'), new THREE.Color('#c4b5fd'), new THREE.Color('#8b5cf6')],
    disgust:  [new THREE.Color('#34d399'), new THREE.Color('#6ee7b7'), new THREE.Color('#10b981')],
    surprised:[new THREE.Color('#f472b6'), new THREE.Color('#f9a8d4'), new THREE.Color('#ec4899')],
  }), [])

  const [positions, velocities, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const palette = emotionColors[emotion] || emotionColors.neutral

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Spherical distribution
      const radius = 2 + Math.random() * 4
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)

      velocities[i3] = (Math.random() - 0.5) * 0.002
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.002
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.002

      const color = palette[Math.floor(Math.random() * palette.length)]
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b

      sizes[i] = Math.random() * 3 + 1
    }

    return [positions, velocities, colors, sizes]
  }, [count, emotion, emotionColors])

  useFrame((state) => {
    if (!meshRef.current) return
    const time = state.clock.getElapsedTime()
    const posAttr = meshRef.current.geometry.attributes.position
    const arr = posAttr.array

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      arr[i3] += velocities[i3] + Math.sin(time * 0.3 + i * 0.01) * 0.001
      arr[i3 + 1] += velocities[i3 + 1] + Math.cos(time * 0.2 + i * 0.01) * 0.001
      arr[i3 + 2] += velocities[i3 + 2] + Math.sin(time * 0.4 + i * 0.01) * 0.0005

      // Boundary wrapping
      for (let j = 0; j < 3; j++) {
        if (arr[i3 + j] > 6) arr[i3 + j] = -6
        if (arr[i3 + j] < -6) arr[i3 + j] = 6
      }
    }
    posAttr.needsUpdate = true

    meshRef.current.rotation.y = time * 0.03
    meshRef.current.rotation.x = Math.sin(time * 0.02) * 0.1
  })

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

function FloatingRings() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Float key={i} speed={1.5} rotationIntensity={0.5} floatIntensity={1}>
          <mesh rotation={[Math.PI / 3 * i, Math.PI / 6 * i, 0]}>
            <torusGeometry args={[2.5 + i * 0.8, 0.01, 16, 100]} />
            <meshBasicMaterial color="#5c7cfa" transparent opacity={0.15 - i * 0.03} />
          </mesh>
        </Float>
      ))}
    </>
  )
}

export default function ParticleScene({ emotion = 'neutral' }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 60 }}
      style={{ position: 'absolute', inset: 0 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <Particles emotion={emotion} />
      <FloatingRings />
    </Canvas>
  )
}
