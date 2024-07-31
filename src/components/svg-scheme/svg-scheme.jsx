import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import cn from 'classnames'
import SvgSchemeSeatPreview from "./svg-scheme-preview"
import SvgSchemeTooltop from "./svg-scheme-tooltip"
import { CHECK_PATH_ID, SEAT_CLASS, SEAT_CLASS_ACTIVE, CATEGORY_CHECK_PATH_ID, SEAT_CLASS_SELECTED } from "../../const"
import { addDef, createCheckElement, svgSeat } from "../../utils/dom-scheme"
import { useIsMobile, useSeatEvent } from "../../utils/hooks"
import s from './svg-scheme.module.scss'

const SvgScheme = forwardRef(
  (
    {
      categories = [],
      src,
      tickets,
      cart,
      currentCategory = "all",
      tooltip = props => (<SvgSchemeSeatPreview {...props} />),
      onSeatTap,
      onSeatClick,
      onSeatOver,
      onSeatOut,
    },
    ref
  ) => {
    const outerRef = useRef(null)
    const innerRef = useRef(null)
    useImperativeHandle(ref, () => innerRef.current, [])
    const [ tooltipSeat, setTooltipSeat ] = useState()
    const isMobile = useIsMobile()

    useEffect(() => {
      const selected = innerRef.current.querySelector(`.${SEAT_CLASS_SELECTED}`)
      if (selected && tooltipSeat !== selected) {
        selected.classList.remove(SEAT_CLASS_SELECTED)
      }
      if (isMobile && tooltipSeat && !tooltipSeat.classList.contains(SEAT_CLASS_SELECTED)) {
        tooltipSeat.classList.add(SEAT_CLASS_SELECTED)
      }
    }, [tooltipSeat, isMobile])
    const [ style, setStyle ] = useState({ s: 1, x: 0, y: 0 })

    const svgEl = useMemo(() =>
      innerRef.current && innerRef.current.querySelector('svg'),
    [innerRef])

    const handleClick = useSeatEvent(({ el, seat, isMobile }) => {
      if (seat.disabled()) return false
      if (isMobile) {
        setTooltipSeat(el)
        onSeatTap?.(seat.toObject())
      } else {
        onSeatClick?.(seat.toObject())
      }
    })

    const handleMouseDown = useSeatEvent(({ seat, event, isMobile }) => {
      if (seat.disabled() || isMobile) return false
      event.preventDefault()
      event.stopPropagation()
    })

    const handleActivate = useSeatEvent(({ el, seat, event, isMobile }) => {
      if (seat.disabled()) return false
      if (!event.defaultPrevented) {
        setTooltipSeat(el)
        !isMobile && onSeatOver?.(event)
      }
    })

    const handleMouseOut = useSeatEvent(({ seat, event }) => {
      if (seat.disabled()) return false
      setTooltipSeat(null)
      onSeatOut?.(event)
    })

    const handleTouchStart = useCallback((event) => {
      setTooltipSeat(null)
    })

    // Раскраска мест в зависимости от наличия билета и выбранной категории
    useEffect(() => {
      const root = innerRef.current
      if (!root) return
      const svg = root.querySelector('svg')
      const cat = currentCategory === 'all' ? null : currentCategory
      addDef(svg, CHECK_PATH_ID, createCheckElement({ className: 'seat-check' }))
      addDef(svg, CATEGORY_CHECK_PATH_ID, createCheckElement({ d: 'M 1 3 L 4.25 6.25 L 10 0.5', className: 'category-check' }))
      console.log(tickets);
      const ticketMap = tickets.reduce((acc, { seat, row, category }) =>
        ({ ...acc, [row === '-1' || row === '0' ? category : [row, seat].join('-')]: true })
      , {})
      const cartMap = (cart || []).reduce((acc, { seat, row, category }) =>
        ({ ...acc, [row === '-1' || row === '0' ? category : [row, seat].join('-')]: true })
      , {})
      Array.from(svg.querySelectorAll(`.${SEAT_CLASS}`)).forEach(el => {
        const seat = svgSeat(el)
        const inCart = !!cartMap[seat.getKey()]
        seat.checked(inCart)
        const ticket = ticketMap[seat.getKey()]
        if (ticket && (!cat || cat === seat.get('category'))) {
          el.classList.add(SEAT_CLASS_ACTIVE)
          seat.disabled(false)
        } else {
          const isEnabled = (!cat || cat === seat.get('category')) && inCart
          seat.disabled(!isEnabled)
        }
      })
    }, [cart, currentCategory])

    const styles = useMemo(() => {
      return categories.reduce(
        (acc, cat) => {
          acc += `
        .${SEAT_CLASS}[data-category="${cat.value}"] { fill: ${cat.color}; stroke: ${cat.color}; stroke-width: 0; transition: ease-out .3s; transition-property: stroke-width, fill; }
        @media (hover: hover) {
          .${SEAT_CLASS}[data-category="${cat.value}"]:not([data-disabled]):hover { stroke-width: 2px; }
        }
        .${SEAT_CLASS}-icon-cat-${cat.value} { color: ${cat.color}; }
        .${SEAT_CLASS}-bg-cat-${cat.value} { background-color: ${cat.color}; }
      `
          return acc
        },
        `
      .${SEAT_CLASS}:not([data-disabled]) { cursor: pointer; }
      .${SEAT_CLASS}[data-disabled] { fill: #666 !important; }
    `
      )
    }, [categories])

    return (
      <div className={cn(s.scheme)} id='stage'>
        {false && !!tooltip && !!tooltipSeat && createPortal(
          <SvgSchemeTooltop for={tooltipSeat}>
            {tooltip(Object.assign({}, tooltipSeat.dataset))}
          </SvgSchemeTooltop>,
          document.body
        )}
        <style>{styles}</style>
        <div 
          ref={innerRef}
          className={s.svgContainer}
          dangerouslySetInnerHTML={{ __html: src }}
          style={{ width: `${800 * style.s}px`, height: `${696 * style.s}px`, transform: `translate3d(${style.x}px, ${style.y}px, 0)` }}
          /* onClick={handleClick}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleActivate}
          onMouseDown={handleMouseDown}
          onMouseOver={handleActivate}
          onMouseOut={handleMouseOut} */
        />
      </div>
    )
  }
)

export default SvgScheme