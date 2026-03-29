import AuthPage from './pages/AuthPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  const path = window.location.pathname.toLowerCase()

  if (path === '/verify-email') {
    return <VerifyEmailPage />
  }

  if (path === '/dashboard') {
    return <DashboardPage />
  }

  return <AuthPage />
}

export default App