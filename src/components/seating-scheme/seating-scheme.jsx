import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hammer from 'hammerjs'
import { useSeatManager } from './hooks/useSeatManager'
import { useDimensions } from './hooks/useDismensions'
import './seating-scheme.scss'

const SeatingScheme = forwardRef((props, ref) => {
  const { src, categories, tickets, cart } = props

  const [ viewportRef, viewport ] = useDimensions()
  const [ zoomRef, zoomState ] = useSeatManager(src, categories)
  const dragRef = useRef(null)

  const scale = useRef({ value: 1, width: 0, height: 0 })
  const pos = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const hammer = new Hammer(dragRef.current)
    const initialBounds = dragRef.current.getBoundingClientRect()

    /* Перетаскивание мышью и тачем */
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
    const handlePan = ({ type, deltaX, deltaY }) => {
      const x = deltaX + pos.current.x
      const y = deltaY + pos.current.y
      dragRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (type === 'panend') {
        pos.current = { x, y }
      }
    }
    hammer.on('pan panend', handlePan)

    /* Зум пальцами и колесиком */
    hammer.get('pinch').set({ enable: true })
    const handlePinch = ({ scale }) => {
      console.log(scale);
    }
    hammer.on('pinch', handlePinch)

    const handleTap = (event) => {
      console.log('Tap: ', event)
      // Handle swipe event here
    }
    hammer.on('tap', handleTap)

    return () => {
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
          xmlns='http://www.w3.org/2000/svg'
          ref={zoomRef}
        />
      </div>
    </div>
  )
})

export default SeatingScheme