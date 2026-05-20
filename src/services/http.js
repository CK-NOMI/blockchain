import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

// 开发模式：角色→预设账号映射，自动登录获取真实 JWT
const ROLE_CREDENTIALS = {
  ADMIN:    { username: 'admin', password: 'admin123' },
  FARMER:   { username: 'farmer1', password: '123456' },
  PROCESSOR:{ username: 'processor1', password: '123456' },
  LOGISTICS:{ username: 'logistics1', password: '123456' },
  RETAIL:   { username: 'retail1', password: '123456' },
  REGULATOR:{ username: 'regulator1', password: '123456' },
}

let autoLoginPromise = null

async function ensureToken() {
  const token = localStorage.getItem('token')
  if (token && token.length > 30) return token

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const creds = ROLE_CREDENTIALS[user.role]
  if (!creds) return null

  // 防止并发重复登录
  if (!autoLoginPromise) {
    autoLoginPromise = (async () => {
      try {
        const res = await axios.post('/api/auth/login', { ...creds, role: user.role })
        const body = res.data
        if (body.code === 0) {
          localStorage.setItem('token', body.data.token)
          localStorage.setItem('user', JSON.stringify(body.data.user))
          return body.data.token
        }
        return null
      } catch {
        return null
      } finally {
        autoLoginPromise = null
      }
    })()
  }
  return autoLoginPromise
}

http.interceptors.request.use(async (config) => {
  let token = localStorage.getItem('token')
  if (!token || token.length < 30) {
    token = await ensureToken()
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const body = response.data
    if (body && typeof body.code === 'number') {
      if (body.code === 0) return body.data
      const err = new Error(body.msg || '请求失败')
      err.code = body.code
      return Promise.reject(err)
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const body = error.response.data
      const msg = body?.msg || '未登录，请先登录'
      return Promise.reject(new Error(msg))
    }
    return Promise.reject(error)
  },
)

export default http
