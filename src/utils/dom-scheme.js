import { CHECK_PATH_ID } from "../app"
import { isEqualStr } from "./string"

const xmlType = "http://www.w3.org/2000/svg"

export const createCheckElement = ({ x = 0, y = 0 } = {}) => {
  const check = document.createElementNS(xmlType, 'path')
  check.setAttribute('d', 'M5.3023 0.656738C5.39993 0.754369 5.39993 0.91266 5.3023 1.01029L2.5591 3.7535C2.46209 3.85051 2.30502 3.85121 2.20714 3.75508L0.660761 2.23631C0.562254 2.13957 0.560828 1.98128 0.657576 1.88277L0.832753 1.70441C0.9295 1.60591 1.08778 1.60448 1.18629 1.70123L2.37915 2.87278L4.77197 0.479962C4.8696 0.382331 5.02789 0.38233 5.12553 0.479962L5.3023 0.656738Z')
  check.setAttribute('fill', '#323232')
  check.setAttribute('stroke', '#323232')
  check.setAttribute('style', 'pointer-events:none;')
  if (x || y) {
    check.setAttribute('style', `transform: translate(${(x || 0)}px, ${(y || 0)}px)`)
  }
  return check
}

export const createUse = (attrs) => {
  const el = document.createElementNS(xmlType, 'use')
  Object.entries(attrs).forEach(([ attr, val ]) => {
    el.setAttribute(attr, val)
  })
  return el
}

export const addDef = (root, id, el) => {
  if (root.querySelector(`#${id}`)) {
    return
  }
  let defs = root.querySelector('defs')
  if (!defs) {
    defs = document.createElementNS(xmlType, 'defs')
    root.insertBefore(defs, root.firstElementChild)
  }
  el.setAttribute('id', id)
  defs.appendChild(el)
  return defs
}

export const insertAfter = (el, insertEl) => {
  const parent = el?.parentNode
  if (!parent) return
  const next = el?.nextElementSibling
  return next ?
    parent.insertBefore(insertEl, next) :
    parent.appendChild(insertEl)
}

export const svgSeat = el => {
  const { x, y } = el.getBBox()
  const seat = {
    get: (attribute, defaultValue) =>Array.isArray(attribute) ?
      attribute.map(attr => seat.get(attr, defaultValue)) :
      el?.getAttribute(`data-${attribute}`) || defaultValue,
    set: (attribute, value) => el?.setAttribute(`data-${attribute}`, value) || seat,
    hasCheck: () => {
      const next = el.nextElementSibling
      return !!next && isEqualStr(next.tagName, 'use') && next.getAttribute('href') === `#${CHECK_PATH_ID}`
    },
    addCheck: () => {
      if (seat.hasCheck()) return
      insertAfter(el, createUse({ x: x + 2, y: y + 3, href: `#${CHECK_PATH_ID}`, class: 'seat-check' }))
      return seat
    },
    removeCheck: () => {
      if (!seat.hasCheck()) return
      const check = el.nextElementSibling
      el.parentNode.removeChild(check)
      return seat
    },
    toggleChecked: () => {
      seat.hasCheck() ? seat.removeCheck() : seat.addCheck()
      return seat
    },
    checked: val => {
      if (val === undefined || val === null) return seat.hasCheck()
      val ? seat.addCheck() : seat.removeCheck()
      return seat
    },
    isMultiple: () => !!seat.get('seat') && !!seat.get('row'),
    getKey: () => seat.isMultiple() ? seat.get(['row', 'seat']).join('-') : seat.get('category'),
    matches: obj => Object.entries(obj).reduce((acc, [key, value]) => acc && isEqualStr(seat.get(key), value), true)
  }

  return seat
}