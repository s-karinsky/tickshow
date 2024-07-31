import { useEffect, useState } from 'react'
import cn from 'classnames'
import InputNumber from '../input-number/input-number'
import { svgSeat } from '../../utils/dom-scheme'

export default function TicketsCounter({ value, name, count, onChange }) {
  const [pos, setPos] = useState(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const seat = svgSeat.from({ category: name })
    if (!seat) return
    const title = seat.getTitleNode()
    const rect = title ? title.getBoundingClientRect() : {} 
    setPos({ left: rect.x + rect.width / 2, top: rect.y })
  }, [name])


  return (
    <div
      className={cn('svg-counter', {
        visible: value > 0,
      })}
      style={pos}
      onMouseDown={e => e.stopPropagation()}
      onMouseUp={e => e.stopPropagation()}
      onClick={e => e.stopPropagation()}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          tramsformOrigin: 'center',
          marginLeft: -40
        }}
      >
        <InputNumber
          value={value}
          min={0}
          max={count}
          onChange={num => onChange({ category: name, row: '-1' }, num)}
        />
      </div>
    </div>
  )
}