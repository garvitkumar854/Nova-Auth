import { useEffect, useState } from 'react'
import AuthPage from './pages/AuthPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'
import { getMe, refreshSession } from './services/api'

function App() {
  const [isBootstrapping, setIsBootstrapping] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const path = window.location.pathname.toLowerCase()

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const storedToken = localStorage.getItem('accessToken')

        if (storedToken) {
          const meResponse = await getMe()
          if (meResponse?.user) {
            localStorage.setItem('user', JSON.stringify(meResponse.user))
            setIsAuthenticated(true)
            return
          }
        }

        const refreshed = await refreshSession()
        if (refreshed?.accessToken) {
          localStorage.setItem('accessToken', refreshed.accessToken)
        }
        if (refreshed?.user) {
          localStorage.setItem('user', JSON.stringify(refreshed.user))
        } else {
          const meResponse = await getMe()
          if (meResponse?.user) {
            localStorage.setItem('user', JSON.stringify(meResponse.user))
          }
        }

        setIsAuthenticated(true)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        setIsAuthenticated(false)
      } finally {
        setIsBootstrapping(false)
      }
    }

    bootstrapAuth()
  }, [])

  if (isBootstrapping) {
    return <main className="dashboard-page">Loading...</main>
  }

  if (path === '/verify-email') {
    return <VerifyEmailPage />
  }

  if (path === '/' && isAuthenticated) {
    return <DashboardPage />
  }

  if (path === '/dashboard') {
    if (!isAuthenticated) {
      window.history.replaceState({}, '', '/')
      return <AuthPage />
    }

    return <DashboardPage />
  }

  return <AuthPage />
}

export default App