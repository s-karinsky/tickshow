import { Outlet, useParams } from "react-router-dom";
import { useQueries, useQuery } from "@tanstack/react-query";
import cn from "classnames"
import { groupBy } from "utils";
import { getCartQuery, useCart } from "api/cart";
import { getEventQuery } from "api/event";
import { useUser } from "api/user";
import { getTicketsQuery } from "api/tickets";
import { getConfigQuery } from "api/config";
import './loader.scss'

const combineQueries = (results) => {
  if (results.every(item => item.status === 'success')) {
    const [ config, respCart, respEvent, respTickets ] = results.map(item => item.data)
    const tickets = [...respTickets, ...respCart]
    const ticketsMap = groupBy(tickets, 'category')
    const priceList = tickets.map(item => Number(item.price)).filter(Boolean)
    const categories = [{
      value: null,
      label: 'All categories',
      ticketsCount: tickets.length,
      price: [Math.min(...priceList), Math.max(...priceList)] 
    }].concat((respEvent.categories || []).map(category => {
      const t = ticketsMap[category.value]
      const ticketsCount = t?.length
      const price = ticketsCount ? t[0]?.price : ''

      return {
        ...category,
        ticketsCount,
        price
      }
    }))
    return {
      categories,
      config,
      loaded: true
    }
  }
  
  return {
    loaded: false
  }
}

export default function Loader() {
  const { id } = useParams()
  const { data: authorized } = useUser()
  
  const { loaded, ...data } = useQueries({
    queries: [
      getConfigQuery({ enabled: authorized }),
      getCartQuery({ enabled: authorized }),
      getEventQuery(id, { enabled: authorized }),
      getTicketsQuery(id, { enabled: authorized })
    ],
    combine: combineQueries
  })
  const loadedAll = authorized && loaded
  
  return (
    <>
      <div
        className={cn("loading-screen", {
          'loading-screen_hidden': loadedAll
        })}
      >
        <div className="loader-wrapper-bg">
          <div className="loader-wrapper">
            <div className="loader">
              <div className="loader loader-inner"></div>
            </div>
          </div>
        </div>
      </div>
      {loadedAll && <div className='loader-content'>
        <Outlet context={data} />
      </div>}
    </>
  )
}