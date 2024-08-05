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

export async function MoveCart(token, u_hash, items, u_id) {
  var new_tickets_grouped = {};
  console.log("RECEIVED TO MOVE CART", items);
  items.forEach((item) => {
    if (!new_tickets_grouped[item.t_id]) {
      new_tickets_grouped[item.t_id] = [];
    }
    new_tickets_grouped[item.t_id].push(item);
  });
  console.log("MOVING CART ITEMS", new_tickets_grouped);

  var data = {
    token: token,
    u_hash: u_hash,
    item: JSON.stringify(new_tickets_grouped),
    u_id: u_id,
  };
  return await axios.post("cart/move", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
  });
}
export async function ClearSeats(token, u_hash, items) {
  var data = {
    token: token,
    u_hash: u_hash,
    item: JSON.stringify(items),
  };
  return await axios.post("cart/clear", data, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
  });
}