import axios from 'axios'
import { API_BASE_URL } from '../utils/apiUrl'

import { getOrCreateDeviceId } from '../utils/deviceId'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

api.interceptors.request.use((config) => {
  const deviceId = getOrCreateDeviceId()
  if (deviceId) {
    config.headers['x-device-id'] = deviceId
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error?.response?.data
    if (data && typeof window !== 'undefined') {
      if (data.deviceBlocked) {
        window.dispatchEvent(
          new CustomEvent('seo:device-blocked', { detail: data })
        )
      } else if (data.deviceLimitReached) {
        window.dispatchEvent(
          new CustomEvent('seo:device-limit-reached', { detail: data })
        )
      }
    }
    return Promise.reject(error)
  }
)

export async function analyzeContent(payload) {
  const { data } = await api.post('/content/analyze', payload)
  return data
}

export async function submitLead(payload) {
  const { data } = await api.post('/leads', payload)
  return data
}

export async function generateTopics(payload) {
  const { data } = await api.post('/blog-topics/generate', payload)
  return data
}

export async function generateClusters(payload) {
  const { data } = await api.post('/blog-topics/clusters', payload)
  return data
}

export async function getBlogTopics(id) {
  const { data } = await api.get(`/blog-topics/${id}`)
  return data
}
