import { Outlet, useParams, useSearchParams } from "react-router-dom";
import { useQueries } from "@tanstack/react-query";
import cn from "classnames"
import { useUser } from "api/user";
import { getCartQuery } from "api/cart";
import { getEventQuery } from "api/event";
import { getTicketsQuery } from "api/tickets";
import { getConfigQuery } from "api/config";
import combineQueries from "./combine";
import './loader.scss'

export default function Loader() {
  const routeParams = useParams()
  const [ searchParams ] = useSearchParams()
  const id = routeParams.event_id || searchParams.get('event_id')
  const { data: authorized } = useUser()
  
  const enabled = authorized && !!id
  const { loaded, ...data } = useQueries({
    queries: [
      getConfigQuery({ enabled }),
      getEventQuery(id, { enabled }),
      getTicketsQuery(id, { enabled })
    ],
    combine: combineQueries
  })
  
  return (
    <>
      <div
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
      </div>
      {loaded && <div className='loader-content'>
        <Outlet context={data} />
      </div>}
    </>
  )
}