import { CHECK_PATH_ID } from "../app"
import { isEqualStr } from "./string"

const xmlType = "http://www.w3.org/2000/svg"

export const createCheckElement = ({ x = 0, y = 0 } = {}) => {
  const check = document.createElementNS(xmlType, 'path')
  check.setAttribute('d', 'M5.3023 0.656738C5.39993 0.754369 5.39993 0.91266 5.3023 1.01029L2.5591 3.7535C2.46209 3.85051 2.30502 3.85121 2.20714 3.75508L0.660761 2.23631C0.562254 2.13957 0.560828 1.98128 0.657576 1.88277L0.832753 1.70441C0.9295 1.60591 1.08778 1.60448 1.18629 1.70123L2.37915 2.87278L4.77197 0.479962C4.8696 0.382331 5.02789 0.38233 5.12553 0.479962L5.3023 0.656738Z')
  check.setAttribute('style', 'pointer-events: none;')
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

// Функция для упрощения работы с местом. Принимает dom-элемент места (path)
// и отдает набор методов для работы с ним
export const svgSeat = (el, details = {}) => {
  const { x, y } = el.getBBox()
  const seat = {
    // Получение значения атрибута data-${attribute}
    get: (attribute, defaultValue) =>Array.isArray(attribute) ?
      attribute.map(attr => seat.get(attr, defaultValue)) :
      el?.getAttribute(`data-${attribute}`) || defaultValue,
    // Изменение значения атрибута data-${attribute}
    set: (attribute, value) => el?.setAttribute(`data-${attribute}`, value) || seat,
    // Проверка наличия галочки у места (выводится если билет в корзине)
    hasCheck: () => {
      const next = el.nextElementSibling
      return !!next && isEqualStr(next.tagName, 'use') && next.getAttribute('href') === `#${CHECK_PATH_ID}`
    },
    // Добавить галочку, если ее нет
    addCheck: () => {
      if (seat.hasCheck()) return
      insertAfter(el, createUse({ x: x + 2, y: y + 3, href: `#${CHECK_PATH_ID}`, class: 'seat-check' }))
      return seat
    },
    // Удалить галочку, если она есть
    removeCheck: () => {
      if (!seat.hasCheck()) return
      const check = el.nextElementSibling
      el.parentNode.removeChild(check)
      return seat
    },
    // Переключить галочку
    toggleChecked: () => {
      seat.hasCheck() ? seat.removeCheck() : seat.addCheck()
      return seat
    },
    // Вызов без аргументов вернет значение галочки
    // Вызов с аргументом установит галочку в соответствии с этим значением
    checked: val => {
      if (val === undefined || val === null) return seat.hasCheck()
      val ? seat.addCheck() : seat.removeCheck()
      return seat
    },
    // Проверка множественности места (танцпол - множественное место)
    isMultiple: () => !seat.get('seat') && !seat.get('row'),
    // Получить уникалный ключ места
    getKey: () => seat.isMultiple() ? seat.get('category') : seat.get(['row', 'seat']).join('-'),
    // Проверка на соответствие объекту. Например, чтобы проверить соответствие ряду A и месту 2
    // вызывается svgSeat(el).matches({ row: 'A', seat: 2 })
    matches: obj => Object.entries(obj).reduce((acc, [key, value]) => acc && isEqualStr(seat.get(key), value), true),
    findMatches: (seats) => seats.find(s => seat.matches(s)),
    isEqual: item => {
      const cat = item.section || item.category
      if (seat.isMultiple()) {
        return seat.get('category') === cat
      }
      return seat.get('category') === cat && seat.get(['row', 'seat']).join('-') === [item.row, item.seat].join('-')
    }
  }

  return seat
}