import { STORAGE_KEY_USER_EMAIL } from 'const'
import { axios } from 'utils/axios'
import { getFromLocalStorage } from 'utils/common'

export const getCartQuery = options => ({
  queryKey: ['cart', getFromLocalStorage(STORAGE_KEY_USER_EMAIL)],
  queryFn: async () => axios.post('cart'),
  cacheTime: Infinity,
  staleTime: Infinity,
  select: ({ data }) => (data.cart || []).map(item => {
    const [hall_id, category, row, seat] = item.prop?.split(';')
    return {
      hall_id,
      category,
      row,
      seat,
      inCart: true,
      booking_limit: item.booking_limit
    }
  }),
  ...options,
})

export async function updateCart(item, count) {
  const resp = await axios.post('cart', {}, {
    params: {
      prod: item.t_id,
      prop: ['hall_id', 'category', 'row', 'seat'].map(key => item[key]).join(';'),
      count
    }
  })
  return resp
}
