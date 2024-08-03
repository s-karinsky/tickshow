import { useEffect, useRef, useState } from 'react'
import { cn } from '@bem-react/classname'
import Button from 'components/button'
import { toHaveAttribute } from '@testing-library/jest-dom/dist/matchers'
import { CURRENCY_SYMBOL_MAP } from 'const'
import { ReactComponent as Selected } from 'icons/selected.svg'
import './seating-tooltip.scss'

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
  console.log(props);
  const cat = props.categories.find((c) => c.value === props.category);
  const svg = props.icon || cat?.icon;
  const color = props.color || cat?.color || "#fff";
  console.log(color);
  
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
      <button
        className={bem('button', { selected: props.inCart })}
        style={{
          backgroundColor: props.inCart ? color : undefined,
          borderColor: props.inCart ? color : undefined
        }}
      >
        {props.inCart ? <><Selected style={{ width: 12 }} /> Selected</> : 'Click to select'}
      </button>
    </div>
  )
}