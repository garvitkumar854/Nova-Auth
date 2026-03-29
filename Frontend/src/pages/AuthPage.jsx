import { useState } from 'react'
import AuthShell from '../components/AuthShell'
import '../styles/auth-ui.css'

function AuthPage() {
  const [mode, setMode] = useState('register')

  return (
    <AuthShell>
      {mode === 'register' ? (
        <>
          <h1>Create your account</h1>
          <p className="subtitle">Simple, secure, and ready to use.</p>

          <form className="register-form" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="fullName">Full Name</label>
            <input id="fullName" type="text" placeholder="John Doe" />

            <label htmlFor="username">Username</label>
            <input id="username" type="text" placeholder="username" />

            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@example.com" />

            <button type="submit">Register</button>
          </form>

          <p className="switch-text">
            Already have an account?{' '}
            <button type="button" className="switch-link" onClick={() => setMode('login')}>
              Login
            </button>
          </p>
        </>
      ) : (
        <>
          <h1>Login to continue</h1>
          <p className="subtitle">Enter your credentials to access your account.</p>

          <form className="register-form" onSubmit={(e) => e.preventDefault()}>
            <label htmlFor="loginEmail">Email</label>
            <input id="loginEmail" type="email" placeholder="you@example.com" />

            <label htmlFor="loginPassword">Password</label>
            <input id="loginPassword" type="password" placeholder="Enter password" />

            <button type="submit">Login</button>
          </form>

          <p className="switch-text">
            Don&apos;t have an account?{' '}
            <button type="button" className="switch-link" onClick={() => setMode('register')}>
              Register
            </button>
          </p>
        </>
      )}

      <p className="test-route-note">
        UI testing routes:{' '}
        <a href="/verify-email" className="route-link">
          Verify email
        </a>
        {' • '}
        <a href="/dashboard" className="route-link">
          Dashboard
        </a>
      </p>
    </AuthShell>
  )
}

export default AuthPage
