
export const CHECK_PATH_ID = 'checked-seat-path'
export const CATEGORY_CHECK_PATH_ID = 'checked-category-path'
export const SEAT_CLASS = 'svg-seat'
export const SEAT_CLASS_ACTIVE = `${SEAT_CLASS}_active`
export const SEAT_CLASS_SELECTED = `${SEAT_CLASS}_selected`
export const CURRENCY_SYMBOL_MAP = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  RUB: "₽",
  UAH: "₴",
  BYR: "p",
  KZT: "₸",
  KGS: "₸",
  CNY: "¥",
  INR: "₹",
  JPY: "¥",
  TRY: "₺",
}
export const MAX_SCALE = 8

export const STORAGE_KEY_USER_TOKEN = 'phantom_user_token'
export const STORAGE_KEY_USER_EMAIL = 'phantom_user_email'
export const STORAGE_KEY_USER_HASH = 'phantom_user_u_hash'

export const getPhantomUser = () => ({
  u_name: `Phantom-${Date.now()}`,
  u_role: '1',
  u_email: `${Date.now()}@client`,
  data: JSON.stringify({
    password: '123456',
  }),
})

export const DISTRIBUTE_PAGE_URL = "https://ticketing.tilda.ws/thank-you-page"