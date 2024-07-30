import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import debounce from './debounce'
import { svgSeat } from './dom-scheme'
import { SEAT_CLASS } from '../const'

export function useLocalStorage(key, defaultValue) {
  const serialize = () => {
    let currentValue
    try {
      currentValue = JSON.parse(
        localStorage.getItem(key) || String(defaultValue)
      )
    } catch (error) {
      currentValue = defaultValue
    }
    return currentValue
  }
  const [value, setValue] = useState(serialize)
  const handleChange = () => setValue(serialize)

  useEffect(() => {
    window.addEventListener('storage', handleChange)
    return () => window.removeEventListener('storage', handleChange)
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [value, key])

  return [value, setValue]
}

export function useWindowSize() {
  const [size, setSize] = useState({
    width: null,
    height: null,
  })

  useLayoutEffect(() => {
    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return size
}

export function useIsMobile() {
  const [ isMobile, setIsMobile ] = useState(false)
  const size = useWindowSize()

  useEffect(() => {
    setIsMobile(size.width < 1024)
  }, [size.width])

  return isMobile
}

export function useSeatEvent(cb, { selector = `.${SEAT_CLASS}` } = {}) {
  const isMobile = useIsMobile()
  return useCallback(event => {
    const el = event.target
    if (!el.matches(selector)) return
    const seat = svgSeat(el)
    cb({ event, el, seat, isMobile })
  }, [cb, isMobile])
}

export function useDimensions(liveMeasure = true, delay = 250, initialDimensions = {}, effectDeps = []) {
  const [dimensions, setDimensions] = useState(initialDimensions)
  const [node, setNode] = useState(null)

  const ref = useCallback((newNode) => {
    setNode(newNode)
  }, [])

  useLayoutEffect(() => {
    if (!node) return

    const measure = () => {
      window.requestAnimationFrame(() => {
        const newDimensions = node.getBoundingClientRect()
        setDimensions(newDimensions)
      })
    }
    measure()

    if (liveMeasure) {
      const debounceMeasure = debounce(measure, delay)
      if ('ResizeObserver' in window) {
        const resizeObserver = new ResizeObserver(debounceMeasure)
        resizeObserver.observe(node)
        window.addEventListener('scroll', debounceMeasure)
        return () => {
          resizeObserver.disconnect()
          window.removeEventListener('scroll', debounceMeasure)
        }
      }
      window.addEventListener('resize', debounceMeasure)
      window.addEventListener('scroll', debounceMeasure)

      return () => {
        window.removeEventListener('resize', debounceMeasure)
        window.removeEventListener('scroll', debounceMeasure)
      }
    }
  }, [node, liveMeasure, ...effectDeps])

  return [ref, dimensions, node]
}
