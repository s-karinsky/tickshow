import { useEffect, useMemo, useRef, useState } from 'react'
import cn from 'classnames'
import s from './svg-scheme.module.scss'
import { svgSeat } from '../../utils/dom-scheme'
import { SEAT_CLASS } from '../../const'

export default function SvgSchemeTooltop({ for: el, className, children, withOverlay }) {
  const [styles, setStyles] = useState()
  const ref = useRef(null)

  useEffect(() => {
    const seat = svgSeat(el)
    if (!seat.isMultiple() && !seat.disabled()) {
      const tooltip = ref.current
      const { x, y, width, height } = el.getBoundingClientRect()
      const left = Math.max(x + width - tooltip.offsetWidth, 5)
      let top = y + height
      if (top + tooltip.offsetHeight > window.innerHeight) {
        top -= (tooltip.offsetHeight + height)
      }
      setStyles({ position: 'fixed', left: `${left}px`, top: `${top}px`, opacity: 1 })
    }
  }, [el])

  const box = useMemo(() => el.getBoundingClientRect(), [el])

  return (
    <div
      className={cn(s.svgSchemeTooltip, { [className]: !!className })}
      style={styles}
      ref={ref}
    >
      {children}
    </div>
  )
}