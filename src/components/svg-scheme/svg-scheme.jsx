import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import cn from 'classnames'
import { CHECK_PATH_ID, SEAT_CLASS, SEAT_CLASS_ACTIVE } from "../../const"
import { addDef, createCheckElement, svgSeat } from "../../utils/dom-scheme"
import { useIsMobile } from "../../utils/hooks"
import s from './svg-scheme.module.scss'
import SvgSchemeTooltop from "./svg-scheme-tooltip"

const SvgScheme = forwardRef(
  (
    {
      categories = [],
      seatSelector = `.${SEAT_CLASS}`,
      src,
      tickets,
      cart,
      currentCategory = "all",
      tooltip,
      onSeatClick,
      onSeatOver,
      onSeatOut,
    },
    ref
  ) => {
    const innerRef = useRef(null)
    useImperativeHandle(ref, () => innerRef.current, [])
    const [ tooltipSeat, setTooltipSeat ] = useState()
    const mobile = useIsMobile()

    const checkTarget = (cb, customCondition) => e => {
      if (!e.target.matches(seatSelector)) return
      const seat = svgSeat(e.target)
      if (customCondition !== undefined && (!customCondition?.(seat, e) && !customCondition)) return
      cb(seat, e)
    }

    const handleClick = useCallback(
      checkTarget(
        (seat) => onSeatClick(seat.toObject()),
        (seat) => !!onSeatClick && !seat.disabled()
      ),
      [onSeatClick]
    )

    const handleMouseOver = useCallback(
      checkTarget((seat, e) => {
        if (tooltip) setTooltipSeat(e.target)
        onSeatOver && onSeatOver(e)
      }),
      [onSeatOver, tooltip]
    )

    const mobileOnlick = useCallback(
      checkTarget((seat, e) => {
        if (tooltip) setTooltipSeat(e.target)
        onSeatOut && onSeatOut(e)
      })
      [onSeatOut, tooltip]
    )

    const handleMouseOut = useCallback(
      checkTarget((seat, e) => {
        if (tooltip) setTooltipSeat(null)
        onSeatOut && onSeatOut(e)
      }),
      [onSeatOut, tooltip]
    )

    // Раскраска мест в зависимости от наличия билета и выбранной категории
    useEffect(() => {
      const root = innerRef.current
      if (!root) return
      const cat = currentCategory === 'all' ? null : currentCategory
      addDef(root, CHECK_PATH_ID, createCheckElement())
      const ticketMap = tickets.reduce((acc, { seat, row, section }) =>
        ({ ...acc, [row === '-1' ? section : [row, seat].join('-')]: true })
      , {})
      const cartMap = (cart || []).reduce((acc, { seat, row, section }) =>
        ({ ...acc, [row === '-1' ? section : [row, seat].join('-')]: true })
      , {})
      Array.from(root.querySelectorAll(`.${SEAT_CLASS}`)).forEach(el => {
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
        .${SEAT_CLASS}[data-category="${cat.value}"] { fill: ${cat.color}; stroke: ${cat.color}; stroke-width: 0; transition: ease-out .3s stroke-width; }
        .${SEAT_CLASS}[data-category="${cat.value}"]:not([data-disabled]):hover { stroke-width: 2px; }
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
    const eventHandlers = !mobile ? {
      onClick: handleClick,
      onMouseOver: handleMouseOver,
      onMouseOut: handleMouseOut
    } : {
      onClick: mobileOnlick
    }

    return (
      <div className={cn(s.scheme)} id='stage'>
        {!!tooltip && !!tooltipSeat && createPortal(
          <SvgSchemeTooltop for={tooltipSeat} handleClick={mobile ? handleClick : null}>
            {tooltip(Object.assign({}, tooltipSeat.dataset))}
          </SvgSchemeTooltop>,
          document.body
        )}
        <style>{styles}</style>
        <div
          ref={innerRef}
          className={s.svgContainer}
          dangerouslySetInnerHTML={{ __html: src }}
          {...eventHandlers}
        />
      </div>
    )
  }
)

export default SvgScheme