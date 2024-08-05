import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hammer from 'hammerjs'
import { useDimensions, useIsMobile } from 'utils/hooks'
import { createDefs, createStyles, getCursorOffsetToElementCenter, stringToSvg } from './utils'
import SeatingTooltip from 'components/seating-tooltip'
import Button from 'components/button'
import { ReactComponent as ResetIcon } from 'icons/reset.svg'
import { ReactComponent as ZoomIn } from 'icons/zoom-in.svg'
import { ReactComponent as ZoomOut } from 'icons/zoom-out.svg'
import { svgSeat } from 'utils/dom-scheme'
import './seating-scheme.scss'
import classNames from 'classnames'

const SeatingScheme = forwardRef((props, ref) => {
  const [log, setLog] = useState([])

  const { src, categories, tickets, toggleInCart, highlight } = props
  const [ tooltipSeat, setTooltipSeat ] = useState({ visible: false })

  // const [ viewportRef, viewport ] = useDimensions()
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  const svgRef = useRef(null)

  const [ state, setState ] = useState({ x: 0, y: 0 })

  const scale = useRef({ value: 1, initialWidth: 0, initialHeight: 0 })
  const [scaleFactor, setScaleFactor] = useState(1)
  const pos = useRef({ x: 0, y: 0 })

  const zoomMin = 0.4
  const zoomMax = 4
  const zoomStep = 0.4

  let activeEl = useRef(null)

  const move = ({ x = pos.current.x, y = pos.current.y } = {}, options = {}) => {
    const node = dragRef.current
    const { transition, updateCurrent = true } = options
    if (transition) {
      node.style.transition = typeof transition === 'string' ? transition : '.2s ease-in-out'
      node.style.transitionPropery = 'transform'
      node.addEventListener('transitionend', () => node.style.transition = null, { once: true })
    }
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`
    if (updateCurrent) pos.current = { x, y }
  }

  const getZoomToFillViewportSide = useCallback((type) => {
    const node = svgRef.current
    const { value } = scale.current
    const { width, height } = node.getBoundingClientRect()
    const viewportRect = viewportRef.current.getBoundingClientRect()
    return Math[type](viewportRect.width / (width / value), viewportRect.height / (height / value))
  }, [])
  const getCoverZoom = () => getZoomToFillViewportSide('max')
  const getContainZoom = () => getZoomToFillViewportSide('min')

  useEffect(() => {
    if (!highlight) {
      Array.from(svgRef.current.querySelectorAll(`.svg-seat`)).forEach(el => el.removeAttribute('style'))
      return
    }
    Array.from(svgRef.current.querySelectorAll(`.svg-seat[data-category="${highlight}"]`))
      .forEach(el => el.removeAttribute('style'))
    Array.from(svgRef.current.querySelectorAll(`.svg-seat:not([data-category="${highlight}"])`))
      .forEach(el => el.style.fill = '#666')
  }, [highlight])

  const zoom = useCallback((next) => {
    const { initialWidth, initialHeight } = scale.current
    if (!initialHeight || !initialWidth) return
    const value = Math.min(Math.max(next, zoomMin), zoomMax)
    const width = value * initialWidth
    const height = value * initialHeight
    svgRef.current.style.width = `${width}px`
    svgRef.current.style.height = `${height}px`
    scale.current.value = value
    setScaleFactor(value)
  }, [])
  const zoomIn = useCallback(() => zoom(scale.current.value + zoomStep), [])
  const zoomOut = useCallback(() => zoom(scale.current.value - zoomStep), [])
  const isMobile = useIsMobile()

  const fitToViewport = useCallback(() => {
    move({ x: 0, y: 0 }, { transition: true })
    zoom(getContainZoom())
  }, [])
  
  const handleWheel = (event) => {
    if (!event.ctrlKey) return
    event.preventDefault()
    event.deltaY > 0 ? zoomOut() : zoomIn()
  }

  useEffect(() => {
    const dragEl = dragRef.current
    const hammer = new Hammer(dragEl)

    /* Перетаскивание мышью и тачем */
    hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL })
    const handlePan = ({ type, deltaX, deltaY }) => {
      const x  = deltaX + pos.current.x
      const y = deltaY + pos.current.y
      move({ x, y }, { updateCurrent: false })
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
      console.log(ev);
      
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
      if (scale.current.value < 1) {
        const offset = getCursorOffsetToElementCenter(viewportRef.current, event.srcEvent)
        const x = (pos.current.x + offset.x) / scale.current.value * 2
        const y = (pos.current.y + offset.y) / scale.current.value * 2
        zoom(getCoverZoom())
        move({ x, y }, { transition: true })
        return
      }
  
      const el = event.target
      const ticket = tickets.find(t => t.id === el.id)
      const { visible, ticketId } = tooltipSeat
      if (ticket && (event.pointerType === 'mouse' || activeEl.current === el)) {
        toggleInCart(ticket)
      }
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


  useEffect(() => {
    const node = svgRef.current
    if (!node || !src) return
    const svg = stringToSvg(src)
    // Черная галочка для мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1.5 3.5 L 3 5 L 6 2', className: 'seat-check', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', id: 'checked-seat-path' }])
    // Белая галочка для категории без мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1 3 L 4.25 6.25 L 10 0.5', className: 'category-check', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', id: 'checked-category-path' }])
    createStyles(svg, categories)

    if (node.hasChildNodes()) node.innerHTML = ''
    Array.from(svg.attributes).forEach(({ name, value }) => ['width', 'height'].includes(name) ?
      node.style[name] = value :
      node.setAttribute(name, value))
    Array.from(svg.children).forEach(child => node.appendChild(child))
    Array.from(node.querySelectorAll('.svg-seat')).forEach(el => {
      const [category, row, num] = ['category', 'row', 'seat'].map(attr => el.getAttribute(`data-${attr}`))
      el.id = `seat-${[category, row, num].join('-')}`
      const seat = svgSeat(el)
      let seatTicket = seat.isMultiple() ?
        tickets.filter(item => item.category === category) :
        tickets.find(item => item.id === el.id)

      if (!seatTicket || (Array.isArray(seatTicket) && !seatTicket.length)) {
        el.setAttribute('data-disabled', '')
      } else {
        const hasInCart = seat.isMultiple() ? seatTicket.some(ticket => ticket.inCart) : seatTicket.inCart
        seat.checked(hasInCart)
        if (!seat.isMultiple()) {
          el.addEventListener('mouseover', (e) => {
            activeEl.current = el
            const pos = el.getBBox()
            setTooltipSeat({
              visible: true,
              x: pos.x + pos.width,
              y: pos.y + pos.height,
              ticketId: seatTicket.id
            })
          })
          el.addEventListener('mouseout', (e) => {
            setTooltipSeat({ visible: false, ticketId: seatTicket.id })
          })
        }
      }
    })

    const dragEl = dragRef.current
    const rect = dragEl.getBoundingClientRect()
    scale.current.initialWidth = rect.width
    scale.current.initialHeight = rect.height
    
    fitToViewport()
  }, [src])

  useEffect(() => {
    tickets.forEach(ticket => {
      const el = svgRef.current.querySelector(`#${ticket.id}`)
      if (!el) return
      svgSeat(el).checked(ticket.inCart)
    })
  }, [tickets])
  
  return (
    <div
      className='scheme-viewport'
      ref={viewportRef}
    >
      <div style={{ position: 'fixed', left: 0, top: 0, background: '#333', color: '#fff', zIndex:10000 }}>
        {log.map(msg => <>{msg}<br /></>)}
      </div>
      
      <div className='scheme-zoom'>
        <button
          className={classNames('scheme-control')}
          onClick={() => zoomOut()}
        >
          <ZoomOut style={{ width: 17 }} />
        </button>
        <button
          className={classNames('scheme-control')}
          onClick={() => zoomIn()}
        >
          <ZoomIn style={{ width: 17 }} />
        </button>
      </div>
      <div className='scheme-reset'>
        <button
          className={classNames('scheme-control', { 'scheme-control_hidden': scaleFactor <= 1.2 })}
          onClick={() => fitToViewport()}
        >
          <ResetIcon style={{ width: 23 }} />
        </button>
      </div>
      <div
        className='scheme-draggable'
        ref={dragRef}
      >
        {tickets?.length > 0 && <SeatingTooltip
          {...tickets.find(ticket => ticket.id === tooltipSeat.ticketId)}
          categories={categories}
          visible={tooltipSeat.visible}
          x={tooltipSeat.x}
          y={tooltipSeat.y}
          hideDelay={500}
          scaleFactor={scaleFactor}
          toggleInCart={toggleInCart}
        />}
        <svg
          className='scheme-svg'
          ref={svgRef}
        />
      </div>
    </div>
  )
})

export default SeatingScheme