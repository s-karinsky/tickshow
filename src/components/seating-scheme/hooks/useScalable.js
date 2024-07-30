import { useCallback, useEffect, useState } from "react"
import Hammer from "hammerjs"

export function useScalable({ fitToScreen: fit, min = 0.5, max = 4, step = 0.5 } = {}) {
  const [scale, setScale] = useState(1)
  const [rect, setRect] = useState({ width: 0, height: 0 })
  const [node, setNode] = useState(null)

  const ref = useCallback((newNode) => {
    setNode(newNode)
  }, [])
  
  const handleWheel = useCallback((event) => {
    if (!event.ctrlKey && event.type !== 'pinch') return
    event.preventDefault()
    const { deltaY } = event
    setScale((prev) => {
      const next = prev + (deltaY > 0 ? -step : step)
      return Math.min(Math.max(next, min), max)
    })
  }, [min, max, step])

  useEffect(() => {
    if (!node) return
    const { width, height } = node.getBoundingClientRect()
    setRect({ width, height })
    node.addEventListener('wheel', handleWheel)
    
    const hammer = new Hammer(node, {
      domEvents: true
    });

    hammer.get('pinch').set({ enable: true})

    Hammer(node).on('pinch', handleWheel)
    return () => node.removeEventListener('wheel', handleWheel)
  }, [node])

  useEffect(() => {
    if (!node) return
    const width = rect.width * scale
    const height = rect.height * scale
    node.style.width = `${width}px`
    node.style.height = `${height}px`
  }, [node, rect, scale])

  return [ref, { scale, width: rect.width * scale, height: rect.height * scale }]
}