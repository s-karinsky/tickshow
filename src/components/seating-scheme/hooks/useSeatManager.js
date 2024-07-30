import { SEAT_CLASS } from "const";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScalable } from "./useScalable";

const xmlType = "http://www.w3.org/2000/svg"

function createSvgElement(tag, attributes) {
  const el = document.createElementNS(xmlType, tag)
  for (const key in attributes) {
    el.setAttribute(key, attributes[key])
  }
  return el
}

function stringToSvg(str) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'image/svg+xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`Message: ${error.innerText}, Details: ${doc.querySelector('sourcetext').innerText}`)
  }
  return doc.querySelector('svg')
}

function createDefs(svg, ...elemsConfig) {
  let defs = svg.querySelector('defs')
  if (!defs) {
    defs = createSvgElement('defs', {})
    svg.insertBefore(defs, svg.firstElementChild)
  }
  elemsConfig.forEach(([ tag, attrs ]) => {
    const el = createSvgElement(tag, attrs)
    defs.appendChild(el)
  })
}

function createStyles(svg, categories) {
  const styles = createSvgElement('style')
  styles.innerHTML = categories.reduce(
    (acc, cat) => {
      acc += `
        .${SEAT_CLASS}[data-category="${cat.value}"] { fill: ${cat.color}; stroke: ${cat.color}; stroke-width: 0; transition: ease-out .3s; transition-property: stroke-width, fill; }
        @media (hover: hover) {
          .${SEAT_CLASS}[data-category="${cat.value}"]:not([data-disabled]):hover { stroke-width: 2px; }
        }
        .${SEAT_CLASS}-icon-cat-${cat.value} { color: ${cat.color}; }
        .${SEAT_CLASS}-bg-cat-${cat.value} { background-color: ${cat.color}; }
      `
      return acc
    },
    `
      .${SEAT_CLASS}:not([data-disabled]) { cursor: pointer; }
      .${SEAT_CLASS}[data-disabled] { fill: #666 !important; }
    `
  )
  svg.insertBefore(styles, svg.firstElementChild)
}

export function useSeatManager(src, categories) {
  const [ zoomRef, scaleState ] = useScalable()
  const [ node, setNode ] = useState(null)

  const ref = useCallback((newNode) => {
    setNode(newNode)
  }, [])

  useEffect(() => {
    if (!node || !src) return
    const svg = stringToSvg(src)
    // Черная галочка для мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1.5 3.5 L 3 5 L 6 2', className: 'seat-check' }])
    // Белая галочка для категории без мест
    createDefs(svg, ['path', { x: 0, y: 0, d: 'M 1 3 L 4.25 6.25 L 10 0.5', className: 'category-check' }])
    createStyles(svg, categories)

    if (node.hasChildNodes()) node.innerHTML = ''
    Array.from(svg.attributes).forEach(({ name, value }) => node.setAttribute(name, value))
    const viewBox = svg.getAttribute('viewBox')
    node.setAttribute('viewBox', viewBox)
    Array.from(svg.children).forEach(child => node.appendChild(child))
    zoomRef(node)
  }, [node, src])

  return [ref, scaleState]
}