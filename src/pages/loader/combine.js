import event from "pages/event"
import { isEqualSeats } from "utils"

const combineQueries = (results) => {
  if (results.every(item => item.status === 'success')) {
    const [config, respCart, respEvent, respTickets] = results.map(item => item.data)
    const cartExpired = []
    const cart = []
    let bookingLimit = 0
    const tickets = respTickets.map(item => {
      const inCart = respCart.find(cartItem => isEqualSeats(cartItem, item))
      if (inCart) {
        // Время окончания брони приходит с сервера с отставанием на час,
        // пока так компенсируем
        item.bookingLimit = typeof inCart.booking_limit === 'number' ?
          inCart.booking_limit : new Date(inCart.booking_limit).getTime() + 60 * 60 * 1000
        
        if (item.bookingLimit < Date.now()) {
          cartExpired.push(item)
        } else {
          item.inCart = !!inCart
          cart.push(item)
          bookingLimit = item.bookingLimit
        }
      }
      return item
    })
    const ticketsMap = tickets.reduce((map, { category, price }) => ({
      ...map,
      [category]: {
        count: (map[category]?.count || 0) + 1,
        price: (map[category]?.price || new Set()).add(price)
      }
    }), {})
    
    const priceList = tickets.map(item => item.price).filter(Boolean)
    const { categories: eventCats = [], schemeCode: scheme, ...event } = respEvent

    const categories = [{
      value: null,
      label: 'All categories',
      count: tickets.length,
      price: [Math.min(...priceList), Math.max(...priceList)]
    }].concat(
      eventCats.map(category => {
        const t = ticketsMap[category.value]
        if (!t) return category
        t.price = t.price.size > 1 ?
          [Math.min(...t.price), Math.max(...t.price)] :
          [...t.price][0]
        return { ...category, ...t }
      }))

    return {
      cart,
      cartExpired,
      bookingLimit,
      categories,
      config,
      event,
      scheme,
      tickets,
      loaded: true
    }
  }

  return {
    loaded: false
  }
}

export default combineQueries