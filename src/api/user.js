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

export async function ChangeUser(token, u_hash, name, email, phone) {
  var data = {
    token: token,
    u_hash: u_hash,
    data: JSON.stringify({
      u_name: name,
      u_email: email,
      u_phone: phone,
    }),
  };
  try {
    return await axios.post("user", data);
  } catch (e) {
    console.log(e)
  }
}

export async function AuthUser(email = "", phone = "", auth_type = "e-mail") {
  if (email === null || email === undefined) {
    auth_type = "phone";
  }
  var data = {
    login: email || phone,
    type: auth_type,
    password: "ajekghet",
  };
  var auth_hash = await axios.post("auth", data);
  auth_hash = auth_hash.data.auth_hash;
  var req = await axios.post("token", {"auth_hash": auth_hash});
  return {
    token: req.data.data.token,
    u_hash: req.data.data.u_hash,
    u_id: req.data.auth_user.u_id,
  };
}