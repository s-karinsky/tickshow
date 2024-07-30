import { Outlet, useParams } from "react-router-dom";
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