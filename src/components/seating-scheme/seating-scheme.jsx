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

  const svgRef = useRef(null)

  const scale = useRef({ value: 1, initialWidth: 0, initialHeight: 0 })
  const pos = useRef({ x: 0, y: 0 })
  const [scaleFactor, setScaleFactor] = useState(1)
  
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
      <TransformWrapper
        minScale={1}
        maxScale={4}
      >
          <TransformComponent>
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
          </TransformComponent>
          {tickets?.length > 0 && <SeatingTooltip
            {...tickets.find(ticket => ticket.id === tooltipSeat.ticketId)}
            categories={categories}
            visible={tooltipSeat.visible}
            x={tooltipSeat.x}
            y={tooltipSeat.y}
            text={tooltipSeat.text}
            hideDelay={tooltipSeat.delay ?? 500}
            scaleFactor={scaleFactor}
            toggleInCart={toggleInCart}
          />}
          {counters.map(({ category, ...counter }, i) => (
            <TicketsCounter
              key={i}
              {...counter}
              onChange={value => handleChangeMultiple(value, tickets, category)}
            />
          ))}
          <Controls
            selectedCategory={selectedCategory}
            resetCategory={resetSelectedCategory}
          />
      </TransformWrapper>
  )
})

export default SeatingScheme