import axiosHttp from 'axios'
import { getFormData } from 'utils'
import { getFromLocalStorage } from 'utils/common'
import { STORAGE_KEY_USER_HASH, STORAGE_KEY_USER_TOKEN } from 'const'

const API_URL = "https://ibronevik.ru/taxi/c/TikShow/api/v1/"

export const axios = axiosHttp.create({
  baseURL: API_URL
})

axios.interceptors.request.use(config => {
  const { data } = config
  if (config.baseURL === API_URL) {
    const formData = (data instanceof URLSearchParams || data instanceof FormData) ? data : getFormData(data)
    const token = getFromLocalStorage(STORAGE_KEY_USER_TOKEN)
    const hash = getFromLocalStorage(STORAGE_KEY_USER_HASH)
    if (token && hash) {
      formData.append('token', token)
      formData.append('u_hash', hash)
    }
    config.data = formData
  }
  return config
})

axios.interceptors.response.use(response => {
  const { data: { code, status } = {} } = response
  if (!code || !status) {
    return response
  }
  if (Number(code) >= 300 || status !== 'success') {
    throw new Error(response)
  }
  return response?.data || response
})