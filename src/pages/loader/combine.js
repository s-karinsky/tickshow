import event from "pages/event"
import { isEqualSeats } from "utils"

const combineQueries = (results) => {
  if (results.every(item => item.status === 'success')) {
    const [config, respEvent, tickets] = results.map(item => item.data)
    const refetch = () => Promise.all(results.map(item => item.refetch()))
    const priceList = tickets.map(item => item.price).filter(Boolean)
    const { categories: eventCats = [], schemeCode: scheme, ...event } = respEvent
    const bookingLimit = tickets.reduce((limit, ticket) => ticket.bookingLimit > Date.now() ? Math.max(limit, ticket.bookingLimit) : limit, 0)
    const bookingExpired = tickets.filter(ticket => ticket.bookingLimit !== null && ticket.bookingLimit < Date.now())
    const ticketsMap = tickets.reduce((map, { category, price, ...ticket }) => ({
      ...map,
      [category]: {
        count: (map[category]?.count || 0) + 1,
        price: (map[category]?.price || new Set()).add(price),
      }
    }), {})

    const cart = tickets.filter(ticket => ticket.inCart)
    const cartByCategory = cart.reduce((map, { category, price, ...ticket }) => console.log(ticket.row) ||
     ({
        ...map,
        [category]: {
          items: (map[category]?.items || []).concat({ category, price, ...ticket }),
          sum: (map[category]?.sum || 0) + price,
          data: map[category]?.data || eventCats.find(cat => cat.value === category),
          isMulitple: map[category]?.isMultiple || ['0', '-1'].includes(ticket.row)
        }
      }), {})

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
      bookingExpired,
      bookingLimit,
      cartByCategory,
      cart,
      categories,
      config,
      event,
      scheme,
      tickets,
      refetch,
      loaded: true
    }
  }

  return {
    loaded: false
  }
}

export default combineQueries