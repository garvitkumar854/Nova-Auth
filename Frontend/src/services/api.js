const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function getAccessToken() {
  return localStorage.getItem('accessToken') || ''
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data?.message || `Request failed with status ${response.status}`
    throw new Error(message)
  }

  return data
}

export function register(payload) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function login(payload) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function verifyEmail(payload) {
  return request('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function refreshSession() {
  return request('/auth/refresh-token', {
    method: 'POST',
  })
}

export function getMe() {
  return request('/auth/me', {
    method: 'GET',
  })
}

export function updateFullName(payload) {
  return request('/auth/profile/full-name', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function updateUsername(payload) {
  return request('/auth/profile/username', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getSessions() {
  return request('/auth/sessions', {
    method: 'GET',
  })
}

export function logoutSession(payload) {
  return request('/auth/logout-session', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logout() {
  return request('/auth/logout', {
    method: 'POST',
  })
}

export function logoutAll() {
  return request('/auth/logout-all', {
    method: 'POST',
  })
}

export function deleteAccount(payload) {
  return request('/auth/delete-account', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
