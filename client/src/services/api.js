import axios from 'axios'
import { API_BASE_URL } from '../utils/apiUrl'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000,
})

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
