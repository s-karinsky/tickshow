import React, { useRef, useState, useEffect, useCallback } from 'react'
import { unstable_batchedUpdates as batch } from 'react-dom'
import Hammer from 'hammerjs'

const minScale = 0.5
const maxScale = 4
const scaleStep = 0.5

export const throttle = (f) => {
  let token = null
  let lastArgs = null
  const invoke = () => {
    f(...lastArgs)
    token = null
  }
  const result = (...args) => {
    lastArgs = args
    if (!token) {
      token = requestAnimationFrame(invoke)
    }
  }
  result.cancel = () => token && cancelAnimationFrame(token)
  return result
}

// subscribe an action to be done on an element
// useRefEffect: (handler: () => (void | (() => void))) => void
export const useRefEffect = (handler) => {
  const storedValue = useRef()
  const unsubscribe = useRef()
  const result = useCallback(
    (value) => {
      storedValue.current = value
      if (unsubscribe.current) {
        unsubscribe.current()
        unsubscribe.current = undefined
      }
      if (value) {
        unsubscribe.current = handler(value)
      }
    },
    [handler]
  )
  useEffect(() => {
    result(storedValue.current)
  }, [result])
  return result
}

// combine several `ref`s into one
// list of refs is supposed to be immutable after first render
const useCombinedRef = (...refs) => {
  const initialRefs = useRef(refs)
  return useCallback((value) => {
    initialRefs.current.forEach((ref) => {
      if (typeof ref === 'function') {
        ref(value)
      } else {
        ref.current = value
      }
    })
  }, [])
}

// create a ref to subscribe to given element's event
const useDomEvent = (name, handler) => {
  return useCallback(
    (elem) => {
      elem.addEventListener(name, handler)
      return () => {
        elem.removeEventListener(name, handler)
      }
    },
    [name, handler]
  )
}

// callback with persistent reference,
// but updated on every render
const usePersistentCallback = (f) => {
  const realF = useRef(f)
  useEffect(() => {
    realF.current = f
  }, [f])
  return useCallback((...args) => {
    return realF.current(...args)
  }, [])
}

// persistent reference to identity function
const id = (x) => x

// make element draggable
// returns [ref, isDragging, position]
// position doesn't update while dragging
// position is relative to initial position
export const useDraggableAndScalable = ({ onDrag = id, onScale = id, disabled } = {}) => {
  const viewportBounds = useRef()
  const draggableBounds = useRef()
  const [pressed, setPressed] = useState(false)
  const [position, setPositionState] = useState({ x: 0, y: 0 })
  const [scale, setScaleState] = useState(1)
  const hammer = useRef()
  const ref = useRef()
  const dragTargetRef = useRef()
  const scaleTargetRef = useRef()
  const initialSize = useRef()

  const setPosition = (nextPos, transition) => {
    function handleTransitionEnd() {
      this.style.transition = null
      this.removeEventListener('transitionend', handleTransitionEnd)
    }

    if (transition) {
      dragTargetRef.current.style.transition = 'ease-in-out 0.2s transform'
      dragTargetRef.current.addEventListener('transitionend', handleTransitionEnd)
    }

    setPositionState(nextPos)
  }

  const setScale = nextScale => {
    const el = scaleTargetRef.current
    if (typeof nextScale === 'function') {
      const val = nextScale(scale)
      return setScale(val)
    }
    if (!initialSize.current && el) {
      initialSize.current = {
        width: el.clientWidth,
        height: el.clientHeight
      }
    }
    const val = Math.min(Math.max(nextScale, minScale), maxScale)
    const width = initialSize.current.width * val
    const height = initialSize.current.height * val
    const dragBounds = { ...draggableBounds.current, width, height }
    const pos = toValidPosition(position, dragBounds, viewportBounds.current)
    setPosition(pos, true)
    applyTransform(pos)
    el.style.width = width
    el.style.height = height
    setScaleState(val)
  }
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) {
      return
    }
    viewportBounds.current = ref.current.getBoundingClientRect()
    draggableBounds.current = dragTargetRef.current.getBoundingClientRect()

    setPressed(true)
  }, [])
  const handlePinch = (e) => {
    setPressed(false)
    const realDistance = e.distance / scale
    const width = scaleTargetRef.current.clientWidth + realDistance
    const newScale = width / initialSize.width
    setScale(e.scale)
  }

  useEffect(() => {
    if (!ref.current) return
    const elem = ref.current
    elem.style.userSelect = 'none'
    
    hammer.current = new Hammer(ref.current)
    hammer.current.get('pinch').set({ enable: true })
    hammer.current.on('pinch', handlePinch)

    return () => {
      elem.style.userSelect = 'auto'
      hammer.current.off('pinch')
      hammer.current.destroy()
    }
  }, [])
  const subscribeMouseDown = useDomEvent('pointerdown', handleMouseDown)
  const ref2 = useRefEffect(subscribeMouseDown)
  const combinedRef = useCombinedRef(ref, ref2)
  const persistentOnDrag = usePersistentCallback(onDrag)

  useEffect(() => {
    function handleWheel(e) {
      if (e.ctrlKey) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -scaleStep : scaleStep
        setScale(scale + delta)
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [scale])

  function toValidPosition({ x, y }, dragBounds, viewBounds) {
    const { width: dw, height: dh, left: dl, top: dt } = dragBounds
    const { width: vw, height: vh, left: vl, top: vt } = viewBounds
    const limitX = dw - vw > 0 ? 100 * 2 * scale : 0
    const limitY = dh - vh > 0 ? 100 * 2 * scale : 0

    const dx = Math.max(-limitX, Math.min(x, limitX))
    const dy = Math.max(-limitY, Math.min(y, limitY))
    return { x: dx, y: dy }
  }

  function applyTransform(lastPosition) {
    if (!ref.current || !dragTargetRef.current) {
      return
    }
    let { x, y } = lastPosition
    dragTargetRef.current.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`
  }

  useEffect(() => {
    const elem = ref.current
    if (elem) {
      elem.style.cursor = pressed ? 'grabbing' : 'grab'
    }
    if (!pressed) {
      return
    }
    elem.style.cursor = 'grabbing'
    let delta = position
    let lastPosition = position
    const handleMouseMove = throttle(({ movementX, movementY }) => {
      const { x, y } = delta
      
      const { x: dx, y: dy } = toValidPosition({ x: x + movementX, y: y + movementY }, draggableBounds.current, viewportBounds.current)
      delta = { x: dx, y: dy }
      lastPosition = persistentOnDrag(delta)
      applyTransform(lastPosition)
    })
    const handleMouseUp = (e) => {
      handleMouseMove(e)
      batch(() => {
        setPressed(false)
        setPosition(lastPosition)
      })
    }
    const terminate = () => {
      lastPosition = position
      applyTransform(lastPosition)
      setPressed(false)
    }
    const handleKeyDown = (e) => {
      if (e.code === 'Escape') {
        e.preventDefault()
        terminate()
      }
    }
    document.addEventListener('pointermove', handleMouseMove)
    document.addEventListener('pointerup', handleMouseUp)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('blur', terminate)
    return () => {
      handleMouseMove.cancel()
      document.removeEventListener('pointermove', handleMouseMove)
      document.removeEventListener('pointerup', handleMouseUp)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('blur', terminate)
    }
  }, [position, scale, pressed, persistentOnDrag])
  return [combinedRef, dragTargetRef, scaleTargetRef, pressed, position, scale, setScale, setPosition]
}

// subscribe to element's `resize`
export const useResize = (onResize) => {
  const persistentOnResize = usePersistentCallback(onResize)
  const obs = useRef()
  useEffect(() => {
    obs.current = new ResizeObserver((entries) => {
      for (let entry of entries) {
        if (entry.contentBoxSize) {
          const { inlineSize: x, blockSize: y } = Array.isArray(
            entry.contentBoxSize
          )
            ? entry.contentBoxSize[0]
            : entry.contentBoxSize
          persistentOnResize({ x, y })
        } else {
          const { width: x, height: y } = entry.contentRect
          persistentOnResize({ x, y })
        }
      }
    })
  }, [persistentOnResize])
  return useRefEffect((elem) => {
    obs.current && obs.current.observe(elem)
    return () => {
      obs.current && obs.current.unobserve(elem)
    }
  })
}
/* 
/// example.ts
const squareSize = 200
const quickAndDirtyStyle = {
  width: squareSize,
  height: squareSize,
  background: '#FF9900',
  color: '#FFFFFF',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
}

export default function App() {
  const size = useRef({ x: Infinity, y: Infinity })
  // FIXME: if rectangle gets off-screen after resize, it's not OK
  const parentRef = useResize((newSize) => (size.current = newSize))

  const handleDrag = useCallback(
    ({ x, y }) => ({
      x: Math.max(0, Math.min(x, size.current.x - squareSize)),
      y: Math.max(0, Math.min(y, size.current.y - squareSize))
    }),
    []
  )

  const [ref, pressed, { x, y }] = useDraggable({
    onDrag: handleDrag
  })

  return (
    <div ref={parentRef} className='App'>
      <div ref={ref} style={quickAndDirtyStyle} className='blah'>
        {pressed ? 'Dragging...' : `Press to drag {${x}, ${y}}`}
      </div>
    </div>
  )
}
 */