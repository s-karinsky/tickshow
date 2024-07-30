import { forwardRef, useEffect, useMemo, useRef, useState } from 'react'
import useScheme from 'components/seating-scheme/hooks/useScheme'
import './seating-scheme.scss'

const SeatingScheme = forwardRef((props, ref) => {
  const { src, categories, tickets, cart } = props
  const { refs } = useScheme(src, categories)
 
  return (
    <div
      className='scheme-viewport'
      ref={refs.viewport}
    >
      <div
        className='scheme-draggable'
        ref={refs.draggable}
      >
        <svg
          className='scheme-svg'
          xmlns='http://www.w3.org/2000/svg'
          ref={refs.scheme}
        />
      </div>
    </div>
  )
})

export default SeatingScheme