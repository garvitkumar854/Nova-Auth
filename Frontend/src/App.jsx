import AuthPage from './pages/AuthPage'
import VerifyEmailPage from './pages/VerifyEmailPage'

function App() {
  const path = window.location.pathname.toLowerCase()

  if (path === '/verify-email') {
    return <VerifyEmailPage />
  }

  return <AuthPage />
}

export default App