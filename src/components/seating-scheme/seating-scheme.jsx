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
import { SEAT_CLONE_CLASS } from 'const'
import TicketsCounter from 'components/tickets-counter/tickets-counter'
import { useDraggableAndScalable } from 'utils/use-draggable'
import { createDefs, createStyles, getCursorOffsetToElementCenter, stringToSvg } from './utils'
import './seating-scheme.scss'

const mapSeat = (node, cb, joinToSelector = '') =>
  Array.from(node.querySelectorAll(`.svg-seat${joinToSelector}`)).map(cb)

const SeatingScheme = forwardRef((props, ref) => {
  const [log, setLog] = useState([])

  const [counters, setCounters] = useState([])
  const [scale, setScale] = useState(1)
  const [tooltipSeat, setTooltipSeat] = useState({ visible: false })
  const { src, cart, categories, tickets, toggleInCart, highlight, selectedCategory, resetSelectedCategory } = props
  
  const zoomConfig = { min: 0.5, max: 4, step: 0.5 }
  const initial = useRef({ width: null, height: null })
  const svgRef = useRef(null)
  const pointerDownState = useRef({ clientX: 0, clientY: 0, elementId: '', time: 0 })

  const ticketsByCategory = useMemo(() => tickets.reduce((acc, ticket) => ({
    ...acc,
    [ticket.category]: (acc[ticket.category] || []).concat(ticket)
  }), {}), [tickets])


  const handleDrag = useCallback(
    ({ x, y }) => ({
      x,//: Math.max(0, Math.min(x, size.current.x - squareSize)),
      y//: Math.max(0, Math.min(y, size.current.y - squareSize))
    }),
    []
  )

  useEffect(() => {
    if (!svgRef.current) return
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight
    initial.current = { width, height }
  }, [svgRef.current])


  const zoom = (value, animation = 300) => {
    const svg = svgRef.current
    if (!svg) return
    const { min, max } = zoomConfig
    if (value < min) {
      if (scale === min) return
      value = min
    } else if (value > max) {
      if (scale === max) return
      value = max
    }
    if (animation) {
      svg.style.transition = typeof animation === 'number' ? `ease-in-out ${animation}ms transform` : animation
    }
    setScale(value)
  }
  const zoomIn = () => zoom(scale + zoomConfig.step)
  const zoomOut = () => zoom(scale - zoomConfig.step)

  const [viewportRef, draggableRef, pressed, { x, y }, setPosition] = useDraggableAndScalable({
    onDrag: handleDrag
  })

  const handleWheel = useCallback((e) => {
    console.log(e)
    
  }, [])

  useEffect(() => {
    const dragEl = viewportRef.current
    if (!dragEl) return
    //const hammer = new Hammer(dragEl)

    /* Зум пальцами и колесиком */
    let initialScale
    dragEl.addEventListener('wheel', handleWheel)
    // hammer.get('pinch').set({ enable: true })
    // const handlePinch = (ev) => {
    //   if (ev.type === 'pinchstart') {
    //     initialScale = scale.current.value
    //     svgRef.current.style.transition = 'none'
    //   }
    //   zoom(initialScale * ev.scale)
    //   if (ev.type === 'pinchend') {
    //     svgRef.current.style.transition = null
    //   }
    // }
    // hammer.on('pinchstart pinch pinchend', handlePinch)

    // const handleTap = (event) => {
    //   console.log(event);
      
    //   if (scale < 1) {
    //     event.preventDefault()
    //     const offset = getCursorOffsetToElementCenter(viewportRef.current, event.srcEvent)
    //     const dx = (x + offset.x) / scale * 2
    //     const dy = (y + offset.y) / scale * 2
    //     setScale(1)
    //     setPosition({ x, y })
    //   }

    //   const isTouch = event.pointerType === 'touch'
    //   const el = event.target
    //   const seat = svgSeat.from(el)
    //   const isMultiple = seat && seat.isMultiple()
    //   const seatCat = seat ? seat.get('category') : ''
    //   const ticketsCat = ticketsByCategory?.[seatCat] || []
      
    //   const ticket = isMultiple && ticketsCat ? ticketsCat.find(item => !item.inCart) : tickets.find(t => t.id === el.id)
    //   const { visible, ticketId } = tooltipSeat

    //   if (ticket && !el.hasAttribute('data-disabled')) {
    //     Array.from(document.querySelectorAll('#clone-1, #clone-2')).forEach(el => el.remove())
    //     if (isTouch && !isMultiple) {
    //       // Копируем текущее место для вывода копии поверх блюра
    //       const clone = [el.cloneNode()]
    //       // Если у элемента есть галочка, то копируем и ее
    //       if (el.nextElementSibling.tagName?.toLowerCase() === 'use') clone.push(el.nextElementSibling.cloneNode())
    //       const elBounds = el.getBBox()
    //       clone.forEach((el, i) => {
    //         el.id = `clone-${(i + 1)}`
    //         el.classList.add(SEAT_CLONE_CLASS)
    //         svgRef.current.appendChild(el)
    //       })
    //       setTooltipSeat({
    //         visible: true,
    //         x: elBounds.x + elBounds.width,
    //         y: elBounds.y + elBounds.height,
    //         ticketId: ticket.id,
    //         text: el.getAttribute('data-text')
    //       })
    //     } else {
    //       toggleInCart(ticket)
    //     }
    //   } else {
    //     const delay = el.matches('.seating-tooltip') || el.closest('.seating-tooltip') ? 500 : 0
    //     setTooltipSeat(prev => ({ visible: false, ticketId: prev.ticketId, delay }))
    //     document.querySelectorAll('#clone-1, #clone-2').forEach(el => el.remove())
    //   }
    // }
    // hammer.on('tap', handleTap)

    function handleClick(e) {
      console.log(e);

    }

    svgRef.current.addEventListener('click', handleClick)
    
    return () => {
      dragEl.removeEventListener('wheel', handleWheel)
      svgRef.current.removeEventListener('click', handleClick)
      // hammer.off('pinch', handlePinch)
      // hammer.off('tap', handleTap)
      // hammer.destroy()
    }
  }, [x, y, ticketsByCategory, tickets, tooltipSeat])

  const showSeatTooltip = el => {
    const elBounds = el.getBoundingClientRect()
    const seat = svgSeat(el)
    setTooltipSeat({
      visible: true,
      x: (elBounds.x + elBounds.width) * scale,
      y: (elBounds.y + elBounds.height) * scale,
      ticketId: seat.get('ticket-id'),
      text: seat.get('text')
    })
  }

  const hideSeatTooltip = () => {
    setTooltipSeat(prev => ({ visible: false, ticketId: prev.ticketId }))
  }

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
      null :
      node.setAttribute(name, value))
    Array.from(svg.children).forEach(child => node.appendChild(child))

    const { width: originalWidth, height: originalHeight } = node.getBBox()
    const { width, height } = node.getBoundingClientRect()
    const scale = width / originalWidth
    
    function handleMouseOver(e) {
      const seat = svgSeat(e.currentTarget)
      if (seat.isMultiple() || e.sourceCapabilities?.firesTouchEvents) return
      showSeatTooltip(e.currentTarget)
    }

    function handleMouseOut(e) {
      if (svgSeat(e.currentTarget).isMultiple() || e.sourceCapabilities?.firesTouchEvents) return
      hideSeatTooltip()
    }

    function handlePointerDown(e) {
      if (e.button !== 0) return
      pointerDownState.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        elementId: e.currentTarget.id,
        time: Date.now()
      }
    }

    function handlePointerUp(e) {
      const initialState = pointerDownState.current
      const el = e.target
      if (
        Math.abs(e.clientX - initialState.clientX) < 5 &&
        Math.abs(e.clientY - initialState.clientY) < 5 &&
        el.id === initialState.elementId /* &&
        Date.now() - initialState.time < 500 */
      ) {
        /* if (!tooltipSeat.visible) {
          showSeatTooltip(el)
          return
        } */
        const seat = svgSeat(el)
        const seatCat = seat ? seat.get('category') : ''
        const ticketsCat = ticketsByCategory?.[seatCat] || []
        const ticket = seat.isMultiple() && ticketsCat ? ticketsCat.find(item => !item.inCart) : tickets.find(t => t.id === el.id)
        
        if (ticket) toggleInCart(ticket)
      }
    }
    const unsubscibe = []

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
        seat.set('ticket-id', seatTicket.id)
        el.addEventListener('mouseover', handleMouseOver)
        el.addEventListener('mouseout', handleMouseOut)
        el.addEventListener('pointerdown', handlePointerDown)
        window.addEventListener('pointerup', handlePointerUp)

        unsubscibe.push(() => {
          el.removeEventListener('mouseover', handleMouseOver)
          el.removeEventListener('mouseout', handleMouseOut)
          el.removeEventListener('pointerdown', handlePointerDown)
          window.removeEventListener('pointerup', handlePointerUp)
        })
      }
    })
    return () => {
      unsubscibe.forEach(fn => fn())
    }
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

  useEffect(() => {
    const cats = svgRef.current.querySelectorAll('.svg-seat[data-category]:not([data-row]):not([data-seat])')
    const svgBound = svgRef.current.getBBox()
    const counters = Array.from(cats).map(el => {
      const seat = svgSeat(el)
      const category = seat.get('category')
      const title = seat.getTitleNode()
      const bound = title ? title.getBBox() : el.getBBox()
      const left = bound.x + bound.width / 2
      const top = bound.y + (title ? 1.1 * bound.height : (2 / 3) * bound.height)
      const value = cart[category]?.items?.length || 0
      const visible = !!cart[category] || 0
      const max = ticketsByCategory[category]?.length || 0
      return {
        category,
        left: Math.round((left / svgBound.width) * 100) + '%',
        top: Math.round((top / svgBound.height) * 100) + '%',
        max,
        value,
        visible
      }
    })
    setCounters(counters)
  }, [cart, ticketsByCategory])

  const handleChangeMultiple = (count, tickets, cat) => {
    const catInCart = tickets.filter(item => item.category === cat && item.inCart)
    const diff = count - catInCart.length

    if (diff > 0) {
      const changed = tickets.filter(item => item.category === cat && !item.inCart).slice(0, diff)
      changed.forEach(item => toggleInCart(item, 1))
    } else {
      const changed = catInCart.slice(0, -diff)
      changed.forEach(item => toggleInCart(item, 0))
    }
  }
  
  return (
    <div
      className='scheme-viewport'
      ref={viewportRef}
    >   
       {/* <div style={{ position: 'fixed', left: 0, top: 0, padding: 10, background: '#333', color: '#fff' }} id='helppanel' /> */}
       <div className='scheme-zoom'>
        <button
          className={classNames('scheme-control')}
          onClick={zoomOut}
        >
          <ZoomOut style={{ width: 17 }} />
        </button>
        <button
          className={classNames('scheme-control')}
          onClick={zoomIn}
        >
          <ZoomIn style={{ width: 17 }} />
        </button>
      </div>
      <div className='scheme-reset'>
        <button
          className={classNames('scheme-control', { 'scheme-control_hidden': /* scaleFactor */1 <= 1.2 })}
          //onClick={() => fitToViewport()}
        >
          <ResetIcon style={{ width: 23 }} />
        </button>
      </div>
      <div className='scheme-reset-categories'>
        <button
          className={classNames('scheme-control scheme-control-large', { 'scheme-control_hidden': !selectedCategory })}
          // onClick={() => {
          //   fitToViewport()
          //   resetSelectedCategory()
          // }}
          style={{ fontWeight: "400" }}
        >
          <svg width="34" height="6" viewBox="0 0 34 6" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M33 3.4C33.2209 3.4 33.4 3.22091 33.4 3C33.4 2.77909 33.2209 2.6 33 2.6L33 3.4ZM0.717155 2.71716C0.560947 2.87337 0.560947 3.12663 0.717155 3.28284L3.26274 5.82843C3.41895 5.98464 3.67222 5.98464 3.82843 5.82843C3.98464 5.67222 3.98464 5.41895 3.82843 5.26274L1.56569 3L3.82843 0.737258C3.98464 0.581048 3.98464 0.327782 3.82843 0.171573C3.67222 0.0153629 3.41895 0.0153629 3.26274 0.171573L0.717155 2.71716ZM33 2.6L1 2.6L1 3.4L33 3.4L33 2.6Z" fill="currentColor" />
          </svg>
          BACK TO<br />
          ALL CATEGORIES
        </button>
      </div>
      <div className='simple-impudent-logo'>
        <TicketLogo width="54" height="13" />
      </div>
      <div
        className='scheme-draggable'
        ref={draggableRef}
      >
        {tickets?.length > 0 && <SeatingTooltip
          {...tickets.find(ticket => ticket.id === tooltipSeat.ticketId)}
          categories={categories}
          visible={tooltipSeat.visible}
          x={tooltipSeat.x}
          y={tooltipSeat.y}
          text={tooltipSeat.text}
          hideDelay={tooltipSeat.delay ?? 1250}
          scaleFactor={/* scaleFactor */1}
          toggleInCart={toggleInCart}
        />}
        {/* {counters.map(({ category, ...counter }, i) => (
          <TicketsCounter
            key={i}
            {...counter}
            onChange={value => handleChangeMultiple(value, tickets, category)}
          />
        ))} */}
        <svg
          className='scheme-svg'
          ref={svgRef}
          style={{
            width: `100 * ${scale}%`,
            height: `100 * ${scale}%`,
            transform: `scale(${scale})`
          }}
        />
      </div>
      <output style={{ position: 'fixed', left: 0, top: 0, padding:5, backgorund:'#000', color: '#fff', maxHeight: 200, overflow:'auto', fontSize: '0.7em', padding: 10}}></output>
    </div>
  )
})

export default SeatingScheme