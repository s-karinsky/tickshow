import { SEAT_CLASS } from "const"

const xmlType = "http://www.w3.org/2000/svg"

export function createSvgElement(tag, attributes) {
  const el = document.createElementNS(xmlType, tag)
  for (const key in attributes) {
    el.setAttribute(key, attributes[key])
  }
  return el
}

export function stringToSvg(str) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(str, 'image/svg+xml')
  const error = doc.querySelector('parsererror')
  if (error) {
    throw new Error(`Message: ${error.innerText}, Details: ${doc.querySelector('sourcetext').innerText}`)
  }
  return doc.querySelector('svg')
}

export function createDefs(svg, ...elemsConfig) {
  let defs = svg.querySelector('defs')
  if (!defs) {
    defs = createSvgElement('defs', {})
    svg.insertBefore(defs, svg.firstElementChild)
  }
  elemsConfig.forEach(([tag, attrs]) => {
    const el = createSvgElement(tag, attrs)
    defs.appendChild(el)
  })
}

export function createStyles(svg, categories) {
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

export const msToTime = ms => {
  const fullSeconds = Math.round(ms / 1000)
  const minutes = Math.floor(fullSeconds / 60)
  const seconds = fullSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}