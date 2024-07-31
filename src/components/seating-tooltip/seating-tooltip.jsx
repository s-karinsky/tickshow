import { useEffect, useRef, useState } from 'react'
import { cn } from '@bem-react/classname'
import Button from 'components/button'
import './seating-tooltip.scss'
import { toHaveAttribute } from '@testing-library/jest-dom/dist/matchers'
import { CURRENCY_SYMBOL_MAP } from 'const'

const bem = cn('seating-tooltip')

export default function SeatingTooltip(props) {
  const [ visible, setVisible ] = useState(props.visible)
  let timer = useRef(null)

  useEffect(() => {
    if (props.hideDelay) {
      if (!props.visible) {
        timer.current = setTimeout(() => setVisible(false), props.hideDelay)
      } else if (timer.current) {
        clearTimeout(timer.current)
        setVisible(true)
      }
    }
  }, [props.visible])

  if (props.scaleFactor && props.scaleFactor < 1) {
    return null
  }

  const cat = props.categories.find((c) => c.value === props.category);
  const svg = props.icon || cat?.icon;
  const color = props.color || cat?.color || "#fff";

  return (
    <div className={bem({ visible })} style={{ left: props.x * props.scaleFactor, top: props.y * props.scaleFactor }}>
      <div className={bem('head')}>
        <div className={bem('price')}>
          {props?.price || '-'}&nbsp;{CURRENCY_SYMBOL_MAP[props?.currency] || ''}
        </div>
        {!!svg && <div
          className={bem('icon')}
          style={{ color }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />}
      </div>
      <div className={bem('desc')} style={{ color }}>
        <div className={bem('category')}>{cat?.name || props.category}</div>
        {!!props.text && <div className={bem('text')}>{props.text}</div>}
      </div>
      <div className={bem('seat')}>
        <div className={bem('row')}>
          <span>Row:</span> {props.row}
        </div>
        <div className={bem('num')}>
          <span>Seat:</span> {props.seat}
        </div>
      </div>
      <Button className={bem('button')} color='ghost' size='medium'>
        Click to select
      </Button>
    </div>
  )
}