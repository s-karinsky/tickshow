import { useEffect } from "react"
import { Link, Outlet, useLocation, useParams, useSearchParams } from "react-router-dom"
import { useQueries } from "@tanstack/react-query"
import cn from "classnames"
import { useUser } from "api/user"
import { getCartQuery } from "api/cart"
import { getEventQuery } from "api/event"
import { getTicketsQuery } from "api/tickets"
import { getConfigQuery } from "api/config"
import combineQueries from "./combine"
import { ReactComponent as TicketLogo } from 'icons/ticket_logo.svg'
import Button from "components/button"
import './loader.scss'
import { useEventId } from "utils/hooks"
import NotFound from "pages/not-found"
import { ClearSeats } from "api/cart"

export default function Loader() {
  const routeParams = useParams()
  const [ searchParams ] = useSearchParams()
  const id = useEventId()
  const showScheme = searchParams.get('scheme') !== null
  const { data: authorized } = useUser()
  const location = useLocation()
  
  const enabled = authorized && !!id
  const data = useQueries({
    queries: [
      getConfigQuery({ enabled }),
      getEventQuery(id, { enabled }),
      getTicketsQuery(id, { enabled })
    ],
    combine: combineQueries
  })
  const { loaded, errors, ...resp } = data
  const search = location.search.replace(/&?scheme/, '')

  useEffect(() => {
    if (!resp.cart) return
    const items = resp.cart.reduce((acc, item) => ({
      ...acc,
      [item.t_id]: (acc[item.t_id] || []).concat([item.hall_id, item.category, item.row, item.seat].join(';'))
    }), {})
    console.log(items);
    const onLeave = function () {
      
      if (document.visibilityState == 'hidden') {
        ClearSeats(items)
      }
    }

    window.addEventListener('load', onLeave)
    return () => window.removeEventListener('load', onLeave)
  }, [resp.cart])

  useEffect(() => {
    const body = document.body
    if (searchParams.get('scheme') === null) {
      body.style = {}
    } else {
      body.style.overscrollBehavior = 'auto'
      body.style.overflow = 'none'
      body.style.height = '100dvh'
      body.style.maxHeight = '100dvh'
    }
  }, [searchParams.get('scheme')])
  
  if (errors?.length > 0) {
    return <NotFound />
  }
  
  return (
    <>
      {/* <div
        className={cn("loading-screen", {
          'loading-screen_hidden': loaded
        })}
      >
        <div className="loader-wrapper-bg">
          <div className="loader-wrapper">
            <div className="loader">
              <div className="loader loader-inner"></div>
            </div>
          </div>
        </div>
      </div> */}
      <div className={cn('mobile-close', { 'mobile-close_visible': showScheme })}>
        <Link to={{ search }}>
          <svg className='icon-arrow' width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M6.74372 0.251051C7.08543 0.585786 7.08543 1.1285 6.74372 1.46323L2.11244 6L6.74372 10.5368C7.08543 10.8715 7.08543 11.4142 6.74372 11.7489C6.40201 12.0837 5.84799 12.0837 5.50628 11.7489L0.256282 6.60609C-0.0854272 6.27136 -0.0854272 5.72864 0.256282 5.39391L5.50628 0.251051C5.84799 -0.0836838 6.40201 -0.0836838 6.74372 0.251051Z" fill="#F8F5EC" />
          </svg>
          Back to the concert page
        </Link>
        <Link to={{ search }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10.5368 0.251051C10.8715 -0.0836838 11.4142 -0.0836838 11.7489 0.251051C12.0837 0.585786 12.0837 1.1285 11.7489 1.46323L7.21218 6L11.7489 10.5368C12.0837 10.8715 12.0837 11.4142 11.7489 11.7489C11.4142 12.0837 10.8715 12.0837 10.5368 11.7489L6 7.21218L1.46323 11.7489C1.1285 12.0837 0.585786 12.0837 0.251052 11.7489C-0.0836839 11.4142 -0.0836839 10.8715 0.251052 10.5368L4.78782 6L0.251052 1.46323C-0.0836834 1.1285 -0.0836834 0.585786 0.251052 0.251051C0.585787 -0.0836838 1.1285 -0.0836838 1.46323 0.251051L6 4.78782L10.5368 0.251051Z" fill="#F8F5EC" />
          </svg>
        </Link>
      </div>
      <div className='mobile-placeholder'>
        <div>
          <TicketLogo className='mobile-logo' />
          <div className='mobile-slogan'>Сloud ticketing solution</div>
        </div>
        <Button link={{ search: `${search}&scheme` }} className='mobile-button' color='bordered' size='xlarge'>Select ticket</Button>
      </div>
      {loaded && <div className={cn('loader-content', { 'loader-content_mobile-visible': showScheme })}>
        <Outlet context={data} />
      </div>}
    </>
  )
}