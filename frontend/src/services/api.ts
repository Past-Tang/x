import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Account API
export const accountsApi = {
  list: () => api.get('/accounts'),
  get: (id: number) => api.get(`/accounts/${id}`),
  create: (data: Record<string, unknown>) => api.post('/accounts', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/accounts/${id}`, data),
  delete: (id: number) => api.delete(`/accounts/${id}`),
  toggleStatus: (id: number) => api.post(`/accounts/${id}/toggle-status`),
}

// Targets API
export const targetsApi = {
  list: () => api.get('/targets'),
  get: (id: number) => api.get(`/targets/${id}`),
  create: (data: Record<string, unknown>) => api.post('/targets', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/targets/${id}`, data),
  delete: (id: number) => api.delete(`/targets/${id}`),
  toggleStatus: (id: number) => api.post(`/targets/${id}/toggle-status`),
}

// Reply Templates API
export const replyTemplatesApi = {
  list: () => api.get('/reply-templates'),
  get: (id: number) => api.get(`/reply-templates/${id}`),
  create: (data: Record<string, unknown>) => api.post('/reply-templates', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/reply-templates/${id}`, data),
  delete: (id: number) => api.delete(`/reply-templates/${id}`),
  toggleStatus: (id: number) => api.post(`/reply-templates/${id}/toggle-status`),
  reorder: (ids: number[]) => api.post('/reply-templates/reorder', { ids }),
}

// Post Jobs API
export const postJobsApi = {
  list: () => api.get('/post-jobs'),
  get: (id: number) => api.get(`/post-jobs/${id}`),
  create: (data: Record<string, unknown>) => api.post('/post-jobs', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/post-jobs/${id}`, data),
  delete: (id: number) => api.delete(`/post-jobs/${id}`),
  toggleStatus: (id: number) => api.post(`/post-jobs/${id}/toggle-status`),
  runNow: (id: number) => api.post(`/post-jobs/${id}/run`),
}

// Post Contents API
export const postContentsApi = {
  list: () => api.get('/post-contents'),
  get: (id: number) => api.get(`/post-contents/${id}`),
  create: (data: Record<string, unknown>) => api.post('/post-contents', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/post-contents/${id}`, data),
  delete: (id: number) => api.delete(`/post-contents/${id}`),
  toggleStatus: (id: number) => api.post(`/post-contents/${id}/toggle-status`),
  reorder: (ids: number[]) => api.post('/post-contents/reorder', { ids }),
}

// Logs API
export const logsApi = {
  list: (params?: Record<string, unknown>) => api.get('/logs', { params }),
  get: (id: number) => api.get(`/logs/${id}`),
  stats: () => api.get('/logs/stats'),
}

// Settings API
export const settingsApi = {
  list: () => api.get('/settings'),
  get: (key: string) => api.get(`/settings/${key}`),
  update: (key: string, data: Record<string, unknown>) => api.put(`/settings/${key}`, data),
  updateBatch: (settings: Record<string, unknown>) => api.put('/settings/batch', { settings }),
  init: () => api.post('/settings/init'),
}

export default api
