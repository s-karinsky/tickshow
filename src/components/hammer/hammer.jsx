import React, { useEffect, useRef } from 'react'
import Hammer, { Press } from 'hammerjs'

const handlerToEvent = {
  onPan: 'pan',
  onPanStart: 'panstart',
  onPanMove: 'panmove',
  onPanEnd: 'panend',
  onPanCancel: 'pancancel',
  onPanLeft: 'panleft',
  onPanRight: 'panright',
  onPanUp: 'panup',
  onPanDown: 'pandown',
  onPinch: 'pinch',
  onPinchStart: 'pinchstart',
  onPinchMove: 'pinchmove',
  onPinchEnd: 'pinchend',
  onPinchCancel: 'pinchcancel',
  onPinchIn: 'pinchin',
  onPinchOut: 'pinchout',
  onPress: 'press',
  onPressUp: 'pressup',
  onRotate: 'rotate',
  onRotateStart: 'rotatestart',
  onRotateMove: 'rotatemove',
  onRotateEnd: 'rotateend',
  onRotateCancel: 'rotatecancel',
  onSwipe: 'swipe',
  onSwipeLeft: 'swipeleft',
  onSwipeRight: 'swiperight',
  onSwipeUp: 'swipeup',
  onSwipeDown: 'swipedown',
  onTop: 'top',
}

const HammerComponent = ({
  as = 'div',
  children,
  direction,
  ...rest
}) => {
  const elementRef = useRef(null)
  const handlerByEvent = Object.keys(rest).reduce((acc, key) =>
  !handlerToEvent[key] ? acc : ({
    ...acc,
    [handlerToEvent[key]]: rest[key],
  }))
  const handlers = Object.values(handlerByEvent)
  
  useEffect(() => {
    const hammer = new Hammer(elementRef.current)

    if (onPan) {
      hammer.on('pan', onPan)
    }
    if (onPinch) {
      hammer.get('pinch').set({ enable: true })
      hammer.on('pinch', onPinch)
    }
    if (onTap) {
      hammer.on('tap', onTap)
    }

    return () => {
      hammer.off('pan', onPan)
      hammer.off('pinch', onPinch)
      hammer.off('tap', onTap)
      hammer.destroy()
    }
  }, [onPan, onPinch, onTap])

  return <div ref={elementRef}>{children}</div>
}

export default HammerComponent