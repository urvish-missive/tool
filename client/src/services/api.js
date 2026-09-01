import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
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
