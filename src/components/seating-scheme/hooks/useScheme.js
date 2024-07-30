import { useCallback, useEffect, useState } from 'react'
import { useDimensions } from './useDismensions'
import { useDraggable } from './useDraggable'
import { useSeatManager } from './useSeatManager'

export default function useScheme(src, categories) {
  //const [dragBound, setDragBound] = useState(null)

  const [viewportRef, viewport] = useDimensions()
  const [targetRef, dragState, resetState] = useDraggable()
  const [scaleRef, scaleState] = useSeatManager(src, categories)

  /* const { width, height } = scaleState
  const { x, y } = dragState
  const { width: vw, height: vh, left: vleft, top: vtop } = viewport
  useEffect(() => {
    console.log('smth changes');
  }, [width, height, x, y, vw, vh, vleft, vtop]) */

  return {
    refs: {
      viewport: viewportRef,
      draggable: targetRef,
      scheme: scaleRef
    },
  }
}