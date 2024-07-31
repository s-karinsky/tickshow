import { useQuery } from '@tanstack/react-query'
import { getPhantomUser, STORAGE_KEY_USER_EMAIL, STORAGE_KEY_USER_HASH, STORAGE_KEY_USER_TOKEN } from 'const'
import { axios } from 'utils/axios'
import { getFromLocalStorage, setLocalStorage } from 'utils/common'

const login = async () => {
  let user
  if (getFromLocalStorage(STORAGE_KEY_USER_TOKEN) && getFromLocalStorage(STORAGE_KEY_USER_HASH)) {
    try {
      user = await axios.post('user')
    } catch (e) {
      user = null
    }
  }
  if (!user) {
    const userData = getPhantomUser()
    user = await axios.post('register', { ...userData, st: 1 })
      .then((response) => {
        const { data } = response
        if (data.token && data.u_hash) {
          setLocalStorage(STORAGE_KEY_USER_EMAIL, userData.u_email)
          setLocalStorage(STORAGE_KEY_USER_TOKEN, data.token)
          setLocalStorage(STORAGE_KEY_USER_HASH, data.u_hash)
        }
        return response
      })
  }
  return user.status === 'success'
}

export const useUser = () => useQuery({
  queryKey: ['user'],
  queryFn: login,
  staleTime: Infinity,
})