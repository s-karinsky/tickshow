import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import classNames from 'classnames'
import { KeepScale, TransformComponent, TransformWrapper, useTransformComponent } from 'react-zoom-pan-pinch'
import { useDimensions } from 'utils/hooks'
import SeatingTooltip from 'components/seating-tooltip'
import Button from 'components/button'
import { svgSeat } from 'utils/dom-scheme'
import { createDefs, createStyles, getCursorOffsetToElementCenter, stringToSvg } from './utils'
import './seating-scheme.scss'
import { SEAT_CLONE_CLASS } from 'const'
import TicketsCounter from 'components/tickets-counter/tickets-counter'
import Controls from './controls'
import SvgScheme from './svg'

const SeatingScheme = forwardRef((props, ref) => {
  const [counters, setCounters] = useState([])
  const { src, cart, categories, tickets, toggleInCart, highlight, selectedCategory, resetSelectedCategory } = props
  const [ tooltipSeat, setTooltipSeat ] = useState({ visible: false })
  
  return (
      <TransformWrapper
        minScale={1}
        maxScale={4}
        doubleClick={{
          disabled: true
        }}
        onClick={e => console.log(e)}
      >
        <SvgScheme
          src={src}
          cart={cart}
          categories={categories}
          counters={counters}
          highlight={highlight}
          tickets={tickets}
          tooltipSeat={tooltipSeat}
          setTooltipSeat={setTooltipSeat}
          setCounters={setCounters}
          toggleInCart={toggleInCart}
        />
        <Controls
          selectedCategory={selectedCategory}
          resetCategory={resetSelectedCategory}
        />
      </TransformWrapper>
  )
})

export default SeatingScheme