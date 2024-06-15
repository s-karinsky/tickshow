/**
 * @typedef { Object } TicketOptions
 * @property { string } event_id - id мероприятия, для которого получаем билеты
 * @property { number } skip - кол-во пропущенных с начала списка записей 
 * @property { number } limit - ограничение по количеству выбираемых записей
 */

import {useQuery} from '@tanstack/react-query'
import {filter, group, order, pipe, renameKeys} from '../utils'
import {selectFlatArray} from './selector'
import {GetTrips} from "../Ibronevik_API";
import axios from "axios";

const ibronevik_api_link1 = "https://ibronevik.ru/taxi/c/TikShow/api/v1/"
async function fetchTickets(options) {
  const params = renameKeys({
    event_id: 'filter',
    skip: 'lo',
    limit: 'lc',
  }, options)
  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json"
  }
  const response = await axios.post(ibronevik_api_link1+"trip/get",{...params},{headers:headers})
  return response.data?.data
  //return await GetTrips(params)
}

/**
 * @param { TicketOptions } options
 * @param fn
 * @param queryOptions
 * @returns { import('@tanstack/react-query').UseQueryResult }
 */
export const useTickets = (options = {}, fn = {}, queryOptions = {}) => useQuery({
  ...queryOptions,
  queryKey: ['tickets', options],
  queryFn: () => fetchTickets(options),
  select: data => pipe(
    selectFlatArray,
    filter(fn.filter),
    order(fn.order),
    group(fn.group)
  )(data)
})
export default fetchTickets