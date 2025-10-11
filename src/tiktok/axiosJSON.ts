import axios from 'axios'

const Axios = axios.create({
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json;charse=UTF-8',
    'Accept-Language': 'zh-CN'
  }
})

// 请求拦截器
Axios.interceptors.request.use(
  (config) => {

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

const request = Axios.request

export default request
