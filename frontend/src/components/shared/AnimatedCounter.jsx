import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

export function AnimatedCounter({ value, decimals = 0, suffix = '' }) {
  const spring = useSpring(0, { stiffness: 60, damping: 20 })
  const display = useTransform(spring, (v) => {
    const n = decimals ? v.toFixed(decimals) : Math.floor(v).toLocaleString()
    return `${n}${suffix}`
  })
  const [text, setText] = useState('0')

  useEffect(() => {
    spring.set(value)
    return display.on('change', setText)
  }, [value, spring, display])

  return <motion.span>{text}</motion.span>
}
