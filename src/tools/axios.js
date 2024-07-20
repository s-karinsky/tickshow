import axiosHttp from 'axios'
import Cookies from 'universal-cookie'
import { getFormData } from './utils'

const API_URL = "https://ibronevik.ru/taxi/c/TikShow/api/v1/"

const cookies = new Cookies()

export const axios = axiosHttp.create({
  baseURL: API_URL
})

axios.interceptors.request.use(config => {
  const { data } = config
  const formData = (data instanceof URLSearchParams || data instanceof FormData) ? data : getFormData(data)
  formData.append('token', localStorage.getItem('phantom_user_token'))
  formData.append('u_hash', localStorage.getItem('phantom_user_u_hash'))
  config.data = formData
  return config
})