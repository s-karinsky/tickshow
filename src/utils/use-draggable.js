import React, { useRef, useState, useEffect, useCallback } from 'react'
import { unstable_batchedUpdates as batch } from 'react-dom'
import Hammer from 'hammerjs'

export const throttle = (f) => {
  let token = null,
    lastArgs = null
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
export const useDraggableAndScalable = ({ onDrag = id, disabled } = {}) => {
  const [pressed, setPressed] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [scale, setScale] = useState(1)
  const hammer = useRef()
  const ref = useRef()
  const dragTargetRef = useRef()
  const scaleTargetRef = useRef()
  const initialSize = useRef()
  const updateScale = scale => {
    if (!initialSize.current && scaleTargetRef.current) {
      initialSize.current = {
        width: scaleTargetRef.current.clientWidth,
        height: scaleTargetRef.current.clientHeight
      }
    }
    const val = Math.min(Math.max(scale, 0.5), 4)
    scaleTargetRef.current.style.width = initialSize.current.width * val
    scaleTargetRef.current.style.height = initialSize.current.height * val
    setScale(val)
  }
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) {
      return
    }
    setPressed(true)
  }, [])
  const handlePinch = (e) => {
    setPressed(false)
    const realDistance = e.distance / scale
    const width = scaleTargetRef.current.clientWidth + realDistance
    const newScale = width / initialSize.width
    console.log(e)
    updateScale(e.scale)
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
    const elem = ref.current
    if (elem) {
      elem.style.cursor = pressed ? 'grabbing' : 'grab'
    }
    if (!pressed) {
      return
    }
    elem.style.cursor = 'grabbing'
    let delta = position,
      lastPosition = position
    const applyTransform = () => {
      if (!ref.current || !dragTargetRef.current) {
        return
      }
      const { x, y } = lastPosition
      dragTargetRef.current.style.transform = `translate(${x}px, ${y}px)`
    }
    const handleMouseMove = throttle(({ movementX, movementY }) => {
      const { x, y } = delta
      delta = { x: x + movementX, y: y + movementY }
      lastPosition = persistentOnDrag(delta)
      applyTransform()
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
      applyTransform()
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
  }, [position, pressed, persistentOnDrag])
  return [combinedRef, dragTargetRef, scaleTargetRef, pressed, position, scale, updateScale, setPosition]
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