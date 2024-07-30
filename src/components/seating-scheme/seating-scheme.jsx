import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hammer from 'hammerjs'
import { useDimensions } from 'utils/hooks'
import { createDefs, createStyles, stringToSvg } from './utils'
import './seating-scheme.scss'

const SeatingScheme = forwardRef((props, ref) => {
  const { src, categories, tickets, cart } = props

  const [ viewportRef, viewport ] = useDimensions()
  const dragRef = useRef(null)
  const svgRef = useRef(null)

  const scale = useRef({ value: 1, initialWidth: 0, initialHeight: 0 })
  const pos = useRef({ x: 0, y: 0 })

  const zoomMin = 0.5
  const zoomMax = 4
  const zoomStep = 0.5

  const zoom = useCallback((next) => {
    const value = Math.min(Math.max(next, zoomMin), zoomMax)
    const width = value * scale.current.initialWidth
    const height = value * scale.current.initialHeight
    svgRef.current.style.width = `${width}px`
    svgRef.current.style.height = `${height}px`
    scale.current.value = value
  }, [])
  const zoomIn = useCallback(() => zoom(scale.current.value + zoomStep), [])
  const zoomOut = useCallback(() => zoom(scale.current.value - zoomStep), [])

  const handleWheel = (event) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    event.deltaY > 0 ? zoomOut() : zoomIn()
  }

  useEffect(() => {
    const node = svgRef.current
    if (!node || !src) return
    const svg = stringToSvg(src)
    // Черная галочка для мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1.5 3.5 L 3 5 L 6 2', className: 'seat-check' }])
    // Белая галочка для категории без мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1 3 L 4.25 6.25 L 10 0.5', className: 'category-check' }])
    createStyles(svg, categories)

    if (node.hasChildNodes()) node.innerHTML = ''
    Array.from(svg.attributes).forEach(({ name, value }) => ['width', 'height'].includes(name) ?
      node.style[name] = value :
      node.setAttribute(name, value))
    Array.from(svg.children).forEach(child => node.appendChild(child))
  }, [src])

  useEffect(() => {
    const dragEl = dragRef.current
    const rect = dragEl.getBoundingClientRect()
    scale.current = { value: 1, initialWidth: rect.width, initialHeight: rect.height }
    const hammer = new Hammer(dragEl)

    /* Перетаскивание мышью и тачем */
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
    const handlePan = ({ type, deltaX, deltaY }) => {
      const x  = deltaX + pos.current.x
      const y = deltaY + pos.current.y
      dragEl.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (type === 'panend') {
        pos.current = { x, y }
      }
    }
    hammer.on('pan panend', handlePan)

    /* Зум пальцами и колесиком */
    let initialScale
    dragEl.addEventListener('wheel', handleWheel)
    hammer.get('pinch').set({ enable: true })
    const handlePinch = (ev) => {
      if (ev.type === 'pinchstart') {
        initialScale = scale.current.value
        svgRef.current.style.transition = 'none'
      }
      zoom(initialScale * ev.scale)
      if (ev.type === 'pinchend') {
        svgRef.current.style.transition = null
      }
    }
    hammer.on('pinchstart pinch pinchend', handlePinch)

    const handleTap = (event) => {
      console.log('Tap: ', event)
      // Handle swipe event here
    }
    hammer.on('tap', handleTap)

    return () => {
      dragEl.removeEventListener('wheel', handleWheel)
      hammer.off('pan panend', handlePan)
      hammer.off('pinch', handlePinch)
      hammer.off('tap', handleTap)
      hammer.destroy()
    }
  }, [])
 
  return (
    <div
      className='scheme-viewport'
      ref={viewportRef}
    >
      <div
        className='scheme-draggable'
        ref={dragRef}
      >
        <svg
          className='scheme-svg'
          ref={svgRef}
        />
      </div>
    </div>
  )
})

export default SeatingScheme