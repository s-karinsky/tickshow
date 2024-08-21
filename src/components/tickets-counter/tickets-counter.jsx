import { useEffect, useState } from 'react'
import cn from 'classnames'
import { useTransformContext } from 'react-zoom-pan-pinch'
import InputNumber from '../input-number/input-number'
import { svgSeat } from '../../utils/dom-scheme'
import './tickets-counter.scss'

export default function TicketsCounter({ category, left, top, visible, value, max, onChange }) {
  const context = useTransformContext()
  const scale = context.transformState.scale

  return (
    <div
      className={cn('svg-counter', { visible })}
      style={{ left, top, pointerEvents: 'all', /* transform: `scale(1 / ${scale})` */ }}
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <InputNumber
        value={value}
        min={0}
        max={max}
        onChange={onChange}
      />
    </div>
  )
}