import { STORAGE_KEY_USER_EMAIL } from 'const'
import { axios } from 'utils/axios'
import { getFromLocalStorage } from 'utils/common'

export const getCartQuery = options => ({
  queryKey: ['cart', getFromLocalStorage(STORAGE_KEY_USER_EMAIL)],
  queryFn: async () => axios.post('cart'),
  cacheTime: Infinity,
  staleTime: Infinity,
  select: data => (data.cart || []).map(item => {
    const [hall_id, category, row, seat] = item.split(';')
    return {
      hall_id,
      category,
      row,
      seat,
      booking_limit: item.booking_limit
    }
  }),
  ...options,
})
