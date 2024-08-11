import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Hammer from 'hammerjs'
import classNames from 'classnames'
import { useDimensions } from 'utils/hooks'
import SeatingTooltip from 'components/seating-tooltip'
import Button from 'components/button'
import { ReactComponent as ResetIcon } from 'icons/reset.svg'
import { ReactComponent as TicketLogo } from 'icons/ticket_logo.svg'
import { ReactComponent as ZoomIn } from 'icons/zoom-in.svg'
import { ReactComponent as ZoomOut } from 'icons/zoom-out.svg'
import { svgSeat } from 'utils/dom-scheme'
import { createDefs, createStyles, getCursorOffsetToElementCenter, stringToSvg } from './utils'
import './seating-scheme.scss'

const mapSeat = (node, cb, joinToSelector = '') =>
  Array.from(node.querySelectorAll(`.svg-seat${joinToSelector}`)).map(cb)

const SeatingScheme = forwardRef((props, ref) => {
  const [log, setLog] = useState([])

  const { src, categories, tickets, toggleInCart, highlight, selectedCategory, resetSelectedCategory } = props
  const [ tooltipSeat, setTooltipSeat ] = useState({ visible: false })
  
  const viewportRef = useRef(null)
  const dragRef = useRef(null)
  const svgRef = useRef(null)

  const scale = useRef({ value: 1, initialWidth: 0, initialHeight: 0 })
  const pos = useRef({ x: 0, y: 0 })
  const [scaleFactor, setScaleFactor] = useState(1)

  const zoomMin = 0.4
  const zoomMax = 4
  const zoomStep = 0.4

  const moveLimits = useMemo(() => {
    if (!svgRef.current || !viewportRef.current) return [[0, 0], [0, 0]]
    const node = svgRef.current
    const vpBounds = viewportRef.current.getBoundingClientRect()
    const width = scale.current.initialWidth * scaleFactor
    const height = scale.current.initialHeight * scaleFactor
    const min = [0, 0]
    const max = [0, 0] 
    if (width > vpBounds.width) {
      const x = (width - vpBounds.width) / 2
      min[0] = -x
      max[0] = x
    }
    if (height > vpBounds.height) {
      const y = (height - vpBounds.height) / 2
      min[1] = -y
      max[1] = y
    }
    return [min, max]
  }, [scaleFactor])
  
  const move = ({ x = pos.current.x, y = pos.current.y } = {}, options = {}) => {
    const node = dragRef.current
    const { transition, updateCurrent = true } = options
    if (transition) {
      node.style.transition = typeof transition === 'string' ? transition : '.2s ease-in-out'
      node.style.transitionPropery = 'transform'
      node.addEventListener('transitionend', () => node.style.transition = null, { once: true })
    }
    x = Math.min(Math.max(x, moveLimits[0][0]), moveLimits[1][0])
    y = Math.min(Math.max(y, moveLimits[0][1]), moveLimits[1][1])
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
    const node = svgRef.current
    if (!highlight) {
      mapSeat(node, el => el.removeAttribute('style'), '')
      return
    }
    mapSeat(node, el => el.removeAttribute('style'), `[data-category="${highlight}"]`)
    mapSeat(node, el => el.style.fill = '#666', `:not([data-category="${highlight}"])`)
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
    hammer.get('pan').set({ domEvents: true, direction: Hammer.DIRECTION_ALL })
    const handlePan = ({ type, deltaX, deltaY }) => {
      const x  = deltaX + pos.current.x
      const y = deltaY + pos.current.y
      move({ x, y }, { updateCurrent: type === 'panend' })
      dragEl.style.cursor = type !== 'panend' ? 'grabbing' : null
    }
    hammer.on('panstart pan panend', handlePan)

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
      if (scale.current.value < 1) {
        event.preventDefault()
        const offset = getCursorOffsetToElementCenter(viewportRef.current, event.srcEvent)
        const x = (pos.current.x + offset.x) / scale.current.value * 2
        const y = (pos.current.y + offset.y) / scale.current.value * 2
        zoom(Math.max(1, getCoverZoom()))
        move({ x, y }, { transition: true })
        return
      }
      const el = event.target
      let ticket = tickets.find(t => t.id === el.id)
      const seat = svgSeat.from(el)
      const isMultiple = seat && seat.isMultiple()
      if (isMultiple) {
        ticket = tickets.find(t => t.category === el.getAttribute('data-category') && !t.inCart) 
      }
      const { visible, ticketId } = tooltipSeat
      if (ticket) {
        if (event.pointerType === 'touch' && !isMultiple) {
          const clone = [el.cloneNode()]
          if (el.nextElementSibling.tagName?.toLowerCase() === 'use') clone.push(el.nextElementSibling.cloneNode())
          document.querySelectorAll('#clone-1, #clone-2').forEach(el => el.remove())
          clone.map((el, i) => {
            el.id = `clone-${(i + 1)}`
            el.classList.add('svg-seat-clone')
            svgRef.current.appendChild(el)
          })
          const pos = el.getBBox()
          setTooltipSeat({
            visible: true,
            x: pos.x + pos.width,
            y: pos.y + pos.height,
            ticketId: ticket.id
          })
        } else {
          toggleInCart(ticket)
        }
      } else {
        const delay = el.matches('.seating-tooltip') || el.closest('.seating-tooltip') ? 500 : 0
        setTooltipSeat(prev => ({ visible: false, ticketId: prev.ticketId, delay }))
        document.querySelectorAll('#clone-1, #clone-2').forEach(el => el.remove())
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
  }, [scaleFactor])


  useEffect(() => {
    const node = svgRef.current
    if (!node || !src) return
    const svg = stringToSvg(src)
    // Черная галочка для мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1.5 3.5 L 3 5 L 6 2', className: 'seat-check', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', id: 'checked-seat-path' }])
    // Белая галочка для категории без мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1 3 L 4.25 6.25 L 10 0.5', className: 'category-check', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', id: 'checked-category-path' }])
    createDefs(svg, ['filter', { id: 'filter-blur' }, '<feGaussianBlur in="SourceGraphic" stdDeviation="1.2"></feGaussianBlur>'])
    createStyles(svg, categories)

    if (node.hasChildNodes()) node.innerHTML = ''
    Array.from(svg.attributes).forEach(({ name, value }) => ['width', 'height'].includes(name) ?
      node.style[name] = value :
      node.setAttribute(name, value))
    Array.from(svg.children).forEach(child => node.appendChild(child))
    Array.from(node.querySelectorAll('.svg-seat')).forEach(el => {
      const [category, row, num] = ['category', 'row', 'seat'].map(attr => el.getAttribute(`data-${attr}`))
      el.id = `seat-${[category, row, num].filter(Boolean).join('-')}`
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
            if (e.sourceCapabilities?.firesTouchEvents) return
            const pos = el.getBBox()
            setTooltipSeat({
              visible: true,
              x: pos.x + pos.width,
              y: pos.y + pos.height,
              ticketId: seatTicket.id
            })
          })
          el.addEventListener('mouseout', (e) => {
            if (e.sourceCapabilities?.firesTouchEvents) return
            setTooltipSeat(prev => ({ visible: false, ticketId: prev.ticketId }))
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
      let isMultiple = ['0', '-1'].includes(ticket.row)
      let id = `#${ticket.id}`
      if (isMultiple) {
        id = `#seat-${ticket.category}`
      }
      const el = svgRef.current.querySelector(id)
      if (!el) return
      const checked = isMultiple ? tickets.some(t => t.category === ticket.category && t.inCart) : ticket.inCart
      svgSeat(el).checked(checked)
    })
  }, [tickets])

  return (
    <div
      className='scheme-viewport'
      ref={viewportRef}
    >   
       {/* <div style={{ position: 'fixed', left: 0, top: 0, padding: 10, background: '#333', color: '#fff' }} id='helppanel' /> */}
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
      <div className='scheme-reset-categories'>
        <button
          className={classNames('scheme-control scheme-control-large', { 'scheme-control_hidden': !selectedCategory })}
          onClick={() => {
            fitToViewport()
            resetSelectedCategory()
          }}
        >
          <svg width="34" height="6" viewBox="0 0 34 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M33 3.4C33.2209 3.4 33.4 3.22091 33.4 3C33.4 2.77909 33.2209 2.6 33 2.6L33 3.4ZM0.717155 2.71716C0.560947 2.87337 0.560947 3.12663 0.717155 3.28284L3.26274 5.82843C3.41895 5.98464 3.67222 5.98464 3.82843 5.82843C3.98464 5.67222 3.98464 5.41895 3.82843 5.26274L1.56569 3L3.82843 0.737258C3.98464 0.581048 3.98464 0.327782 3.82843 0.171573C3.67222 0.0153629 3.41895 0.0153629 3.26274 0.171573L0.717155 2.71716ZM33 2.6L1 2.6L1 3.4L33 3.4L33 2.6Z" fill="currentColor" />
          </svg>
          BACK TO<br />
          ALL CATEGORIES
        </button>
      </div>
      <div className='simple-impudent-logo'>
        <TicketLogo />
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
          hideDelay={tooltipSeat.delay ?? 500}
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